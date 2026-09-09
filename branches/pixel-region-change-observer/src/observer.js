'use strict';

const { createHash } = require('node:crypto');

const SCHEMA_VERSION = '1.0.0';
const POSITIVE_CLAIM =
  'PIXEL_DIFFERENCE_OBSERVED_BETWEEN_SUPPLIED_FRAMES_WITHIN_DECLARED_REGION_AND_THRESHOLD';
const NEGATIVE_CLAIM =
  'NO_PIXEL_CHANGE_OBSERVED_AT_SUPPLIED_SAMPLES_WITHIN_REGION_AND_THRESHOLD';
const MAX_PIXELS = 1_000_000;
const MAX_FRAMES = 1000;
const MAX_TOTAL_CHANNEL_VALUES = 1_000_000;

const INPUT_KEYS = new Set([
  'schemaVersion',
  'width',
  'height',
  'channels',
  'sourceDeclaration',
  'region',
  'threshold',
  'frames'
]);
const REGION_KEYS = new Set(['x', 'y', 'width', 'height']);
const SOURCE_DECLARATION_KEYS = new Set([
  'kind',
  'containsPersonalData',
  'containsThirdPartyContent',
  'capturedFromDevice'
]);
const FRAME_KEYS = new Set(['id', 'atMs', 'pixels']);

function fail(message) {
  throw new TypeError(message);
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be a plain object`);
  }
}

function assertClosedObject(value, allowedKeys, label) {
  assertPlainObject(value, label);
  const extras = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (extras.length > 0) {
    fail(`${label} contains unsupported field(s): ${extras.join(', ')}`);
  }
}

function assertInteger(value, label, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    fail(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
}

function validateInput(input) {
  assertClosedObject(input, INPUT_KEYS, 'input');
  if (input.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion must be ${SCHEMA_VERSION}`);
  assertInteger(input.width, 'width', 1, 4096);
  assertInteger(input.height, 'height', 1, 4096);
  if (input.width * input.height > MAX_PIXELS) fail(`frame exceeds ${MAX_PIXELS} pixels`);
  if (input.channels !== 4) fail('channels must be exactly 4 for RGBA');
  assertInteger(input.threshold, 'threshold', 1, 255);

  assertClosedObject(input.sourceDeclaration, SOURCE_DECLARATION_KEYS, 'sourceDeclaration');
  if (input.sourceDeclaration.kind !== 'SYNTHETIC_GENERATED') {
    fail('sourceDeclaration.kind must be SYNTHETIC_GENERATED');
  }
  for (const field of ['containsPersonalData', 'containsThirdPartyContent', 'capturedFromDevice']) {
    if (input.sourceDeclaration[field] !== false) {
      fail(`sourceDeclaration.${field} must be false`);
    }
  }

  assertClosedObject(input.region, REGION_KEYS, 'region');
  assertInteger(input.region.x, 'region.x', 0, input.width - 1);
  assertInteger(input.region.y, 'region.y', 0, input.height - 1);
  assertInteger(input.region.width, 'region.width', 1, input.width);
  assertInteger(input.region.height, 'region.height', 1, input.height);
  if (
    input.region.x + input.region.width > input.width ||
    input.region.y + input.region.height > input.height
  ) {
    fail('region must fit inside the frame');
  }

  if (!Array.isArray(input.frames) || input.frames.length < 1 || input.frames.length > MAX_FRAMES) {
    fail(`frames must contain from 1 to ${MAX_FRAMES} entries`);
  }

  const valuesPerFrame = input.width * input.height * input.channels;
  if (valuesPerFrame * input.frames.length > MAX_TOTAL_CHANNEL_VALUES) {
    fail(`input exceeds ${MAX_TOTAL_CHANNEL_VALUES} channel values`);
  }

  const ids = new Set();
  let previousAt = -Infinity;
  for (let index = 0; index < input.frames.length; index += 1) {
    const frame = input.frames[index];
    const label = `frames[${index}]`;
    assertClosedObject(frame, FRAME_KEYS, label);
    if (typeof frame.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(frame.id)) {
      fail(`${label}.id must be a stable lowercase ASCII identifier`);
    }
    if (ids.has(frame.id)) fail(`duplicate frame id: ${frame.id}`);
    ids.add(frame.id);
    if (!Number.isFinite(frame.atMs) || frame.atMs < 0 || frame.atMs <= previousAt) {
      fail(`${label}.atMs must be finite, non-negative, and strictly increasing`);
    }
    previousAt = frame.atMs;
    if (!Array.isArray(frame.pixels) || frame.pixels.length !== valuesPerFrame) {
      fail(`${label}.pixels must contain exactly ${valuesPerFrame} channel values`);
    }
    for (const value of frame.pixels) {
      assertInteger(value, `${label}.pixels value`, 0, 255);
    }
  }
}

