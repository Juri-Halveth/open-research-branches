import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compareGraphemes, transformLetters } from "../src/letter-identity.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const branchRoot = path.resolve(here, "..");
const contract = JSON.parse(fs.readFileSync(path.join(branchRoot, "letter-transformations.json"), "utf8"));
const firewall = JSON.parse(fs.readFileSync(path.join(branchRoot, "premise-firewall.json"), "utf8"));

test("K and C remain distinct graphemes", () => {
  const comparison = compareGraphemes("K", "C");
  assert.equal(comparison.codePointsEqual, false);
  assert.equal(comparison.stringEqual, false);
  assert.equal(comparison.personIdentityRelation, "UNBOUND");
});

test("Kevin to Cevin records the scoped K to C operation", () => {
  const receipt = transformLetters("Kevin", ["REPLACE_INITIAL_K_WITH_C"]);
  assert.equal(receipt.output, "Cevin");
  assert.equal(receipt.source, "Kevin");
  assert.equal(receipt.sourcePreserved, true);
  assert.equal(receipt.globalLetterIdentityChanged, false);
});

test("Kevin to Kewin uses a different operator", () => {
  const receipt = transformLetters("Kevin", ["REPLACE_V_WITH_W"]);
  assert.equal(receipt.output, "Kewin");
  assert.deepEqual(receipt.operations.map((item) => item.operatorId), ["REPLACE_V_WITH_W"]);
});

test("Kevin to Celvin is visibly composite", () => {
  const receipt = transformLetters("Kevin", ["REPLACE_INITIAL_K_WITH_C", "INSERT_L_AFTER_FIRST_VOWEL"]);
  assert.equal(receipt.output, "Celvin");
  assert.equal(receipt.operations.length, 2);
  assert.equal(receipt.referentEquality, "UNKNOWN");
});

test("every declared candidate matches its executable operator sequence", () => {
  for (const candidate of contract.candidates) {
    const receipt = transformLetters(candidate.input, candidate.operators);
    assert.equal(receipt.output, candidate.output, candidate.id);
    assert.equal(receipt.stringEquality, candidate.stringEquality, candidate.id);
    assert.equal(receipt.referentEquality, candidate.referentEquality, candidate.id);
  }
});

test("unsupported or empty transformations fail closed", () => {
  assert.throws(() => transformLetters("Kevin", []));
  assert.throws(() => transformLetters("Kevin", ["GLOBAL_IDENTITY_SWAP"]));
  assert.throws(() => compareGraphemes("", "C"));
});

test("premise firewall blocks conclusions from questions, timing, labels and amounts", () => {
  const byInput = new Map(firewall.rules.map((rule) => [rule.input, rule]));
  assert.ok(byInput.get("QUESTION_MARK").forbiddenAutomaticOutputs.includes("RESULT"));
  assert.ok(byInput.get("TEMPORAL_PROXIMITY").forbiddenAutomaticOutputs.includes("CAUSE"));
  assert.ok(byInput.get("PLAGIARISM_WORD").forbiddenAutomaticOutputs.includes("LEGAL_JUDGMENT"));
  assert.ok(byInput.get("MONEY_AMOUNT").forbiddenAutomaticOutputs.includes("TOTAL_VALUE"));
  assert.equal(firewall.defaultState, "OPEN_WITHOUT_CONCLUSION");
});
