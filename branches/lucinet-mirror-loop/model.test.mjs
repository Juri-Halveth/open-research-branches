import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SYNTHETIC_TRACE,
  SYNTHETIC_STABLE_TRACE,
  curvaturePrediction,
  linearPrediction,
  runMirrorStep
} from "./model.mjs";

test("both predictions use only the prior observed prefix", () => {
  const prefix = SYNTHETIC_TRACE.slice(0, 4);
  assert.deepEqual(linearPrediction(prefix), { x: 4, y: 2 });
  assert.deepEqual(curvaturePrediction(prefix), { x: 4, y: 3 });
  const changedFuture = [...prefix, { x: 100, y: -100 }];
  assert.deepEqual(linearPrediction(changedFuture.slice(0, -1)), { x: 4, y: 2 });
  assert.deepEqual(curvaturePrediction(changedFuture.slice(0, -1)), { x: 4, y: 3 });
});

test("same oracle distinguishes models and next observation checks projection", () => {
  const step = runMirrorStep(SYNTHETIC_TRACE.slice(0, 5));
  assert.deepEqual(step.candidates.map(({ id, error }) => [id, error]), [
    ["M1_LINEAR", 1], ["M2_CURVATURE", 0]
  ]);
  assert.equal(step.selectedForNextProjection, "M2_CURVATURE");
  assert.equal(step.modelsDisagreeAtComparedStep, true);
  assert.deepEqual(step.nextProjection, { x: 5, y: 5 });
  assert.deepEqual(step.nextProjection, SYNTHETIC_TRACE[5]);
  assert.equal(step.nextProjectionState, "CANDIDATE_UNTIL_NEW_OBSERVATION");
});

test("source remains unchanged and incomplete/invalid inputs are rejected", () => {
  const before = JSON.stringify(SYNTHETIC_TRACE);
  const step = runMirrorStep(SYNTHETIC_TRACE.slice(0, 5));
  step.prefix[0].y = 900;
  assert.equal(JSON.stringify(SYNTHETIC_TRACE), before);
  assert.throws(() => runMirrorStep(SYNTHETIC_TRACE.slice(0, 3)), /Expected 4/);
  assert.throws(() => runMirrorStep([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: Infinity, y: 3 }]), /finite/);
  assert.throws(() => runMirrorStep([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3, privateNote: "x" }]), /finite/);
});

test("a new independently specified surface needs the same bound oracle", () => {
  const translated = SYNTHETIC_TRACE.map(({ x, y }) => ({ x: x + 10, y: y - 7 }));
  const step = runMirrorStep(translated.slice(0, 5));
  assert.deepEqual(step.candidates.map(({ error }) => error), [1, 0]);
  assert.deepEqual(step.nextProjection, translated[5]);
});

test("counterexample favors M1 under the same predeclared oracle", () => {
  const step = runMirrorStep(SYNTHETIC_STABLE_TRACE.slice(0, 4));
  assert.deepEqual(step.candidates.map(({ id, error }) => [id, error]), [
    ["M1_LINEAR", 0], ["M2_CURVATURE", 1]
  ]);
  assert.equal(step.selectedForNextProjection, "M1_LINEAR");
  assert.deepEqual(step.nextProjection, SYNTHETIC_STABLE_TRACE[4]);
});
