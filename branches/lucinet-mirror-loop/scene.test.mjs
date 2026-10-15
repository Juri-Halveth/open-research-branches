import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SCENE_SOURCE,
  SYNTHETIC_FOLLOWUPS,
  compareFollowup,
  compareSceneCandidates,
  createSyntheticSceneReceipt,
  parseSceneSource,
  renderCandidate,
  reprojectScene
} from "./scene.mjs";

test("exact grammar preserves unknown light direction", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  assert.equal(ir.unknown, "LIGHT_DIRECTION");
  assert.deepEqual(ir.lightCandidates, ["LEFT", "RIGHT"]);
  assert.throws(() => parseSceneSource("object:apple; color:red; light:left"), /exact bounded/);
});

test("both shadow hypotheses receive the same apple position and oracle", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  const result = compareSceneCandidates(ir, { appleX: 110, shadowX: 152 });
  assert.deepEqual(result.candidates.map((item) => [item.id, item.projection.shadow.x, item.squaredShadowError]), [
    ["LEFT", 152, 0], ["RIGHT", 68, 7056]
  ]);
  assert.equal(result.selectedLightDirection, "LEFT");
  const next = reprojectScene(ir, result, 180);
  assert.equal(next.shadow.x, 222);
  assert.equal(next.state, "PROJECTION_NOT_OBSERVATION");
  assert.equal(compareFollowup(next, SYNTHETIC_FOLLOWUPS.LEFT).squaredShadowError, 0);
});

test("counterexample selects right light under the unchanged oracle", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  const result = compareSceneCandidates(ir, { appleX: 110, shadowX: 68 });
  assert.equal(result.selectedLightDirection, "RIGHT");
  assert.deepEqual(result.candidates.map((item) => item.squaredShadowError), [7056, 0]);
  const next = reprojectScene(ir, result, 180);
  assert.equal(compareFollowup(next, SYNTHETIC_FOLLOWUPS.RIGHT).squaredShadowError, 0);
});

test("invalid observations and incompatible projections fail closed", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  assert.throws(() => compareSceneCandidates(ir, { appleX: 110, shadowX: NaN }), /finite/);
  assert.throws(() => compareSceneCandidates(ir, { appleX: 110, shadowX: 152, source: "private" }), /finite/);
  assert.throws(() => renderCandidate(ir, "UP", 110), /outside/);
  assert.throws(() => reprojectScene(ir, { sceneVersion: "0.0.0", oracle: "shadow-centroid-squared-error-v1", selectedLightDirection: "LEFT" }, 180), /does not match/);
  assert.throws(() => compareFollowup(renderCandidate(ir, "LEFT", 180), { appleX: 181, shadowX: 222 }), /does not match/);
});

test("exported receipt preserves both candidates, pending state, and synthetic follow-up", () => {
  const pending = createSyntheticSceneReceipt("RIGHT");
  assert.equal(pending.source, SCENE_SOURCE);
  assert.equal(pending.fixture.origin, "BUILT_IN_SAME_AUTHOR_SYNTHETIC");
  assert.deepEqual(pending.initialObservation, { appleX: 155, shadowX: 113 });
  assert.deepEqual(pending.candidates, [
    { id: "LEFT", predictedShadowX: 197, squaredShadowError: 7056 },
    { id: "RIGHT", predictedShadowX: 113, squaredShadowError: 0 }
  ]);
  assert.equal(pending.selectedLightDirection, "RIGHT");
  assert.deepEqual(pending.nextProjection, { appleX: 180, predictedShadowX: 138 });
  assert.deepEqual(pending.followup, { state: "PENDING_NOT_OBSERVED" });
  const observed = createSyntheticSceneReceipt("RIGHT", true);
  assert.deepEqual(observed.followup, {
    state: "OBSERVED_WITHIN_SYNTHETIC_FIXTURE_ONLY",
    observation: { appleX: 180, shadowX: 138 },
    squaredShadowError: 0,
    sourceIndependence: "NOT_CLAIMED_SAME_AUTHOR_FIXTURE"
  });
  assert.equal(JSON.stringify(observed), JSON.stringify(createSyntheticSceneReceipt("RIGHT", true)));
  assert.equal(JSON.stringify(observed).includes("janov"), false);
  assert.throws(() => createSyntheticSceneReceipt("OTHER"), /built-in/);
  assert.throws(() => createSyntheticSceneReceipt("LEFT", "true"), /boolean/);
});
