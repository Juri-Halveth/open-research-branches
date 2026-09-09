import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CURRENT_OUTCOME,
  assessDerivation,
  classifyInternationalEntry,
  comparePair,
  threeWayAudit,
  validateMatrix
} from "../src/mirror-audit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrix = JSON.parse(fs.readFileSync(path.join(root, "model-matrix.json"), "utf8"));

test("the public matrix contains distinct bound referents", () => {
  validateMatrix(matrix);
  const namespaces = new Set(matrix.systems.map((system) => system.namespace));
  assert.equal(namespaces.size, matrix.systems.length);
});

test("the three-way audit returns every unordered pair exactly once", () => {
  const result = threeWayAudit(matrix, matrix.defaultThreeWay);
  assert.equal(result.pairCount, 3);
  assert.equal(result.outcome, CURRENT_OUTCOME);
  assert.equal(new Set(result.pairs.map((pair) => [pair.leftId, pair.rightId].sort().join("::"))).size, 3);
});

test("LUCINET ASTER and Astar Network remain separate despite name similarity", () => {
  const result = comparePair(matrix, "LUCINET_ASTER", "ASTAR_NETWORK");
  assert.equal(result.sameNamespace, false);
  assert.equal(result.sameKind, false);
  assert.equal(result.exactSharedFunctionIds.length, 0);
  assert.match(result.semantics, /NOT_IDENTITY/u);
});

test("missing access keeps the origin claim reopenable and unproven", () => {
  const result = assessDerivation({
    earlierPublicArtifactEvidenceIds: ["LUCINET-ASTER-PUBLIC-V0.2.0"],
    distinctiveFunctionMatchEvidenceIds: ["SYNTHETIC-CANDIDATE-MATCH"]
  });
  assert.equal(result.state, "NOT_PROVEN_REOPENABLE");
  assert.ok(result.missing.includes("SOURCE_BOUND_ACCESS_OR_TRANSFER_TRACE"));
});

test("complete caller evidence opens review without auto-proving copying", () => {
  const result = assessDerivation({
    earlierPublicArtifactEvidenceIds: ["A"],
    distinctiveFunctionMatchEvidenceIds: ["B"],
    accessOrTransferEvidenceIds: ["C"]
  });
  assert.equal(result.state, "FORMAL_DERIVATION_REVIEW_ELIGIBLE_NOT_PROOF");
  assert.match(result.outcome, /NO_AUTOMATIC/u);
});

test("international entries without sources stay open rather than receiving invented credit", () => {
  const result = classifyInternationalEntry({
    name: "XYAZ",
    scope: "USER_NAMED_UNDEFINED_REFERENCE",
    sourceIds: []
  });
  assert.equal(result.state, "OPEN_CONTRIBUTION_APERTURE");
});

test("private inspiration is retained only as a minimized user hypothesis", () => {
  const hypotheses = JSON.parse(fs.readFileSync(path.join(root, "origin-hypotheses.json"), "utf8"));
  const relational = hypotheses.hypotheses.find((item) => item.id === "RELATIONAL_INSPIRATION_SET");
  assert.equal(relational.state, "USER_REPORTED_HYPOTHESIS");
  assert.equal(relational.publicPersonalNamesIncluded, false);
  assert.equal(relational.externalParticipationEvidence, "UNKNOWN");
});