function frameDigest(input, frame) {
  const header = Buffer.from(
    `${SCHEMA_VERSION}:${input.width}:${input.height}:${input.channels}:${frame.id}:${frame.atMs}:`,
    'utf8'
  );
  const pixels = Buffer.from(frame.pixels);
  return createHash('sha256').update(header).update(pixels).digest('hex');
}

function compareFrames(input, left, right, sequence) {
  let changedPixels = 0;
  let maxChannelDelta = 0;
  let totalAbsoluteDelta = 0;

  for (let y = input.region.y; y < input.region.y + input.region.height; y += 1) {
    for (let x = input.region.x; x < input.region.x + input.region.width; x += 1) {
      const offset = (y * input.width + x) * input.channels;
      let pixelMaxDelta = 0;
      for (let channel = 0; channel < input.channels; channel += 1) {
        const delta = Math.abs(left.pixels[offset + channel] - right.pixels[offset + channel]);
        totalAbsoluteDelta += delta;
        if (delta > pixelMaxDelta) pixelMaxDelta = delta;
        if (delta > maxChannelDelta) maxChannelDelta = delta;
      }
      if (pixelMaxDelta >= input.threshold) changedPixels += 1;
    }
  }

  const inspectedPixels = input.region.width * input.region.height;
  const changed = changedPixels > 0;
  return {
    observationId: `obs-${String(sequence).padStart(4, '0')}`,
    relation: {
      relationId: `rel-${String(sequence).padStart(4, '0')}`,
      relationType: 'PIXEL_DIFF_BETWEEN_SUPPLIED_FRAMES',
      leftEndpoint: {
        kind: 'SUPPLIED_RGBA_FRAME',
        id: left.id,
        sha256: frameDigest(input, left)
      },
      rightEndpoint: {
        kind: 'SUPPLIED_RGBA_FRAME',
        id: right.id,
        sha256: frameDigest(input, right)
      },
      direction: 'LEFT_TO_RIGHT_SEQUENCE_ONLY',
      scope: {
        region: { ...input.region },
        threshold: input.threshold,
        channels: input.channels
      },
      timebase: 'SYNTHETIC_MONOTONIC_MS',
      eventTime: {
        fromAtMs: left.atMs,
        toAtMs: right.atMs
      },
      recordedAt: null,
      recordedAtState: 'NOT_CAPTURED_FOR_DETERMINISTIC_OUTPUT',
      evidenceState: 'OBSERVED',
      sourceRefs: [left.id, right.id],
      authorityEffect: 'NONE'
    },
    region: { ...input.region },
    threshold: input.threshold,
    inspectedPixels,
    changedPixels,
    changedFraction: changedPixels / inspectedPixels,
    maxChannelDelta,
    totalAbsoluteDelta,
    changed,
    claim: changed ? POSITIVE_CLAIM : NEGATIVE_CLAIM
  };
}

