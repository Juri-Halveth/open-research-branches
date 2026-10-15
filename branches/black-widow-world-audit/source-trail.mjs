import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ID = /^[A-Z][A-Z0-9_]{2,63}$/;
const SURFACES = new Set([
  'PUBLIC_ARCHIVE_GUIDE', 'PUBLIC_TECHNICAL_GUIDE',
  'PUBLIC_PRIMARY_SUBMISSION', 'PUBLIC_REPORT'
]);
const READ_SCOPES = new Set([
  'METADATA_ONLY', 'SEARCH_EXCERPT_REVIEWED',
  'PAGE_EXCERPT_REVIEWED', 'PAGE_TEXT_REVIEWED', 'FULL_DOCUMENT_REVIEWED'
]);
const RELATIONS = new Set(['RESPONDS_TO', 'REPORTS_SUBMISSION', 'DERIVED_FROM']);
const STATES = new Set(['DISCOVERY_ONLY', 'CONTESTED_SUBMISSIONS', 'NO_TARGET_BOUND']);

function fail(path, reason) { throw new Error(`${path}: ${reason}`); }
function keys(value, expected, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object required');
  const actual = Object.keys(value).sort();
  if (actual.join('|') !== [...expected].sort().join('|')) fail(path, `exact keys required: ${expected.join(', ')}`);
}
function string(value, path) {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'nonempty string required');
}
function id(value, path) {
  if (typeof value !== 'string' || !ID.test(value)) fail(path, 'ASCII ID required');
}
function date(value, path) {
  if (value === 'UNKNOWN') return;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) fail(path, 'exact date or UNKNOWN required');
}

/** Validates declared provenance structure; it does not fetch URLs or judge historical truth. */
export function validateSourceTrail(packet) {
  keys(packet, ['schema', 'snapshotDate', 'baselineCommit', 'dataClass', 'sources', 'relations', 'questions'], 'packet');
  if (packet.schema !== 'halveth.black-widow.source-trail.v1') fail('schema', 'unsupported');
  date(packet.snapshotDate, 'snapshotDate');
  if (!/^[0-9a-f]{40}$/.test(packet.baselineCommit)) fail('baselineCommit', '40-hex commit required');
  if (packet.dataClass !== 'PUBLIC_SOURCES_ONLY') fail('dataClass', 'public-only packet required');
  if (!Array.isArray(packet.sources) || !packet.sources.length) fail('sources', 'nonempty array required');
  if (!Array.isArray(packet.relations) || !Array.isArray(packet.questions)) fail('packet', 'relation and question arrays required');

  const sourceIds = new Set();
  for (const [i, source] of packet.sources.entries()) {
    const path = `sources[${i}]`;
    keys(source, ['id', 'title', 'publisher', 'url', 'documentId', 'publishedDate', 'observedDate', 'surface', 'readScope', 'lineageId', 'contentDigest', 'scopeNote'], path);
    id(source.id, `${path}.id`);
    if (sourceIds.has(source.id)) fail(`${path}.id`, 'duplicate');
    sourceIds.add(source.id);
    for (const field of ['title', 'publisher', 'documentId', 'scopeNote']) string(source[field], `${path}.${field}`);
    id(source.lineageId, `${path}.lineageId`);
    date(source.publishedDate, `${path}.publishedDate`);
    date(source.observedDate, `${path}.observedDate`);
    if (source.observedDate === 'UNKNOWN' || source.observedDate > packet.snapshotDate) fail(`${path}.observedDate`, 'date must be within snapshot');
    if (!SURFACES.has(source.surface)) fail(`${path}.surface`, 'unsupported');
    if (!READ_SCOPES.has(source.readScope)) fail(`${path}.readScope`, 'unsupported');
    let url;
    try { url = new URL(source.url); } catch { fail(`${path}.url`, 'absolute URL required'); }
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname || url.hostname.endsWith('.onion'))
      fail(`${path}.url`, 'public HTTPS publisher URL required');
    if (source.contentDigest !== null)
      fail(`${path}.contentDigest`, 'v1 has no byte-capture receipt; a digest would be an unverified declaration');
  }

  const relationIds = new Set();
  const forward = new Map([...sourceIds].map(sourceId => [sourceId, []]));
  for (const [i, relation] of packet.relations.entries()) {
    const path = `relations[${i}]`;
    keys(relation, ['id', 'from', 'to', 'type', 'basis'], path);
    id(relation.id, `${path}.id`);
    if (relationIds.has(relation.id)) fail(`${path}.id`, 'duplicate');
    relationIds.add(relation.id);
    if (!sourceIds.has(relation.from) || !sourceIds.has(relation.to) || relation.from === relation.to)
      fail(path, 'two distinct known source endpoints required');
    if (!RELATIONS.has(relation.type)) fail(`${path}.type`, 'unsupported');
    string(relation.basis, `${path}.basis`);
    forward.get(relation.from).push(relation.to);
  }
  const visited = new Set(), visiting = new Set();
  function walk(sourceId) {
    if (visiting.has(sourceId)) fail('relations', 'cycle detected');
    if (visited.has(sourceId)) return;
    visiting.add(sourceId);
    for (const next of forward.get(sourceId)) walk(next);
    visiting.delete(sourceId);
    visited.add(sourceId);
  }
  for (const sourceId of sourceIds) walk(sourceId);

  const questionIds = new Set();
  for (const [i, question] of packet.questions.entries()) {
    const path = `questions[${i}]`;
    keys(question, ['id', 'title', 'state', 'sourceIds', 'nextEvidence', 'reopenTrigger'], path);
    id(question.id, `${path}.id`);
    if (questionIds.has(question.id)) fail(`${path}.id`, 'duplicate');
    questionIds.add(question.id);
    if (!STATES.has(question.state)) fail(`${path}.state`, 'unsupported');
    for (const field of ['title', 'nextEvidence', 'reopenTrigger']) string(question[field], `${path}.${field}`);
    if (!Array.isArray(question.sourceIds) || !question.sourceIds.length ||
        new Set(question.sourceIds).size !== question.sourceIds.length ||
        question.sourceIds.some(sourceId => !sourceIds.has(sourceId))) fail(`${path}.sourceIds`, 'unique known source IDs required');
  }
  return Object.freeze({
    sourceCount: sourceIds.size,
    relationCount: relationIds.size,
    openQuestionCount: questionIds.size,
    fullDocumentCount: packet.sources.filter(source => source.readScope === 'FULL_DOCUMENT_REVIEWED').length,
    claimCeiling: 'DECLARED_PUBLIC_SOURCE_TRAIL_ONLY'
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const packet = JSON.parse(readFileSync(new URL('./source-trail.json', import.meta.url), 'utf8'));
  const result = validateSourceTrail(packet);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
