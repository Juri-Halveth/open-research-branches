// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calculateBudgetScenario } from "./budget-model.mjs";

const data = JSON.parse(fs.readFileSync(new URL("./model-data.json", import.meta.url), "utf8"));
const scenario = () => structuredClone(data.syntheticExample.inputs);

test("CBO components reconcile to the documented nominal projection, not the example baseline", () => {
  assert.equal(data.sourceProjection.components.reduce((total, item) => total + item.amount, 0), 946);
  assert.equal(data.sourceProjection.total, 946);
  assert.equal(data.sourceProjection.measure, "BUDGET_AUTHORITY");
  assert.equal(data.sourceProjection.fiscalYearStart, 2025);
  assert.equal(data.sourceProjection.fiscalYearEnd, 2034);
  assert.equal(data.syntheticExample.sourceProjectionUsedAsBaseline, false);
  assert.notEqual(data.syntheticExample.inputs.baseline, data.sourceProjection.total);
});

test("illustrative civil allocation subtracts both cost classes and conserves its budget", () => {
  const result = calculateBudgetScenario(scenario());
  for (const [key, value] of Object.entries(data.syntheticExample.expected)) {
    assert.deepEqual(result[key], value);
  }
  assert.equal(result.gross + result.deficit, result.totalCosts + result.allocationTotal + result.roundingResidual);
});

test("costs exceeding gross preserve negative net and expose the funding deficit", () => {
  const input = { ...scenario(), transitionCosts: 18, remediationCosts: 7 };
  const result = calculateBudgetScenario(input);
  assert.equal(result.gross, 20);
  assert.equal(result.totalCosts, 25);
  assert.equal(result.net, -5);
  assert.equal(result.deficit, 5);
  assert.deepEqual(result.allocations, { health: 0, environment: 0, research: 0 });
  assert.equal(result.status, "DEFICIT");
  assert.equal(result.gross + result.deficit, result.totalCosts + result.allocationTotal);
});

test("break even produces no allocations or deficit", () => {
  const result = calculateBudgetScenario({ ...scenario(), transitionCosts: 15, remediationCosts: 5 });
  assert.equal(result.net, 0);
  assert.equal(result.deficit, 0);
  assert.equal(result.allocationTotal, 0);
  assert.equal(result.status, "BREAK_EVEN");
});

test("zero baseline or zero share do not hide remaining costs", () => {
  for (const patch of [{ baseline: 0 }, { reallocationShare: 0 }]) {
    const result = calculateBudgetScenario({ ...scenario(), ...patch });
    assert.equal(result.gross, 0);
    assert.equal(result.net, -5);
    assert.equal(result.deficit, 5);
    assert.equal(result.allocationTotal, 0);
  }
});

test("full share and a single selected civil recipient are valid boundary values", () => {
  const result = calculateBudgetScenario({
    ...scenario(), reallocationShare: 1, transitionCosts: 0, remediationCosts: 0,
    weights: { health: 0, environment: 1, research: 0 }
  });
  assert.equal(result.net, 100);
  assert.deepEqual(result.allocations, { health: 0, environment: 100, research: 0 });
});

test("finite numbers are required without string, null, boolean or boxed-number coercion", () => {
  const invalid = [NaN, Infinity, -Infinity, "100", null, undefined, true, 1n, new Number(1)];
  for (const key of ["baseline", "reallocationShare", "transitionCosts", "remediationCosts"]) {
    for (const value of invalid) assert.throws(() => calculateBudgetScenario({ ...scenario(), [key]: value }), TypeError);
  }
  for (const value of invalid) {
    const input = scenario();
    input.weights.health = value;
    assert.throws(() => calculateBudgetScenario(input), TypeError);
  }
});

test("negative amounts and out-of-range shares or weights are rejected", () => {
  for (const key of ["baseline", "transitionCosts", "remediationCosts"]) {
    assert.throws(() => calculateBudgetScenario({ ...scenario(), [key]: -1 }), RangeError);
  }
  for (const value of [-0.01, 1.01]) {
    assert.throws(() => calculateBudgetScenario({ ...scenario(), reallocationShare: value }), RangeError);
    const input = scenario();
    input.weights.health = value;
    assert.throws(() => calculateBudgetScenario(input), RangeError);
  }
});

test("weights are not silently normalized or assigned default recipients", () => {
  for (const weights of [
    { health: 0.5, environment: 0.3, research: 0.19 },
    { health: 0.5, environment: 0.3, research: 0.21 },
    { health: 0, environment: 0, research: 0 }
  ]) assert.throws(() => calculateBudgetScenario({ ...scenario(), weights }), RangeError);
  // These decimal weights have a stable sum of 1 without changing the inputs.
  const result = calculateBudgetScenario({ ...scenario(), weights: { health: 0.6, environment: 0.3, research: 0.1 } });
  assert.deepEqual(result.weights, { health: 0.6, environment: 0.3, research: 0.1 });
});

test("missing fields, extra fields, arrays and accessors are not accepted as scenario records", () => {
  for (const input of [null, [], new Date(), {}, { ...scenario(), extra: 0 }]) {
    assert.throws(() => calculateBudgetScenario(input), TypeError);
  }
  const missing = scenario();
  delete missing.transitionCosts;
  assert.throws(() => calculateBudgetScenario(missing), TypeError);
  for (const weights of [null, [], { health: 1 }, { health: 1, environment: 0, research: 0, extra: 0 }]) {
    assert.throws(() => calculateBudgetScenario({ ...scenario(), weights }), TypeError);
  }
  const accessor = scenario();
  Object.defineProperty(accessor, "baseline", { get() { throw new Error("getter executed"); } });
  assert.throws(() => calculateBudgetScenario(accessor), TypeError);
});

test("finite inputs whose costs overflow are rejected instead of emitting Infinity or NaN", () => {
  assert.throws(() => calculateBudgetScenario({
    ...scenario(), transitionCosts: Number.MAX_VALUE, remediationCosts: Number.MAX_VALUE
  }), RangeError);
});

test("positive and deficit scenarios keep mass balance across varied scales", () => {
  for (const baseline of [0, 0.1, 100, 946, 1e9]) {
    for (const reallocationShare of [0, 0.01, 0.2, 1]) {
      for (const costs of [0, 0.1, 20, 1000]) {
        const result = calculateBudgetScenario({
          ...scenario(), baseline, reallocationShare, transitionCosts: costs,
          remediationCosts: costs / 2, weights: { health: 0.1, environment: 0.2, research: 0.7 }
        });
        const left = result.gross + result.deficit;
        const right = result.totalCosts + result.allocationTotal + result.roundingResidual;
        const numericTolerance = 8 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
        assert.ok(Math.abs(left - right) <= numericTolerance);
        assert.ok(Object.values(result.allocations).every(value => Number.isFinite(value) && value >= 0));
        assert.equal(result.net < 0, result.deficit > 0);
        if (result.net < 0) assert.equal(result.allocationTotal, 0);
      }
    }
  }
});

test("the pure calculation does not change its input or share mutable weight references", () => {
  const input = scenario();
  const before = structuredClone(input);
  const result = calculateBudgetScenario(input);
  assert.deepEqual(input, before);
  result.weights.health = 0;
  assert.deepEqual(input, before);
});
