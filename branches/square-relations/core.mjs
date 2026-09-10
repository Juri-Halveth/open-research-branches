/**
 * A finite all-pairs comparison model of exact text blocks.
 * Digests identify UTF-8 bytes; they do not establish authorship, truth,
 * physical relationships, or an event time. Source content is never executed.
 */
export const MAX_BLOCKS = 64;
export const MAX_SOURCE_BYTES = 8192;
export const DEFAULT_SOURCE = [
  '❤️', '🙂', 'WORT', '—', '0', '+665', '-0', '?',
  '§', '∞', '<3', '🤝', '💬', '💾', '↔', '🌱',
].join('\n');

const RELATION_DEFINITION_ID = 'USER_REQUESTED_PAIR_COMPARISON_V1';
const encoder = new TextEncoder();

function assertUnicodeScalars(text) {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const following = text.charCodeAt(index + 1);
      if (!(following >= 0xdc00 && following <= 0xdfff)) {
        throw new TypeError(`Malformed Unicode: unpaired high surrogate at UTF-16 offset ${index}.`);
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new TypeError(`Malformed Unicode: unpaired low surrogate at UTF-16 offset ${index}.`);
    }
  }
}

async function digest(bytes) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 requires Web Crypto in a secure browser context or Node.js 20+.');
  }
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}

function exactBlocks(text) {
  const blocks = [];
  const separators = /\r?\n/g;
  let start = 0;
  for (const match of text.matchAll(separators)) {
    blocks.push({ text: text.slice(start, match.index), span: { start, end: match.index } });
    start = match.index + match[0].length;
    if (blocks.length >= MAX_BLOCKS) {
      throw new RangeError(`Source exceeds ${MAX_BLOCKS} text blocks; no blocks were truncated.`);
    }
  }
  blocks.push({ text: text.slice(start), span: { start, end: text.length } });
  return blocks;
}

const padded = number => String(number).padStart(4, '0');
const pairIdFor = (first, second) => `pair-${padded(first + 1)}-${padded(second + 1)}`;

function endpointFor(element, index) {
  return {
    kind: 'TEXT_BLOCK',
    id: element.id,
    digest: element.sha256,
    fieldLocator: `/elements/${index}/text`,
    scope: 'CURRENT_SOURCE_SNAPSHOT',
  };
}

function deepFreeze(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

/**
 * One exact block per LF/CRLF-delimited line, including empty lines.
 * Spans are half-open UTF-16 offsets into the unchanged source, excluding
 * separators. Bare CR characters are content. No Unicode normalization occurs.
 *
 * Rows and columns are zero-based. Sectors are quadrants of the square:
 * 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right. For odd sides, the
 * extra row/column belongs to the top/left half. Unused square slots are empty.
 *
 * The matrix is flat and row-major. Every different-block cell refers to
 * exactly one unordered pair; its transposed cell refers to the same pair.
 * Pair comparison is user requested; pair meaning remains unassigned.
 */
export async function createSquareModel(text) {
  if (typeof text !== 'string') throw new TypeError('Source must be a string.');
  if (text.length === 0) throw new RangeError('Source must contain at least one character.');
  // Every well-formed Unicode scalar requires at least as many UTF-8 bytes as
  // UTF-16 code units. This prevents an oversized input allocation up front.
  if (text.length > MAX_SOURCE_BYTES) {
    throw new RangeError(`Source exceeds ${MAX_SOURCE_BYTES} UTF-8 bytes; no source was truncated.`);
  }
  assertUnicodeScalars(text);
  const bytes = encoder.encode(text);
  if (bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new RangeError(`Source exceeds ${MAX_SOURCE_BYTES} UTF-8 bytes; no source was truncated.`);
  }
  const blocks = exactBlocks(text);
  const side = Math.ceil(Math.sqrt(blocks.length));
  const half = Math.ceil(side / 2);
  const [sourceDigest, elementDigests] = await Promise.all([
    digest(bytes),
    Promise.all(blocks.map(block => digest(encoder.encode(block.text)))),
  ]);
  const elements = blocks.map((block, index) => {
    const row = Math.floor(index / side);
    const col = index % side;
    return {
      id: `element-${padded(index + 1)}`,
      text: block.text,
      span: block.span,
      row,
      col,
      sector: (row >= half ? 2 : 0) + (col >= half ? 1 : 0),
      sha256: elementDigests[index],
    };
  });
  const pairs = [];
  for (let first = 0; first < elements.length; first += 1) {
    for (let second = first + 1; second < elements.length; second += 1) {
      pairs.push({
        id: pairIdFor(first, second),
        a: elements[first].id,
        b: elements[second].id,
        leftEndpoint: endpointFor(elements[first], first),
        rightEndpoint: endpointFor(elements[second], second),
        relationDefinitionId: RELATION_DEFINITION_ID,
        meaning: 'UNASSIGNED',
        direction: 'UNDIRECTED',
        authorityEffect: 'NONE',
      });
    }
  }
  const matrix = [];
  for (let row = 0; row < elements.length; row += 1) {
    for (let column = 0; column < elements.length; column += 1) {
      matrix.push({
        row,
        column,
        kind: row === column ? 'SELF' : 'PAIR',
        pairId: row === column ? null : pairIdFor(Math.min(row, column), Math.max(row, column)),
      });
    }
  }
  return deepFreeze({
    schemaVersion: '1.0.0',
    source: { text, sha256: sourceDigest, utf8Bytes: bytes.byteLength, utf16Length: text.length },
    side,
    elements,
    pairs,
    matrix,
    counts: {
      elements: elements.length,
      unorderedPairs: pairs.length,
      matrixCells: matrix.length,
      selfCells: elements.length,
    },
  });
}

/** Read a zero-based cell from the flat matrix without silently coercing inputs. */
export function cellFor(model, row, column) {
  const count = model?.elements?.length;
  if (!Number.isInteger(count) || !Array.isArray(model?.matrix) || model.matrix.length !== count * count) {
    throw new TypeError('Expected a square-relations model with a complete matrix.');
  }
  if (!Number.isInteger(row) || !Number.isInteger(column) || row < 0 || column < 0 || row >= count || column >= count) {
    throw new RangeError('Matrix row and column must be integer indices within the model.');
  }
  return model.matrix[row * count + column];
}
