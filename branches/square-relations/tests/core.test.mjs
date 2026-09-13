import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { MAX_BLOCKS, MAX_SOURCE_BYTES, DEFAULT_SOURCE, createSquareModel, cellFor } from '../core.mjs';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function assertCompleteClosure(model) {
  const n = model.elements.length;
  const seen = new Set();
  for (const pair of model.pairs) {
    const first = model.elements.findIndex(element => element.id === pair.a);
    const second = model.elements.findIndex(element => element.id === pair.b);
    assert.ok(first >= 0 && second > first, 'each pair has two different, ordered source indices');
    const key = `${first}:${second}`;
    assert.ok(!seen.has(key), `duplicate pair ${key}`);
    seen.add(key);
    assert.equal(pair.leftEndpoint.id, pair.a);
    assert.equal(pair.rightEndpoint.id, pair.b);
    assert.equal(pair.leftEndpoint.digest, model.elements[first].sha256);
    assert.equal(pair.rightEndpoint.digest, model.elements[second].sha256);
    assert.equal(pair.leftEndpoint.fieldLocator, `/elements/${first}/text`);
    assert.equal(pair.rightEndpoint.fieldLocator, `/elements/${second}/text`);
    for (const endpoint of [pair.leftEndpoint, pair.rightEndpoint]) {
      assert.equal(endpoint.kind, 'TEXT_BLOCK');
      assert.equal(endpoint.scope, 'CURRENT_SOURCE_SNAPSHOT');
    }
    assert.equal(pair.relationDefinitionId, 'USER_REQUESTED_PAIR_COMPARISON_V1');
    assert.equal(pair.meaning, 'UNASSIGNED');
    assert.equal(pair.direction, 'UNDIRECTED');
    assert.equal(pair.authorityEffect, 'NONE');
    assert.equal(cellFor(model, first, second).pairId, pair.id);
    assert.equal(cellFor(model, second, first).pairId, pair.id);
  }
  for (let first = 0; first < n; first += 1) {
    for (let second = first + 1; second < n; second += 1) {
      assert.ok(seen.has(`${first}:${second}`), `missing comparison ${first}:${second}`);
    }
  }
  assert.equal(seen.size, n * (n - 1) / 2);
}

test('default preserves every requested symbol and covers all quadrant pairs', async () => {
  const expected = ['❤️', '🙂', 'WORT', '—', '0', '+665', '-0', '?', '§', '∞', '<3', '🤝', '💬', '💾', '↔', '🌱'];
  const model = await createSquareModel(DEFAULT_SOURCE);
  assert.equal(model.schemaVersion, '1.0.0');
  assert.deepEqual(model.elements.map(element => element.text), expected);
  assert.equal(model.side, 4);
  assert.deepEqual(model.counts, { elements: 16, unorderedPairs: 120, matrixCells: 256, selfCells: 16 });
  assert.deepEqual(model.elements.map(element => element.sector), [0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3]);
  assertCompleteClosure(model);
  const crossSectorPairs = new Set(model.pairs.map(pair => {
    const a = model.elements.find(element => element.id === pair.a).sector;
    const b = model.elements.find(element => element.id === pair.b).sector;
    return [a, b].sort().join(':');
  }));
  for (let a = 0; a < 4; a += 1) {
    for (let b = a; b < 4; b += 1) assert.ok(crossSectorPairs.has(`${a}:${b}`));
  }
});

test('matrix is complete, symmetric and self cells have no pair', async () => {
  const model = await createSquareModel('a\nb\nc\nd\ne');
  assertCompleteClosure(model);
  assert.equal(model.matrix.length, 25);
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const cell = cellFor(model, row, column);
      assert.equal(cell.row, row);
      assert.equal(cell.column, column);
      assert.equal(cell.kind, row === column ? 'SELF' : 'PAIR');
      assert.equal(cell.pairId, cellFor(model, column, row).pairId);
      assert.equal(cell.pairId === null, row === column);
    }
  }
});

