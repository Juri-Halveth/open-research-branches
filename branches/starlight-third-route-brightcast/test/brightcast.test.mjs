import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

test('canon, interpretation and counterfactual stay in separate states', () => {
  const claims = read('claims.json').claims;
  assert.equal(claims.find((item) => item.id === 'C03_BECCA_ACCOUNT').state, 'SOURCE_BOUND');
  assert.equal(claims.find((item) => item.id === 'C05_THIRD_ROUTE').state, 'HYPOTHESIS');
  assert.equal(claims.find((item) => item.id === 'C06_CROSS_FRANCHISE').state, 'INTERPRETIVE_FRAME');
  assert.match(claims.find((item) => item.id === 'C03_BECCA_ACCOUNT').statement, /rape/u);
});

test('the video contract imports no franchise audiovisual asset or likeness', () => {
  const board = read('storyboard.json');
  assert.equal(board.format.platform, 'YOUTUBE');
  assert.equal(board.format.aspectRatio, '16:9');
  assert.equal(board.editorialContract.actorFootage, false);
  assert.equal(board.editorialContract.actorLikeness, false);
  assert.equal(board.editorialContract.userBiometricLikeness, false);
  const sources = read('sources.json');
  assert.match(sources.sourceBoundary, /no clips, stills, logos, music or actor likenesses/iu);
});

test('open real-person referents remain internal and unresolved', () => {
  const board = read('storyboard.json');
  assert.deepEqual(board.editorialContract.openReferents, ['A*', 'D*']);
  assert.equal(board.editorialContract.openReferentHandling, 'INTERNAL_LEDGER_ONLY_NO_PUBLIC_TAGGING');
  const metadata = read('youtube-metadata.json');
  assert(!metadata.tags.includes('A*'));
  assert(!metadata.tags.includes('D*'));
});

test('relations close only over declared endpoints and typed links', () => {
  const data = read('relations.json');
  const endpoints = new Set([
    ...data.contentPackets.map((item) => item.id),
    ...data.eventPackets.map((item) => item.id)
  ]);
  for (const relation of data.relations) {
    assert.ok(endpoints.has(relation.left), relation.left);
    assert.ok(endpoints.has(relation.right), relation.right);
    assert.ok(relation.relationType);
    assert.ok(relation.state);
  }
  assert.match(data.relationBoundary, /No relation asserts shared canon/u);
});

test('every source is unique, public and bound to a support list', () => {
  const sources = read('sources.json').sources;
  assert.equal(new Set(sources.map((item) => item.id)).size, sources.length);
  assert.equal(new Set(sources.map((item) => item.url)).size, sources.length);
  for (const source of sources) {
    assert.match(source.url, /^https:\/\//u);
    assert.ok(source.supports.length > 0);
    assert.ok(source.evidenceState);
  }
});

test('YouTube publication remains a separate external action', () => {
  const metadata = read('youtube-metadata.json');
  assert.equal(metadata.uploadState, 'NOT_UPLOADED_TO_YOUTUBE');
  assert.equal(metadata.githubPublicationAuthorized, true);
  assert.equal(metadata.youtubePublicationAuthorized, false);
  assert.equal(metadata.audience, 'NOT_MADE_FOR_KIDS');
});

test('the navigation receipt covers the complete declared research aperture', () => {
  const frame = read('navigation-frame.json');
  const receipt = read('navigation-receipt.json');
  assert.equal(frame.axisRegistry.length, 8);
  assert.equal(frame.axisEvaluations.length, 8);
  assert.deepEqual(new Set(frame.adapterRequiredAxisIds), new Set(frame.axisRegistry.map((item) => item.axisId)));
  assert.equal(receipt.coverageState, 'COMPLETE_FOR_DECLARED_ADAPTER_APERTURE');
  assert.equal(receipt.computedOutcome, 'RETURN_TO_PARENT');
  assert.equal(receipt.authority.mode, 'GITHUB_PUBLICATION_AUTHORIZED_YOUTUBE_UPLOAD_NOT_AUTHORIZED');
});

test('the final manifest hashes outputs but never recursively claims its own bytes', () => {
  const manifest = read('release-manifest.json');
  assert.equal(manifest.schema, 'halveth.brightcast.build-manifest.v1');
  assert(!manifest.files.some((item) => item.name === 'halveth-brightcast-001-manifest.json'));
  assert(manifest.files.some((item) => item.name.endsWith('.mp4')));
  assert.equal(manifest.probe.streams[0].width, 1920);
  assert.equal(manifest.probe.streams[0].height, 1080);
});
