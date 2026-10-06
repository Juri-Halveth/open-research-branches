import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { simulatePhotographSearch } from "../src/search-simulator.mjs";

const run = (strategy, seed, budget = 12) => simulatePhotographSearch({ strategy, seed, budget });

test("pingpong covers all three controlled axes without mixing factors", () => {
  const result = run("PING_PONG", 17);
  assert.deepEqual(result.population, { cases: 8, controlledPairs: 12 });
  assert.equal(result.visited.length, 12);
  assert.ok(result.visited.every((pair) => pair.changedFactorCount === 1));
  assert.deepEqual(Object.values(result.factorCoverage).map((axis) => axis.visited), [4, 4, 4]);
  assert.deepEqual(result.visited.slice(0, 3).map((pair) => pair.factor), ["scene", "exposure", "metadata"]);
});

test("paired interventions expose three different losses or changes", () => {
  const result = run("PING_PONG", 17);
  assert.deepEqual(result.witnessed, {
    samePixelsDifferentScene: true,
    differentPixelsSameScene: true,
    differentFileSamePixels: true
  });
  assert.deepEqual(result.open, []);
  assert.ok(result.visited.filter((pair) => pair.factor === "scene").every((pair) => !pair.pixelChanged && !pair.fileChanged));
  assert.ok(result.visited.filter((pair) => pair.factor === "exposure").every((pair) => pair.pixelChanged && pair.fileChanged));
  assert.ok(result.visited.filter((pair) => pair.factor === "metadata").every((pair) => !pair.pixelChanged && pair.fileChanged));
});

test("seeded random search is repeatable and full budget agrees on observed claims", () => {
  const first = run("SEEDED_RANDOM", 419, 12);
  assert.deepEqual(first, run("SEEDED_RANDOM", 419, 12));
  assert.deepEqual(first.witnessed, run("PING_PONG", 419, 12).witnessed);
  assert.equal(new Set(first.visited.map((pair) => `${pair.left}:${pair.right}`)).size, 12);
});

test("the checked-in finite receipt matches both executable paths", () => {
  const receipt = JSON.parse(readFileSync(new URL("../simulation-receipt.json", import.meta.url), "utf8"));
  assert.deepEqual(receipt.pingPong, run("PING_PONG", 419));
  assert.deepEqual(receipt.seededRandom, run("SEEDED_RANDOM", 419));
});

test("a short search reports undiscovered axes as open", () => {
  const result = run("PING_PONG", 17, 1);
  assert.equal(result.visited.length, 1);
  assert.deepEqual(result.open, ["differentPixelsSameScene", "differentFileSamePixels"]);
  assert.equal(result.factorCoverage.exposure.visited, 0);
  assert.equal(result.factorCoverage.metadata.visited, 0);
});

test("synthetic comparison never infers a depicted person's identity", () => {
  for (const strategy of ["PING_PONG", "SEEDED_RANDOM"]) {
    const result = run(strategy, 9);
    assert.equal(result.identityProjection, "NOT_AUTHORIZED_BY_SYNTHETIC_PIXELS_OR_HASHES");
    assert.ok(result.visited.every((pair) => !("person" in pair)));
  }
});

test("invalid or silently broadened search inputs fail closed", () => {
  assert.throws(() => run("SEEDED_RANDOM", -1));
  assert.throws(() => run("SEEDED_RANDOM", 1, 13));
  assert.throws(() => run("UNBOUNDED", 1));
  assert.throws(() => simulatePhotographSearch({ strategy: "PING_PONG", seed: 1, budget: 1, upload: true }));
});