test('single block has one self cell; unused layout slots do not create elements', async () => {
  const one = await createSquareModel('❤️');
  assert.equal(one.side, 1);
  assert.equal(one.elements[0].sector, 0);
  assert.deepEqual(one.pairs, []);
  assert.deepEqual(one.matrix, [{ row: 0, column: 0, kind: 'SELF', pairId: null }]);
  const five = await createSquareModel('1\n2\n3\n4\n5');
  assert.equal(five.side, 3);
  assert.equal(five.elements.length, 5);
  assert.deepEqual(five.elements.map(({ row, col, sector }) => [row, col, sector]), [
    [0, 0, 0], [0, 1, 0], [0, 2, 1], [1, 0, 0], [1, 1, 0],
  ]);
});

test('heart variation selectors, ZWJ, emoji modifiers and combining marks stay exact', async () => {
  const lines = ['❤', '❤️', '👩🏽‍💻', 'é', 'e\u0301', '\uFEFFstart', '漢字'];
  const text = lines.join('\n');
  const model = await createSquareModel(text);
  assert.equal(model.source.text, text);
  assert.equal(model.source.utf16Length, text.length);
  assert.equal(model.source.utf8Bytes, Buffer.byteLength(text, 'utf8'));
  assert.equal(model.source.sha256, sha256(text));
  assert.deepEqual(model.elements.map(element => element.text), lines);
  for (const element of model.elements) {
    assert.equal(text.slice(element.span.start, element.span.end), element.text);
    assert.equal(element.sha256, sha256(element.text));
  }
  assert.notEqual(model.elements[0].sha256, model.elements[1].sha256);
  assert.notEqual(model.elements[3].sha256, model.elements[4].sha256);
});

test('repeated identical blocks retain separate positions, IDs and comparisons', async () => {
  const model = await createSquareModel('❤️\n❤️\n❤️');
  assert.deepEqual(model.elements.map(element => element.id), ['element-0001', 'element-0002', 'element-0003']);
  assert.equal(new Set(model.elements.map(element => element.sha256)).size, 1);
  assert.equal(new Set(model.elements.map(element => element.span.start)).size, 3);
  assert.equal(model.pairs.length, 3);
  assertCompleteClosure(model);
});

test('mixed CRLF/LF boundaries retain exact source and half-open UTF16 spans', async () => {
  const text = '🙂\r\n\r\n x \n-0\rZ\r\n';
  const model = await createSquareModel(text);
  assert.equal(model.source.text, text);
  assert.deepEqual(model.elements.map(element => element.text), ['🙂', '', ' x ', '-0\rZ', '']);
  assert.deepEqual(model.elements.map(element => element.span), [
    { start: 0, end: 2 }, { start: 4, end: 4 }, { start: 6, end: 9 },
    { start: 10, end: 14 }, { start: 16, end: 16 },
  ]);
  for (const element of model.elements) assert.equal(text.slice(element.span.start, element.span.end), element.text);
});

test('blank, whitespace, punctuation, numbers and source-like strings remain data', async () => {
  const lines = ['', ' ', '\t', '0', '+665', '-0', '—', '<3', 'globalThis.__squareExecuted = true;', ''];
  delete globalThis.__squareExecuted;
  const model = await createSquareModel(lines.join('\n'));
  assert.deepEqual(model.elements.map(element => element.text), lines);
  assert.equal(globalThis.__squareExecuted, undefined);
  assert.equal(model.elements[0].sha256, sha256(''));
  assert.equal((await createSquareModel('\n')).elements.length, 2);
  assert.equal((await createSquareModel(' ')).elements[0].text, ' ');
});

test('empty or non-string inputs are explicitly rejected', async () => {
  await assert.rejects(createSquareModel(''), { name: 'RangeError', message: /at least one character/ });
  for (const value of [undefined, null, 1, {}, [], new String('a')]) {
    await assert.rejects(createSquareModel(value), { name: 'TypeError', message: /must be a string/ });
  }
});

