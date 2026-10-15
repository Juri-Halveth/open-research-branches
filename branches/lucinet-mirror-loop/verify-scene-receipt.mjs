#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Independent, fixed v1 arithmetic check of a downloaded synthetic receipt.
// It does not authenticate authorship, event time, or an external observation.
function expectedReceipt(direction, observed) {
  const initialShadowX = direction === "LEFT" ? 197 : 113;
  const candidate = (id) => {
    const predictedShadowX = 155 + (id === "LEFT" ? 42 : -42);
    return {
      id,
      predictedShadowX,
      squaredShadowError: (predictedShadowX - initialShadowX) ** 2
    };
  };
  const candidates = [candidate("LEFT"), candidate("RIGHT")];
  const selectedLightDirection = [...candidates].sort((a, b) =>
    a.squaredShadowError - b.squaredShadowError ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0].id;
  const predictedShadowX = 180 + (selectedLightDirection === "LEFT" ? 42 : -42);
  const followup = observed
    ? {
        state: "OBSERVED_WITHIN_SYNTHETIC_FIXTURE_ONLY",
        observation: { appleX: 180, shadowX: direction === "LEFT" ? 222 : 138 },
        squaredShadowError: (predictedShadowX - (direction === "LEFT" ? 222 : 138)) ** 2,
        sourceIndependence: "NOT_CLAIMED_SAME_AUTHOR_FIXTURE"
      }
    : { state: "PENDING_NOT_OBSERVED" };
  return {
    schema: "lucinet.synthetic-scene-receipt.v1",
    sceneVersion: "1.0.0",
    source: "object:apple; color:red; light:?",
    fixture: { id: direction, origin: "BUILT_IN_SAME_AUTHOR_SYNTHETIC" },
    oracle: {
      id: "shadow-centroid-squared-error-v1",
      rule: "(predictedShadowX - observedShadowX) ** 2; minimum wins; ASCII id breaks ties"
    },
    initialObservation: { appleX: 155, shadowX: initialShadowX },
    candidates,
    selectedLightDirection,
    nextProjection: { appleX: 180, predictedShadowX },
    followup,
    claimCeiling: "EXACT_SYNTHETIC_SCENE_GRAMMAR_AND_SAME_AUTHOR_FIXTURES_ONLY"
  };
}

try {
  if (process.argv.length !== 3) throw new Error("Usage: node verify-scene-receipt.mjs <receipt.json>");
  const receipt = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const direction = receipt?.fixture?.id;
  const state = receipt?.followup?.state;
  if (!["LEFT", "RIGHT"].includes(direction) ||
      !["PENDING_NOT_OBSERVED", "OBSERVED_WITHIN_SYNTHETIC_FIXTURE_ONLY"].includes(state)) {
    throw new Error("Unknown fixture or follow-up state");
  }
  assert.deepStrictEqual(receipt, expectedReceipt(direction, state !== "PENDING_NOT_OBSERVED"));
  console.log(`PASS: fixed v1 synthetic arithmetic and fields; fixture=${direction}; followup=${state}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
