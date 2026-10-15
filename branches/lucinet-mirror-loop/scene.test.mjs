import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SCENE_SOURCE,
  compareSceneCandidates,
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
  assert.equal((next.shadow.x - 222) ** 2, 0); // independent second synthetic observation
});

test("counterexample selects right light under the unchanged oracle", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  const result = compareSceneCandidates(ir, { appleX: 110, shadowX: 68 });
  assert.equal(result.selectedLightDirection, "RIGHT");
  assert.deepEqual(result.candidates.map((item) => item.squaredShadowError), [7056, 0]);
});

test("invalid observations and incompatible projections fail closed", () => {
  const ir = parseSceneSource(SCENE_SOURCE);
  assert.throws(() => compareSceneCandidates(ir, { appleX: 110, shadowX: NaN }), /finite/);
  assert.throws(() => compareSceneCandidates(ir, { appleX: 110, shadowX: 152, source: "private" }), /finite/);
  assert.throws(() => renderCandidate(ir, "UP", 110), /outside/);
  assert.throws(() => reprojectScene(ir, { sceneVersion: "0.0.0", oracle: "shadow-centroid-squared-error-v1", selectedLightDirection: "LEFT" }, 180), /does not match/);
});
