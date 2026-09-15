import assert from "node:assert/strict";
import test from "node:test";

import { collisionPairs, evaluateConstantMap } from "../one-map.mjs";

test("the visible pattern is modeled only as a constant map candidate", () => {
  const result = evaluateConstantMap(["s_a", "s_b", "s_c"]);
  assert.equal(result.constantOnObservedInputs, true);
  assert.deepEqual(result.rows.map((row) => row.output), [1, 1, 1]);
});

test("many inputs mapped to one output are not invertible", () => {
  const result = evaluateConstantMap(["s_a", "s_b", "s_c"]);
  assert.equal(result.injectiveOnObservedInputs, false);
  assert.equal(result.invertibleOnObservedInputs, false);
  assert.deepEqual(collisionPairs(["s_a", "s_b", "s_c"]), [
    ["s_a", "s_b"], ["s_a", "s_c"], ["s_b", "s_c"]
  ]);
});

test("a structural model never supplies provenance or a universal interpretation", () => {
  const result = evaluateConstantMap(["s_1", "s_2"]);
  assert.equal(result.provenanceEstablished, false);
  assert.equal(result.universalMeaningEstablished, false);
});

test("invalid empty input is rejected instead of silently normalized", () => {
  assert.throws(() => evaluateConstantMap([]), /non-empty array/);
});
