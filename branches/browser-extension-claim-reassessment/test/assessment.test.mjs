import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateAssessments } from "../src/assessment.mjs";

const rows = JSON.parse(fs.readFileSync(new URL("../data/extensions.json", import.meta.url), "utf8"));

test("the supplied article list is represented by nineteen unique extension IDs", () => {
  assert.equal(rows.length, 19);
  assert.equal(new Set(rows.map((row) => row.extensionId)).size, 19);
});

test("the investigator's five purchased and fourteen actor-created groups stay distinct", () => {
  assert.equal(rows.filter((row) => row.originClass === "PURCHASED_FROM_PRIOR_DEVELOPER").length, 5);
  assert.equal(rows.filter((row) => row.originClass === "REPORTED_THREAT_ACTOR_CREATED").length, 14);
});

test("every row preserves useful potential without declaring a current artifact safe", () => {
  for (const row of rows) {
    assert.ok(row.legitimatePotential.length > 20);
    assert.equal(row.currentSafeArtifactState, "NOT_PROVEN");
  }
});

test("public investigator findings are not relabeled as an independent reproduction", () => {
  for (const row of rows) {
    assert.equal(row.reportedFindingState, "REPORTED_BY_SOCKET_NOT_REPRODUCED_HERE");
    assert.equal(row.individualPayloadState, "NOT_PROVEN_FOR_EVERY_PAYLOAD_ON_THIS_ID");
  }
});

test("the bounded assessment contract validates", () => {
  assert.deepEqual(validateAssessments(rows), []);
});

