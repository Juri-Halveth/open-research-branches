'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { NEGATIVE_CLAIM, POSITIVE_CLAIM, observeSequence } = require('../src/observer');

function twoFrameInput(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    width: 1,
    height: 1,
    channels: 4,
    sourceDeclaration: {
      kind: 'SYNTHETIC_GENERATED',
      containsPersonalData: false,
      containsThirdPartyContent: false,
      capturedFromDevice: false
    },
    region: { x: 0, y: 0, width: 1, height: 1 },
    threshold: 10,
    frames: [
      { id: 'frame-a', atMs: 0, pixels: [0, 0, 0, 255] },
      { id: 'frame-b', atMs: 50, pixels: [0, 0, 0, 255] }
    ],
    ...overrides
  };
}

test('detects only threshold-reaching changes inside the declared region', () => {
  const fixturePath = path.join(__dirname, '..', 'fixtures', 'synthetic-frames.json');
  const input = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const result = observeSequence(input);

  assert.equal(result.observations.length, 2);
  assert.equal(result.observations[0].changedPixels, 1);
  assert.equal(result.observations[0].claim, POSITIVE_CLAIM);
  assert.equal(result.observations[1].changedPixels, 0);
  assert.equal(result.observations[1].claim, NEGATIVE_CLAIM);
  assert.equal(result.scope.maximumObservedSampleGapMs, 120);
});

test('reports discrete-sample gaps and never upgrades absence to a world claim', () => {
  const result = observeSequence(twoFrameInput());
  assert.equal(result.coverage.blindIntervals.length, 1);
  assert.equal(result.coverage.eventLossState, 'UNKNOWN');
  assert.equal(result.coverage.all_states_observed, false);
  assert.equal(result.coverage.no_event_observed_means_event_absent, false);
  assert.equal(result.coverage.validator_proves_model_complete, false);
  assert.equal(result.summary.strongestNegativeClaim, NEGATIVE_CLAIM);
  assert.ok(result.summary.doesNotEstablish.includes('NO_TRANSIENT_OCCURRED_BETWEEN_FRAMES'));
});

test('uses explicit relation endpoints, digests, and no authority effect', () => {
  const result = observeSequence(twoFrameInput({
    frames: [
      { id: 'frame-a', atMs: 0, pixels: [0, 0, 0, 255] },
      { id: 'frame-b', atMs: 50, pixels: [10, 0, 0, 255] }
    ]
  }));
  const relation = result.observations[0].relation;
  assert.equal(relation.leftEndpoint.id, 'frame-a');
  assert.equal(relation.rightEndpoint.id, 'frame-b');
  assert.notEqual(relation.leftEndpoint.sha256, relation.rightEndpoint.sha256);
  assert.match(relation.leftEndpoint.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(relation.sourceRefs, ['frame-a', 'frame-b']);
  assert.equal(relation.recordedAt, null);
  assert.equal(relation.authorityEffect, 'NONE');
});

test('rejects a region outside the frame', () => {
  assert.throws(
    () => observeSequence(twoFrameInput({
      region: { x: 0, y: 0, width: 2, height: 1 }
    })),
    /region.width|region must fit/
  );
});

test('rejects malformed pixels and non-increasing time', () => {
  assert.throws(
    () => observeSequence(twoFrameInput({
      frames: [
        { id: 'frame-a', atMs: 0, pixels: [0, 0, 0, 255] },
        { id: 'frame-b', atMs: 50, pixels: [0, 0, 255] }
      ]
    })),
    /channel values/
  );
  assert.throws(
    () => observeSequence(twoFrameInput({
      frames: [
        { id: 'frame-a', atMs: 50, pixels: [0, 0, 0, 255] },
        { id: 'frame-b', atMs: 50, pixels: [0, 0, 0, 255] }
      ]
    })),
    /strictly increasing/
  );
});

test('fails closed on foreground or session metadata', () => {
  assert.throws(
    () => observeSequence({ ...twoFrameInput(), windowTitle: 'not accepted' }),
    /unsupported field/
  );
  assert.throws(
    () => observeSequence({ ...twoFrameInput(), sessionId: 'not accepted' }),
    /unsupported field/
  );
});

test('requires a closed synthetic-source declaration without treating it as proof', () => {
  const input = twoFrameInput();
  delete input.sourceDeclaration;
  assert.throws(() => observeSequence(input), /sourceDeclaration must be a plain object/);

  const declaredCapture = twoFrameInput({
    sourceDeclaration: {
      kind: 'SYNTHETIC_GENERATED',
      containsPersonalData: false,
      containsThirdPartyContent: false,
      capturedFromDevice: true
    }
  });
  assert.throws(() => observeSequence(declaredCapture), /capturedFromDevice must be false/);

  const result = observeSequence(twoFrameInput());
  assert.equal(result.firstObservableBoundaryWithinMethod.evidenceState, 'NOT_PROVEN');
  assert.ok(result.summary.doesNotEstablish.includes('SOURCE_IS_ACTUALLY_SYNTHETIC'));
});
