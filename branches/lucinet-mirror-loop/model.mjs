export const MODEL_VERSION = "1.0.0";
export const ORACLE_ID = "euclidean-squared-error-v1";

// These are invented coordinates for a local demonstration, not extracted from
// the August image, a screenshot, a real trajectory, or an external system.
export const SYNTHETIC_TRACE = Object.freeze([
  Object.freeze({ x: 0, y: 4 }),
  Object.freeze({ x: 1, y: 3 }),
  Object.freeze({ x: 2, y: 2 }),
  Object.freeze({ x: 3, y: 2 }),
  Object.freeze({ x: 4, y: 3 }),
  Object.freeze({ x: 5, y: 5 }),
  Object.freeze({ x: 6, y: 8 })
]);

// A separately authored counterexample: the latest speed change does not
// persist. M1 wins at O3; this prevents the demo from canonizing M2.
export const SYNTHETIC_STABLE_TRACE = Object.freeze([
  Object.freeze({ x: 0, y: 0 }),
  Object.freeze({ x: 1, y: 1 }),
  Object.freeze({ x: 2, y: 3 }),
  Object.freeze({ x: 3, y: 5 }),
  Object.freeze({ x: 4, y: 7 }),
  Object.freeze({ x: 5, y: 9 })
]);

function validPoint(point) {
  return point !== null && typeof point === "object" &&
    !Array.isArray(point) && Object.keys(point).sort().join(",") === "x,y" &&
    Number.isFinite(point.x) && Number.isFinite(point.y);
}

function checkTrace(points, minimum) {
  if (!Array.isArray(points) || points.length < minimum || points.length > 100 ||
      !points.every(validPoint)) {
    throw new TypeError(`Expected ${minimum}–100 finite {x,y} observations`);
  }
}

// M1 assumes the last observed displacement persists for one more step.
export function linearPrediction(prefix) {
  checkTrace(prefix, 2);
  const last = prefix.at(-1);
  const before = prefix.at(-2);
  return { x: 2 * last.x - before.x, y: 2 * last.y - before.y };
}

// M2 assumes the most recently observed change in displacement persists.
// It is defined independently of M1; neither model reads the other's output.
export function curvaturePrediction(prefix) {
  checkTrace(prefix, 3);
  const a = prefix.at(-3);
  const b = prefix.at(-2);
  const c = prefix.at(-1);
  return {
    x: c.x + 2 * (c.x - b.x) - (b.x - a.x),
    y: c.y + 2 * (c.y - b.y) - (b.y - a.y)
  };
}

export function squaredError(predicted, observed) {
  if (!validPoint(predicted) || !validPoint(observed)) {
    throw new TypeError("Oracle requires two finite {x,y} points");
  }
  return (predicted.x - observed.x) ** 2 + (predicted.y - observed.y) ** 2;
}

// The last point is withheld from both models until both predictions exist.
// The returned next projection uses only observations supplied to this call.
export function runMirrorStep(observations) {
  checkTrace(observations, 4);
  const sourceSnapshot = observations.map(({ x, y }) => ({ x, y }));
  const prefix = sourceSnapshot.slice(0, -1);
  const withheldObservation = sourceSnapshot.at(-1);
  const candidates = [
    { id: "M1_LINEAR", prediction: linearPrediction(prefix) },
    { id: "M2_CURVATURE", prediction: curvaturePrediction(prefix) }
  ].map((candidate) => ({
    ...candidate,
    error: squaredError(candidate.prediction, withheldObservation)
  }));
  const chosen = [...candidates].sort((a, b) => a.error - b.error || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  const project = chosen.id === "M1_LINEAR" ? linearPrediction : curvaturePrediction;
  const modelsDisagree = candidates[0].prediction.x !== candidates[1].prediction.x ||
    candidates[0].prediction.y !== candidates[1].prediction.y;

  return {
    version: MODEL_VERSION,
    oracle: ORACLE_ID,
    scope: "SUPPLIED_SYNTHETIC_POINT_SEQUENCE_ONLY",
    comparedObservationIndex: sourceSnapshot.length - 1,
    prefix,
    observation: withheldObservation,
    candidates,
    modelsDisagreeAtComparedStep: modelsDisagree,
    selectedForNextProjection: chosen.id,
    nextProjection: project(sourceSnapshot),
    nextProjectionState: "CANDIDATE_UNTIL_NEW_OBSERVATION",
    sourceEffects: 0,
    networkEffects: 0,
    claimCeiling: "LOCAL_PREDICTION_COMPARISON_ON_SUPPLIED_SYNTHETIC_POINTS"
  };
}
