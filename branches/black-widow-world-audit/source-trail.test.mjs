import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSourceTrail } from './source-trail.mjs';

const original = JSON.parse(readFileSync(new URL('./source-trail.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(original);

test('the public trail binds every endpoint and leaves content capture unclaimed', () => {
  assert.deepEqual(validateSourceTrail(copy()), {
    sourceCount: 6,
    relationCount: 3,
    openQuestionCount: 3,
    fullDocumentCount: 0,
    claimCeiling: 'DECLARED_PUBLIC_SOURCE_TRAIL_ONLY'
  });
});

test('a URL or excerpt cannot carry a fabricated content digest', () => {
  const packet = copy();
  packet.sources[0].contentDigest = `sha256:${'a'.repeat(64)}`;
  assert.throws(() => validateSourceTrail(packet), /contentDigest/);
});

test('private paths, embedded credentials and onion addresses stay outside the public source packet', () => {
  const credentialUrl = `https://user:pass${String.fromCharCode(64)}example.org/a`;
  for (const url of ['file:///C:/private/report.pdf', credentialUrl, 'http://example.org/a', 'http://exampleonion.onion/a']) {
    const packet = copy();
    packet.sources[0].url = url;
    assert.throws(() => validateSourceTrail(packet), /url/);
  }
});

test('an answer or report may not point to an unknown source or become a cycle', () => {
  const missing = copy();
  missing.relations[0].to = 'MISSING';
  assert.throws(() => validateSourceTrail(missing), /endpoints/);
  const cycle = copy();
  cycle.relations.push({id:'REL_BACK', from:'UN_US_2023_661', to:'UN_SG_2023_975', type:'DERIVED_FROM', basis:'Synthetic invalid loop.'});
  assert.throws(() => validateSourceTrail(cycle), /cycle/);
});

test('questions require exact referenced sources and a reopening observation', () => {
  const packet = copy();
  packet.questions[0].sourceIds = ['BA_INVENIO_GUIDE', 'BA_INVENIO_GUIDE'];
  assert.throws(() => validateSourceTrail(packet), /sourceIds/);
  packet.questions[0].sourceIds = ['BA_INVENIO_GUIDE'];
  packet.questions[0].reopenTrigger = '';
  assert.throws(() => validateSourceTrail(packet), /reopenTrigger/);
});
