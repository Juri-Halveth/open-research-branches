export const SCENE_VERSION = "1.0.0";
export const SCENE_SOURCE = "object:apple; color:red; light:?";

const OFFSETS = Object.freeze({ LEFT: 42, RIGHT: -42 });
export const SYNTHETIC_FOLLOWUPS = Object.freeze({
  LEFT: Object.freeze({ appleX: 180, shadowX: 222 }),
  RIGHT: Object.freeze({ appleX: 180, shadowX: 138 })
});

// An exact mini-language, not natural-language understanding.
export function parseSceneSource(source) {
  if (source !== SCENE_SOURCE) {
    throw new TypeError("Only the exact bounded scene grammar is supported");
  }
  return Object.freeze({
    source,
    object: "APPLE",
    color: "RED",
    lightCandidates: Object.freeze(["LEFT", "RIGHT"]),
    unknown: "LIGHT_DIRECTION",
    claimCeiling: "EXACT_SYNTHETIC_SCENE_GRAMMAR_ONLY"
  });
}

function validCoordinate(value) {
  return Number.isFinite(value) && value >= -1000 && value <= 1000;
}

function validObservation(observation) {
  return observation !== null && typeof observation === "object" &&
    !Array.isArray(observation) && Object.keys(observation).sort().join(",") === "appleX,shadowX" &&
    validCoordinate(observation.appleX) && validCoordinate(observation.shadowX);
}

export function renderCandidate(ir, lightDirection, appleX) {
  if (ir?.source !== SCENE_SOURCE || ir.object !== "APPLE" || ir.color !== "RED" ||
      !ir.lightCandidates?.includes(lightDirection) || !validCoordinate(appleX)) {
    throw new TypeError("Scene candidate is outside the bound grammar or coordinate range");
  }
  const shadowX = appleX + OFFSETS[lightDirection];
  if (!validCoordinate(shadowX)) throw new RangeError("Projected shadow is outside bounds");
  return Object.freeze({
    object: "APPLE",
    color: "RED",
    lightDirection,
    apple: Object.freeze({ x: appleX, y: 120, radius: 31 }),
    stem: Object.freeze({ x: appleX + 2, y: 84, length: 17 }),
    shadow: Object.freeze({ x: shadowX, y: 174, radiusX: 36, radiusY: 9 }),
    state: "PROJECTION_NOT_OBSERVATION"
  });
}

export function compareSceneCandidates(ir, observation) {
  if (!validObservation(observation)) {
    throw new TypeError("Expected a finite synthetic {appleX,shadowX} observation");
  }
  const scored = ir.lightCandidates.map((direction) => {
    const projection = renderCandidate(ir, direction, observation.appleX);
    return Object.freeze({
      id: direction,
      projection,
      squaredShadowError: (projection.shadow.x - observation.shadowX) ** 2
    });
  });
  const selected = [...scored].sort((a, b) =>
    a.squaredShadowError - b.squaredShadowError ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  return Object.freeze({
    sceneVersion: SCENE_VERSION,
    oracle: "shadow-centroid-squared-error-v1",
    observation: Object.freeze({ ...observation }),
    candidates: Object.freeze(scored),
    selectedLightDirection: selected.id,
    selectedEvidenceState: "MODEL_SELECTED_ON_SYNTHETIC_OBSERVATION",
    claimCeiling: "ONE_SYNTHETIC_SHADOW_CENTROID_COMPARISON_ONLY"
  });
}

export function reprojectScene(ir, comparison, nextAppleX) {
  if (comparison?.sceneVersion !== SCENE_VERSION ||
      comparison.oracle !== "shadow-centroid-squared-error-v1" ||
      !ir.lightCandidates.includes(comparison.selectedLightDirection)) {
    throw new TypeError("Comparison does not match the bound scene model");
  }
  return renderCandidate(ir, comparison.selectedLightDirection, nextAppleX);
}

export function compareFollowup(projection, observation) {
  if (projection?.state !== "PROJECTION_NOT_OBSERVATION" ||
      !validObservation(observation) || projection.apple.x !== observation.appleX) {
    throw new TypeError("Follow-up observation does not match the projected scene scope");
  }
  return Object.freeze({
    oracle: "shadow-centroid-squared-error-v1",
    predictedShadowX: projection.shadow.x,
    observedShadowX: observation.shadowX,
    squaredShadowError: (projection.shadow.x - observation.shadowX) ** 2,
    evidenceState: "OBSERVED_WITHIN_SYNTHETIC_FIXTURE_ONLY",
    sourceIndependence: "NOT_CLAIMED_SAME_AUTHOR_FIXTURE"
  });
}
