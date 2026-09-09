import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DERIVATION_STATES,
  assessDerivation,
  compareSystems,
  preserveIdentifier,
  validateMatrix
} from "./audit-lens.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(fs.readFileSync(path.join(here, "component-matrix.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(here, "sources.json"), "utf8"));
const localReceipt = JSON.parse(fs.readFileSync(path.join(here, "local-source-receipt.json"), "utf8"));
const claims = JSON.parse(fs.readFileSync(path.join(here, "claims.json"), "utf8"));

test("matrix contains three uniquely identified source-bound systems", () => {
  assert.equal(validateMatrix(matrix).systems.length, 3);
});

test("Juri and KIT share broad motifs but no registered exact device feature", () => {
  const result = compareSystems(matrix, "JURI_AUGUST_2026", "KIT_TRI_GENERATION_2026");
  assert.deepEqual(result.exactSharedFeatureIds, []);
  assert.deepEqual(result.sharedBroadMotifIds, ["COLD", "ENERGY_CONVERSION", "HEAT", "LIGHT", "REFLECTION"]);
  assert.equal(result.overlapState, "BROAD_MOTIF_OVERLAP_ONLY");
});

test("Juri and Standard Thermal share broad motifs but no registered exact device feature", () => {
  const result = compareSystems(matrix, "JURI_AUGUST_2026", "STANDARD_THERMAL_EARTH_STORAGE");
  assert.deepEqual(result.exactSharedFeatureIds, []);
  assert.deepEqual(result.sharedBroadMotifIds, ["ENERGY_CONVERSION", "HEAT", "PRESSURE"]);
  assert.equal(result.overlapState, "BROAD_MOTIF_OVERLAP_ONLY");
});

test("overlap without access and distinctive match cannot become a derivation finding", () => {
  const comparison = compareSystems(matrix, "JURI_AUGUST_2026", "KIT_TRI_GENERATION_2026");
  const result = assessDerivation({ comparison });
  assert.equal(result.state, DERIVATION_STATES.NOT_PROVEN);
  assert.deepEqual(result.missing, ["SOURCE_BOUND_ACCESS_EVIDENCE", "DISTINCTIVE_FUNCTION_LEVEL_MATCH_EVIDENCE"]);
});

test("even supplied evidence IDs produce review eligibility, not automatic proof", () => {
  const comparison = compareSystems(matrix, "JURI_AUGUST_2026", "KIT_TRI_GENERATION_2026");
  const result = assessDerivation({
    comparison,
    accessEvidenceIds: ["ACCESS-EXAMPLE"],
    distinctiveMatchEvidenceIds: ["MATCH-EXAMPLE"]
  });
  assert.equal(result.state, DERIVATION_STATES.REVIEW);
});

test("Ir77 is preserved and never normalized into a 7-7 cycle", () => {
  assert.equal(preserveIdentifier("Ir77"), "Ir77");
  assert.notEqual(preserveIdentifier("Ir77"), "7-7");
});

test("duplicate feature IDs are rejected", () => {
  const invalid = structuredClone(matrix);
  invalid.systems[0].exactFeatureIds.push(invalid.systems[0].exactFeatureIds[0]);
  assert.throws(() => validateMatrix(invalid), /duplicates/u);
});

test("self-comparison is rejected", () => {
  assert.throws(
    () => compareSystems(matrix, "JURI_AUGUST_2026", "JURI_AUGUST_2026"),
    /two different systems/u
  );
});

test("every claim and system source reference resolves", () => {
  const known = new Set([
    ...sources.sources.map((source) => source.id),
    ...localReceipt.receipts.map((receipt) => receipt.id)
  ]);
  for (const claim of claims.claims) {
    for (const sourceId of claim.sourceIds) assert.ok(known.has(sourceId), `${claim.id}: ${sourceId}`);
    if (["UNKNOWN", "NOT_PROVEN"].includes(claim.status)) assert.ok(claim.reopenTrigger, claim.id);
  }
  for (const system of matrix.systems) {
    for (const sourceId of system.sourceIds) assert.ok(known.has(sourceId), `${system.id}: ${sourceId}`);
  }
});

test("public local receipts expose aliases but no absolute local paths", () => {
  for (const receipt of localReceipt.receipts) {
    assert.match(receipt.publicAlias, /^LOCAL_/u);
    assert.doesNotMatch(receipt.publicAlias, /[A-Za-z]:[\\/]/u);
    assert.match(receipt.sha256, /^[a-f0-9]{64}$/u);
  }
});
