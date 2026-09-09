import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { bindClaim, classifyMillion, compareModels } from "../src/credit-audit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const claims = JSON.parse(fs.readFileSync(path.join(root, "claims.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(root, "sources.json"), "utf8"));
const timeline = JSON.parse(fs.readFileSync(path.join(root, "timeline.json"), "utf8"));
const values = JSON.parse(fs.readFileSync(path.join(root, "value-ledger.json"), "utf8"));
const readableSources = fs.readFileSync(path.join(root, "SOURCES.md"), "utf8");
const navigation = JSON.parse(fs.readFileSync(path.join(root, "navigation-receipt.json"), "utf8"));

test("claim lens keeps proof, access, credit and value in separate types", () => {
  const bound = bindClaim({
    claimType: "PRIVATE_ACCESS",
    referent: "private Codex sessions",
    evidenceState: "NOT_PROVEN",
    sourceIds: ["S02", "S05"]
  });
  assert.equal(bound.causalDirection, "UNBOUND");
  assert.equal(bound.legalConclusion, "NOT_AUTOMATIC");
  assert.equal(bound.monetaryAmount, null);
});

test("the Clay million is conditional and does not determine intrinsic value", () => {
  const value = classifyMillion(1_000_000, "Clay Mathematics Institute", "Millennium Prize Rules");
  assert.equal(value.meaning, "CONDITIONAL_INSTITUTIONAL_AMOUNT");
  assert.equal(value.intrinsicScientificValue, "UNDETERMINED");
  assert.equal(value.automaticDebt, false);
});

test("competing models remain unselected until a discriminator is observed", () => {
  const result = compareModels([
    { id: "INDEPENDENT", prediction: "different intermediate structure", discriminator: "independent structural proof comparison" },
    { id: "DIRECT_USE", prediction: "source-specific intermediate overlap", discriminator: "source-bound prompt and access provenance" }
  ]);
  assert.equal(result.length, 2);
  assert.ok(result.every((model) => model.selected === false));
});

test("every public claim binds known sources and open claims bind a reopen trigger", () => {
  const sourceIds = new Set(sources.sources.map((source) => source.id));
  const claimIds = new Set();
  for (const claim of claims.claims) {
    assert.ok(claim.id && !claimIds.has(claim.id));
    claimIds.add(claim.id);
    assert.ok(claim.sourceIds.length > 0);
    assert.ok(claim.sourceIds.every((id) => sourceIds.has(id)));
    if (claim.status === "UNKNOWN" || claim.status === "NOT_PROVEN") {
      assert.ok(claim.reopenTrigger?.length >= 30);
    }
  }
});

test("readable and machine source registries expose identical ids", () => {
  const machine = sources.sources.map((source) => source.id).sort();
  const readable = [...readableSources.matchAll(/^- \*\*(S\d+) —\*\*/gmu)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(readable, machine);
});

test("the data-access and plagiarism conclusions remain unproven", () => {
  assert.equal(claims.claims.find((claim) => claim.id === "DATA-001").status, "NOT_PROVEN");
  assert.equal(claims.claims.find((claim) => claim.id === "CREDIT-002").status, "NOT_PROVEN");
});

test("timeline never upgrades a source-reported event to observed private fact", () => {
  const privateEvents = timeline.events.filter((event) => event.sourceIds.includes("S05") && event.date < "2026-09-08");
  assert.ok(privateEvents.length >= 3);
  assert.ok(privateEvents.every((event) => event.status !== "OBSERVED_PRIVATE_FACT"));
});

test("value ledger preserves more than one non-fungible value track", () => {
  const ids = new Set(values.tracks.map((track) => track.id));
  assert.ok(ids.has("CLAY_PRIZE"));
  assert.ok(ids.has("PROOF_TRUTH"));
  assert.ok(ids.has("SCIENTIFIC_CREDIT"));
  assert.ok(ids.has("HUMAN_SOCIAL_VALUE"));
  assert.equal(values.tracks.find((track) => track.id === "LEGAL_REMEDY").amount, null);
});

test("invalid or empty claim inputs fail closed", () => {
  assert.throws(() => bindClaim({ claimType: "PLAGIARISM", evidenceState: "OBSERVED", sourceIds: ["S01"], referent: "x" }));
  assert.throws(() => classifyMillion(Number.NaN, "Clay", "rules"));
  assert.throws(() => compareModels([{ id: "A", prediction: "x", discriminator: "y" }]));
});

test("HALVETH/LUCINET navigation preserves every general-research axis", () => {
  assert.equal(navigation.entityVersion, "1.0.0");
  assert.equal(navigation.selectedAxisId, "COUNTERHYPOTHESIS");
  assert.equal(navigation.diagonalPairCoverage.state, "COMPLETE_FOR_MATERIAL_CANDIDATE_GRAPH");
  assert.equal(navigation.registeredAxisIds.length, 8);
  assert.equal(navigation.receiptDigest, "sha256:d0e4858c4ae4063b7e17aa5680fb071b050e2fcb31b647ef32f8e927783fd3f2");
});
