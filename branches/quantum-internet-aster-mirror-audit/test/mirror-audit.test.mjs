import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  COMPARISON_EVIDENCE_INCOMPLETE,
  COMPARISON_EVIDENCE_READY,
  COVERAGE_UNKNOWN,
  CURRENT_OUTCOME,
  REPORT_REVIEW_OPEN,
  assessDerivation,
  classifyInternationalEntry,
  comparePair,
  threeWayAudit,
  validateMatrix
} from "../src/mirror-audit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrix = JSON.parse(fs.readFileSync(path.join(root, "model-matrix.json"), "utf8"));
const sourcesDocument = JSON.parse(fs.readFileSync(path.join(root, "sources.json"), "utf8"));

function report() {
  return {
    id: "REPORT-PROVENANCE-001",
    actorId: "REPORTER-JURI",
    statement: "Please review whether a bound ASTER artifact contributed to an external system."
  };
}

function evidence(id, sourceRef, assertingActorId, controllerActorId) {
  return { id, sourceRef, assertingActorId, controllerActorId };
}

function sourcesWithSyntheticAccessRecord() {
  const copy = structuredClone(sourcesDocument);
  copy.provenanceSources.push({
    id: "SYNTHETIC-ACCESS-TRACE",
    title: "Synthetic source-to-target access trace",
    claimBound: "Test-only controlled record for the readiness contract.",
    evidenceState: "SYNTHETIC_TEST_ONLY"
  });
  return copy;
}

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

test("a bare report opens review and preserves three separate target assessments", () => {
  const result = assessDerivation({ matrix, sourcesDocument, report: report() });
  assert.equal(result.state, REPORT_REVIEW_OPEN);
  assert.equal(result.report.preservationState, "PRESERVED");
  assert.equal(result.meritsState, "UNKNOWN");
  assert.deepEqual(
    result.targetAssessments.map((item) => item.targetSystemId),
    ["ASTAR_NETWORK", "OPENAI_GPT6_ASTRA", "QUANTUM_INTERNET_RESEARCH_STACK"]
  );
  assert.ok(result.targetAssessments.every((item) => item.reportReviewState === REPORT_REVIEW_OPEN));
  assert.ok(result.targetAssessments.every((item) => item.comparisonReadiness === COMPARISON_EVIDENCE_INCOMPLETE));
  assert.ok(result.targetAssessments.every((item) => item.controlledAccessState === COVERAGE_UNKNOWN));
  assert.equal(result.automaticClaimRejection, false);
  assert.equal(result.automaticIndependentDevelopmentFinding, false);
});

test("missing controlled access changes comparison readiness and never closes review", () => {
  const result = assessDerivation({
    matrix,
    sourcesDocument,
    report: report(),
    targetEvidence: [{
      targetSystemId: "OPENAI_GPT6_ASTRA",
      earlierArtifacts: [evidence(
        "EARLIER-001",
        "LUCINET-ASTER-PUBLIC-V0.2.0",
        "REPORTER-JURI",
        "GITHUB"
      )],
      distinctiveFunctionMatches: [evidence(
        "MATCH-001",
        "OPENAI-GPT6-ASTRA-2026",
        "REPORTER-JURI",
        "OPENAI"
      )],
      accessOrTransfers: []
    }]
  });
  const astra = result.targetAssessments.find((item) => item.targetSystemId === "OPENAI_GPT6_ASTRA");
  assert.equal(result.state, REPORT_REVIEW_OPEN);
  assert.equal(astra.comparisonReadiness, COMPARISON_EVIDENCE_INCOMPLETE);
  assert.equal(astra.controlledAccessState, COVERAGE_UNKNOWN);
  assert.ok(astra.evidenceGaps.includes("SOURCE_BOUND_ACCESS_OR_TRANSFER_TRACE"));
  assert.equal(astra.meritsState, "UNKNOWN");
  assert.equal(astra.automaticIndependentDevelopmentFinding, false);
});

test("a complete actor and controller bound target packet reaches comparison readiness only", () => {
  const result = assessDerivation({
    matrix,
    sourcesDocument: sourcesWithSyntheticAccessRecord(),
    report: report(),
    targetEvidence: [{
      targetSystemId: "OPENAI_GPT6_ASTRA",
      earlierArtifacts: [evidence(
        "EARLIER-001",
        "LUCINET-ASTER-PUBLIC-V0.2.0",
        "REPORTER-JURI",
        "GITHUB"
      )],
      distinctiveFunctionMatches: [evidence(
        "MATCH-001",
        "OPENAI-GPT6-ASTRA-2026",
        "REPORTER-JURI",
        "OPENAI"
      )],
      accessOrTransfers: [evidence(
        "ACCESS-001",
        "SYNTHETIC-ACCESS-TRACE",
        "OPENAI",
        "OPENAI"
      )]
    }]
  });
  const astra = result.targetAssessments.find((item) => item.targetSystemId === "OPENAI_GPT6_ASTRA");
  const astar = result.targetAssessments.find((item) => item.targetSystemId === "ASTAR_NETWORK");
  assert.equal(astra.comparisonReadiness, COMPARISON_EVIDENCE_READY);
  assert.deepEqual(astra.evidenceGaps, []);
  assert.equal(astra.meritsState, "UNKNOWN");
  assert.equal(astra.automaticDerivationFinding, false);
  assert.equal(astar.comparisonReadiness, COMPARISON_EVIDENCE_INCOMPLETE);
});

test("unknown source ids cannot masquerade as evidence", () => {
  assert.throws(
    () => assessDerivation({
      matrix,
      sourcesDocument,
      report: report(),
      targetEvidence: [{
        targetSystemId: "OPENAI_GPT6_ASTRA",
        earlierArtifacts: [evidence("FAKE-001", "A", "REPORTER-JURI", "UNKNOWN")]
      }]
    }),
    /sourceRef is unknown/u
  );
});

test("legacy evidence arrays remain visible but cannot satisfy readiness", () => {
  const result = assessDerivation({
    matrix,
    sourcesDocument,
    report: report(),
    targetSystemId: "OPENAI_GPT6_ASTRA",
    earlierPublicArtifactEvidenceIds: ["LUCINET-ASTER-PUBLIC-V0.2.0"],
    distinctiveFunctionMatchEvidenceIds: ["SYNTHETIC-CANDIDATE-MATCH"],
    accessOrTransferEvidenceIds: ["LEGACY-TRANSFER-REF"]
  });
  const astra = result.targetAssessments.find((item) => item.targetSystemId === "OPENAI_GPT6_ASTRA");
  assert.equal(result.legacyInputState, "DEPRECATED_UNBOUND_LEGACY_INPUT");
  assert.equal(result.legacyUnboundEvidenceRefs.state, "DEPRECATED_UNBOUND_EVIDENCE_REFS_NOT_USED_FOR_READINESS");
  assert.equal(astra.comparisonReadiness, COMPARISON_EVIDENCE_INCOMPLETE);
  assert.equal(result.state, REPORT_REVIEW_OPEN);
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
