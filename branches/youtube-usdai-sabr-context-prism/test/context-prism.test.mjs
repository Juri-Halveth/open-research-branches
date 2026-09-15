import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

test('every relation connects declared endpoints with an explicit type', () => {
  const data = read('relations.json');
  const endpoints = new Set([
    ...data.contentPackets.map((item) => item.id),
    ...data.eventPackets.map((item) => item.id)
  ]);
  for (const relation of data.relations) {
    assert.ok(endpoints.has(relation.left));
    assert.ok(endpoints.has(relation.right));
    assert.ok(relation.relationType);
    assert.ok(relation.evidenceState);
  }
});

test('the four referents remain distinct and the open definition is preserved', () => {
  const relations = read('relations.json');
  assert.equal(relations.contentPackets.length, 4);
  assert.equal(new Set(relations.contentPackets.map((item) => item.domain)).size, 3);
  assert.ok(relations.observationGaps.some((gap) => gap.id === 'GAP01_USDAI_LONG_FORM' && gap.state === 'UNKNOWN'));
});

test('the claim ledger contains no wallet, key, trading or payment assertion', () => {
  const claims = read('claims.json');
  const boundary = claims.claims.find((claim) => claim.id === 'C07_CLAIM_BOUNDARY');
  assert.equal(boundary.evidenceState, 'NOT_PROVEN');
  assert.match(boundary.statement, /No bound source establishes/u);
  const lenses = read('entity-lenses.json');
  assert.equal(lenses.defaultRule.runtimeEntityId, 'context-prism');
  assert.match(lenses.claimCeiling, /NOT_IDENTITIES_AUTHORITIES_AGENTS_OR_EVIDENCE_SOURCES/u);
});