function observeSequence(input) {
  validateInput(input);
  const observations = [];
  const blindIntervals = [];
  const gaps = [];

  for (let index = 1; index < input.frames.length; index += 1) {
    const left = input.frames[index - 1];
    const right = input.frames[index];
    observations.push(compareFrames(input, left, right, index));
    gaps.push(right.atMs - left.atMs);
      blindIntervals.push({
      intervalId: `gap-${String(index).padStart(4, '0')}`,
      startAtMs: left.atMs,
      endAtMs: right.atMs,
      boundary: 'OPEN_BETWEEN_SAMPLE_POINTS',
      reason: 'NO_CONTINUOUS_OBSERVATION_BETWEEN_SUPPLIED_SAMPLES',
      affectedDimensions: ['TEMPORAL'],
      evidenceState: 'OBSERVED'
    });
  }

  const changedObservationCount = observations.filter((item) => item.changed).length;
  return {
    schemaVersion: SCHEMA_VERSION,
    observer: {
      observerId: 'pure-rgba-region-comparator-v1',
      mechanism: 'OFFLINE_SUPPLIED_ARRAY_COMPARISON',
      networkAccess: false,
      screenCapture: false,
      persistence: false,
      authorityEffect: 'NONE'
    },
    firstObservableBoundaryWithinMethod: {
      pathId: 'caller-array-to-pure-comparator-output',
      direction: 'CALLER_INPUT_TO_RETURN_VALUE',
      researchObject: 'BOUNDED_RGBA_REGION_DIFFERENCE',
      candidateOrdering: ['CALLER_SUPPLIED_RGBA_ARRAY'],
      boundaryPoint: 'CALLER_SUPPLIED_RGBA_ARRAY',
      infrastructureController: 'CALLER',
      trafficSubjects: 'NOT_APPLICABLE',
      authorizationSource: 'CALLER_DECLARATION_IN_INPUT_NOT_INDEPENDENTLY_VERIFIED',
      observableCapabilities: ['READ_DECLARED_RGBA_VALUES'],
      timeBinding: 'SYNTHETIC_MONOTONIC_MS',
      interferenceClass: 'PURE_FUNCTION_NO_EXTERNAL_EFFECT',
      thirdPartyExposureRisk: 'DECLARED_NONE_NOT_INDEPENDENTLY_VERIFIED',
      dataClass: 'DECLARED_PUBLIC_SYNTHETIC',
      evidenceState: 'NOT_PROVEN'
    },
    fusion: {
      attempted: false,
      eventRootId: null,
      sameEventEdges: []
    },
    capture: {
      planned: false,
      started: false,
      persistencePlanned: false
    },
    scope: {
      frameCount: input.frames.length,
      comparedTransitions: observations.length,
      width: input.width,
      height: input.height,
      channels: input.channels,
      region: { ...input.region },
      threshold: input.threshold,
      timebase: 'SYNTHETIC_MONOTONIC_MS',
      observerStartMs: input.frames[0].atMs,
      observerStopMs: input.frames[input.frames.length - 1].atMs,
      maximumObservedSampleGapMs: gaps.length === 0 ? null : Math.max(...gaps),
      maximumDetectionGapMs: null
    },
    coverage: {
      coverageId: 'coverage-supplied-frame-sequence-v1',
      recordKind: 'SUPPLIED_SYNTHETIC_SEQUENCE',
      samplingMode: 'SUPPLIED_DISCRETE_FRAMES',
      samplingRateHz: null,
      samplingTrigger: 'CALLER_SUPPLIED_FRAME_SEQUENCE',
      clock: {
        source: 'SYNTHETIC_MONOTONIC_MS',
        precisionMs: null,
        driftPpm: null,
        calibration: 'NOT_AVAILABLE_FOR_CALLER_SUPPLIED_SEQUENCE',
        evidenceState: 'UNKNOWN'
      },
      eventBuffer: {
        kind: 'BOUNDED_IN_MEMORY_INPUT',
        capacityFrames: MAX_FRAMES,
        overflowPolicy: 'REJECT_INPUT',
        overflowObserved: false,
        evidenceState: 'OBSERVED'
      },
      eventLossState: 'UNKNOWN',
      droppedEvents: null,
      blindIntervals,
      dimensions: {
        temporal: {
          scope: 'SUPPLIED_SAMPLE_POINTS_AND_OPEN_GAPS',
          method: 'ORDERED_SYNTHETIC_TIMESTAMPS',
          coverageState: 'PARTIAL',
          evidenceState: 'OBSERVED'
        },
        object: {
          scope: 'DECLARED_RECTANGULAR_PIXEL_REGION',
          method: 'EXHAUSTIVE_REGION_ITERATION_AT_EACH_SAMPLE',
          coverageState: 'BOUNDED',
          evidenceState: 'OBSERVED'
        },
        layer: {
          scope: 'SUPPLIED_RGBA_ARRAY_ONLY',
          method: 'DIRECT_ARRAY_COMPARISON',
          coverageState: 'BOUNDED',
          evidenceState: 'OBSERVED'
        },
        privilege: {
          scope: 'PURE_FUNCTION',
          method: 'NO_PRIVILEGED_INTERFACE',
          coverageState: 'NOT_APPLICABLE',
          evidenceState: 'OBSERVED'
        },
        sensor: {
          scope: 'UPSTREAM_FRAME_ACQUISITION',
          method: 'NOT_OBSERVED',
          coverageState: 'UNKNOWN',
          evidenceState: 'UNKNOWN'
        },
        captureReliability: {
          scope: 'UPSTREAM_FRAME_ACQUISITION',
          method: 'NOT_OBSERVED',
          coverageState: 'UNKNOWN',
          evidenceState: 'UNKNOWN'
        }
      },
      all_states_observed: false,
      no_event_observed_means_event_absent: false,
      validator_proves_model_complete: false
    },
    summary: {
      changedObservationCount,
      unchangedObservationCount: observations.length - changedObservationCount,
      anyChangeObserved: changedObservationCount > 0,
      strongestPositiveClaim: changedObservationCount > 0 ? POSITIVE_CLAIM : null,
      strongestNegativeClaim: changedObservationCount === 0 ? NEGATIVE_CLAIM : null,
      doesNotEstablish: [
        'NO_TRANSIENT_OCCURRED_BETWEEN_FRAMES',
        'SOURCE_IS_ACTUALLY_SYNTHETIC',
        'SOURCE_ACQUISITION_COMPLETENESS',
        'CAUSE_OF_PIXEL_CHANGE',
        'APPLICATION_OR_USER_IDENTITY',
        'SECURITY_IMPACT'
      ]
    },
    observations
  };
}

module.exports = {
  NEGATIVE_CLAIM,
  POSITIVE_CLAIM,
  SCHEMA_VERSION,
  observeSequence
};