test('invalid surrogate sequences are rejected instead of UTF8 replacement', async () => {
  for (const value of ['\ud800', '\udfff', 'a\ud800b', '\ud800\ud800\udc00', '\udc00\ud800']) {
    await assert.rejects(createSquareModel(value), { name: 'TypeError', message: /Malformed Unicode/ });
  }
  const valid = await createSquareModel('\ud83d\ude42');
  assert.equal(valid.source.utf8Bytes, 4);
  assert.equal(valid.source.utf16Length, 2);
});

test('exact block ceiling is accepted and exceeding it never truncates', async () => {
  assert.equal(MAX_BLOCKS, 64);
  const model = await createSquareModel(Array.from({ length: MAX_BLOCKS }, (_, i) => `${i}`).join('\r\n'));
  assert.equal(model.counts.elements, 64);
  assert.equal(model.counts.unorderedPairs, 2016);
  assert.equal(model.counts.matrixCells, 4096);
  assertCompleteClosure(model);
  await assert.rejects(createSquareModel(Array(65).fill('x').join('\n')), { name: 'RangeError', message: /64 text blocks/ });
  await assert.rejects(createSquareModel('\n'.repeat(64)), { name: 'RangeError', message: /64 text blocks/ });
});

test('byte ceiling applies to UTF8 including multibyte text and line separators', async () => {
  assert.equal(MAX_SOURCE_BYTES, 8192);
  assert.equal((await createSquareModel('a'.repeat(8192))).source.utf8Bytes, 8192);
  assert.equal((await createSquareModel('🙂'.repeat(2048))).source.utf8Bytes, 8192);
  for (const text of ['a'.repeat(8193), '🙂'.repeat(2049), '🙂'.repeat(2048) + '\n']) {
    await assert.rejects(createSquareModel(text), { name: 'RangeError', message: /8192 UTF-8 bytes/ });
  }
});

test('digests are stable byte hashes and changed content affects its bound digest', async () => {
  const first = await createSquareModel('❤️\nA');
  assert.deepEqual(await createSquareModel('❤️\nA'), first);
  const changed = await createSquareModel('❤️\nB');
  assert.notEqual(first.source.sha256, changed.source.sha256);
  assert.equal(first.elements[0].sha256, changed.elements[0].sha256);
  assert.notEqual(first.elements[1].sha256, changed.elements[1].sha256);
  assert.notEqual(first.pairs[0].rightEndpoint.digest, changed.pairs[0].rightEndpoint.digest);
  const changedSeparator = await createSquareModel('❤️\r\nA');
  assert.notEqual(first.source.sha256, changedSeparator.source.sha256);
  assert.deepEqual(first.elements.map(element => element.sha256), changedSeparator.elements.map(element => element.sha256));
  assert.equal(first.source.sha256, sha256('❤️\nA'));
});

test('returned model is deeply frozen including endpoints, spans, matrix and arrays', async () => {
  const model = await createSquareModel('❤️\n🙂');
  function check(value) {
    if (value !== null && typeof value === 'object') {
      assert.ok(Object.isFrozen(value));
      for (const child of Object.values(value)) check(child);
    }
  }
  check(model);
  assert.throws(() => { model.elements[0].text = 'changed'; }, TypeError);
  assert.throws(() => { model.elements[0].span.start = 4; }, TypeError);
  assert.throws(() => { model.pairs[0].leftEndpoint.digest = ''; }, TypeError);
  assert.throws(() => { model.matrix.push({}); }, TypeError);
  assert.equal(model.elements[0].text, '❤️');
});

test('cell lookup rejects coercion, out-of-range indices and incomplete models', async () => {
  const model = await createSquareModel('a\nb');
  for (const [row, col] of [[-1, 0], [0, 2], ['0', 0], [0.5, 0], [NaN, 0], [0, undefined]]) {
    assert.throws(() => cellFor(model, row, col), RangeError);
  }
  assert.throws(() => cellFor({}, 0, 0), TypeError);
  assert.throws(() => cellFor({ elements: ['a'], matrix: [] }, 0, 0), TypeError);
});
