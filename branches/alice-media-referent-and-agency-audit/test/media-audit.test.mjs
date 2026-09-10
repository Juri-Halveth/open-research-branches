import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ALLOWED_MECHANISMS,
  ASSERTION_EVIDENCE_REFERENCED,
  ASSERTION_EVIDENCE_UNKNOWN,
  COMPARISON_EVIDENCE_INCOMPLETE,
  COMPARISON_EVIDENCE_READY,
  PRODUCTION_DUTY_BASIS_BOUND,
  PRODUCTION_DUTY_UNBOUND,
  REFERENT_UNKNOWN_OUTCOME,
  REPORT_REVIEW_OPEN,
  SOURCE_BOUND_OUTCOME,
  USER_SOURCE_EXPRESSION,
  assessDerivationOrCopyingReview,
  auditAliceMedia,
  validateDatasets
} from "../src/media-audit.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;
const publicContract = JSON.parse(readFileSync(new URL("../reciprocal-evidence-contract.json", import.meta.url), "utf8"));
const publicSources = JSON.parse(readFileSync(new URL("../sources.json", import.meta.url), "utf8"));

function fixtures() {
  const sourcesDocument = {
    schemaVersion: "alice-media-sources.v1",
    sources: [
      {
        id: "SRC_ALICE_WORK",
        url: "https://example.test/alice-work",
        title: "Alice work source",
        publisher: "Example archive",
        sourceType: "OFFICIAL_WORK_PAGE",
        publishedAt: "2020-01-01"
      },
      {
        id: "SRC_LOCAL_ARTIFACT",
        url: "https://example.test/local-artifact",
        title: "Local artifact",
        publisher: "Public repository",
        sourceType: "PUBLIC_REPOSITORY"
      },
      {
        id: "SRC_INDEPENDENT_TIME",
        url: "https://example.test/time-receipt",
        title: "Independent timestamp receipt",
        publisher: "Independent archive",
        sourceType: "INDEPENDENT_TIMESTAMP",
        publishedAt: "2019-01-01T00:00:00Z"
      },
      {
        id: "SRC_FUNCTION_MATCH",
        url: "https://example.test/function-match",
        title: "Function-level comparison",
        publisher: "Comparison archive",
        sourceType: "COMPARISON_RECEIPT"
      },
      {
        id: "SRC_ACCESS_TRACE",
        url: "https://example.test/access-trace",
        title: "Access trace",
        publisher: "Access archive",
        sourceType: "ACCESS_RECEIPT"
      },
      {
        id: "SRC_GOVERNING_PROCESS",
        url: "https://example.test/governing-process",
        title: "Synthetic governing process",
        publisher: "Example process owner",
        sourceType: "GOVERNING_PROCESS_RULE"
      },
      {
        id: "SRC_UNRELATED_POLICY",
        url: "https://example.test/unrelated-policy",
        title: "Unrelated policy",
        publisher: "Example publisher",
        sourceType: "OFFICIAL_WORK_PAGE"
      }
    ]
  };
  const localAnchorsDocument = {
    schemaVersion: "alice-local-anchor-receipts.v1",
    localAnchors: [
      {
        id: "ANCHOR_HALVETH_001",
        sourceRef: "https://example.test/local-artifact",
        capturedAt: "2019-01-02T00:00:00Z",
        artifactDigest: digest("a"),
        distinctiveFunctionIds: ["FUNCTION_AGENCY_REVERSAL"],
        independentTimeEvidenceRefs: ["SRC_INDEPENDENT_TIME"]
      }
    ]
  };
  const candidateWorksDocument = {
    schemaVersion: "alice-media-candidates.v1",
    sourceExpression: USER_SOURCE_EXPRESSION,
    defaultCandidateWorkId: null,
    candidateWorks: [
      {
        id: "ALICE_WORK_A",
        title: "Alice Work A",
        sourceRefs: ["SRC_ALICE_WORK"],
        mechanisms: ["IN_WORLD_COERCION", "MORAL_ROLE_BLURRING"],
        medium: "screen work",
        markers: ["agency pressure"],
        localAnchorRefs: ["ANCHOR_HALVETH_001"],
        distinctiveFunctionIds: ["FUNCTION_AGENCY_REVERSAL"]
      },
      {
        id: "ALICE_WORK_B",
        title: "Alice Work B",
        sourceRefs: ["SRC_ALICE_WORK"],
        mechanisms: ["TITLE_ALLUSION_ONLY"]
      }
    ]
  };
  return { candidateWorksDocument, sourcesDocument, localAnchorsDocument };
}

function emptyComparisonEvidence() {
  return {
    earlierLocalAnchorRefs: [],
    distinctiveFunctionMatchSourceRefs: [],
    accessOrTransferSourceRefs: []
  };
}

function reviewInput(documents = fixtures(), overrides = {}) {
  return {
    ...documents,
    report: {
      id: "REPORT_ALICE_001",
      actorId: "REPORTER",
      statement: "The reporter requests review of a possible derivation path."
    },
    candidateWorkId: null,
    comparisonEvidence: emptyComparisonEvidence(),
    positiveAssertions: [],
    controlledEvidence: [],
    ...overrides
  };
}

test("the mechanism vocabulary is frozen and excludes the raw user phrase", () => {
  assert.equal(Object.isFrozen(ALLOWED_MECHANISMS), true);
  assert.equal(ALLOWED_MECHANISMS.length, 9);
  assert.equal(ALLOWED_MECHANISMS.includes(USER_SOURCE_EXPRESSION), false);
});

test("the public reciprocal contract binds its legal sources and runtime states", () => {
  const sourceIds = new Set(publicSources.sources.map(({ id }) => id));
  for (const sourceRef of publicContract.legalSourceRefs) assert.equal(sourceIds.has(sourceRef), true, sourceRef);
  assert.equal(publicContract.orthogonalStates.intake, REPORT_REVIEW_OPEN);
  assert.ok(publicContract.orthogonalStates.comparisonReadiness.includes(COMPARISON_EVIDENCE_INCOMPLETE));
  assert.ok(publicContract.orthogonalStates.comparisonReadiness.includes(COMPARISON_EVIDENCE_READY));
  assert.equal(publicContract.syntheticAntCrushingTest.expected.automaticClaimRejection, false);
});

test("dataset validation resolves exact IDs and returns a deeply frozen receipt", () => {
  const receipt = validateDatasets(fixtures());
  assert.equal(receipt.allReferencesResolved, true);
  assert.deepEqual(receipt.candidateWorkIds, ["ALICE_WORK_A", "ALICE_WORK_B"]);
  assert.equal(Object.isFrozen(receipt), true);
  assert.equal(Object.isFrozen(receipt.candidateWorkIds), true);
  assert.match(receipt.receiptDigest, /^sha256:[a-f0-9]{64}$/u);
});

test("unknown keys are rejected fail-closed", () => {
  const documents = fixtures();
  documents.candidateWorksDocument.candidateWorks[0].secretInference = true;
  assert.throws(() => validateDatasets(documents), /unknown keys/u);
});

test("invalid calendar dates are rejected instead of normalized", () => {
  const documents = fixtures();
  documents.sourcesDocument.sources[0].publishedAt = "2020-02-31";
  assert.throws(() => validateDatasets(documents), /valid calendar date/u);
});

test("duplicate candidate IDs are rejected", () => {
  const documents = fixtures();
  documents.candidateWorksDocument.candidateWorks[1].id = "ALICE_WORK_A";
  assert.throws(() => validateDatasets(documents), /duplicate candidate work id/u);
});

test("a source reference must match an exact registered ID", () => {
  const documents = fixtures();
  documents.candidateWorksDocument.candidateWorks[0].sourceRefs = ["src_alice_work"];
  assert.throws(() => validateDatasets(documents), /sourceRefs is unknown/u);
});

test("a local anchor reference must match an exact registered ID", () => {
  const documents = fixtures();
  documents.candidateWorksDocument.candidateWorks[0].localAnchorRefs = ["anchor_halveth_001"];
  assert.throws(() => validateDatasets(documents), /localAnchorRefs is unknown/u);
});

test("a mechanism outside the closed vocabulary is rejected", () => {
  const documents = fixtures();
  documents.candidateWorksDocument.candidateWorks[0].mechanisms = ["SHE_WAS_MADE_BAD"];
  assert.throws(() => validateDatasets(documents), /mechanisms is not allowed/u);
});

test("no selected referent retains the full candidate set and the exact phrase", () => {
  const receipt = auditAliceMedia(fixtures());
  assert.equal(receipt.outcome, REFERENT_UNKNOWN_OUTCOME);
  assert.equal(receipt.selectedCandidateWorkId, null);
  assert.equal(receipt.sourceExpression.raw, USER_SOURCE_EXPRESSION);
  assert.equal(receipt.sourceExpression.directMechanismClassification, null);
  assert.deepEqual(receipt.candidateWorks.map(({ id }) => id), ["ALICE_WORK_A", "ALICE_WORK_B"]);
  assert.equal(Object.isFrozen(receipt.sourceExpression), true);
  assert.equal(Object.isFrozen(receipt.candidateWorks[0].mechanisms), true);
});

test("an exact selected candidate produces only a source-bound narrative comparison", () => {
  const receipt = auditAliceMedia({ ...fixtures(), selectedCandidateWorkId: "ALICE_WORK_A" });
  assert.equal(receipt.outcome, SOURCE_BOUND_OUTCOME);
  assert.deepEqual(receipt.boundSourceRefs, ["SRC_ALICE_WORK"]);
  assert.deepEqual(receipt.mechanisms, ["IN_WORLD_COERCION", "MORAL_ROLE_BLURRING"]);
  assert.ok(receipt.automaticFindingsExcluded.includes("OWNERSHIP"));
  assert.equal(Object.isFrozen(receipt), true);
});

test("candidate selection is case-sensitive and never guessed", () => {
  assert.throws(
    () => auditAliceMedia({ ...fixtures(), selectedCandidateWorkId: "alice_work_a" }),
    /selectedCandidateWorkId is unknown/u
  );
});

test("a bare report opens preservation and review before candidate or comparison evidence exists", () => {
  const receipt = assessDerivationOrCopyingReview({
    ...fixtures(),
    report: {
      id: "REPORT_ALICE_BARE",
      actorId: "REPORTER",
      statement: "The reporter requests review without supplying comparison material."
    }
  });
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.equal(receipt.report.preservationState, "PRESERVED");
  assert.equal(receipt.report.proofEffect, "NONE");
  assert.equal(receipt.meritsState, "UNKNOWN");
  assert.equal(receipt.comparisonReadiness, COMPARISON_EVIDENCE_INCOMPLETE);
  assert.deepEqual(receipt.evidenceGaps, ["EXACT_CANDIDATE_REFERENT"]);
  assert.equal(receipt.automaticClaimRejection, false);
  assert.equal(receipt.automaticFaultFinding, false);
  assert.equal(receipt.automaticAdverseInference, false);
});

test("missing access evidence is a comparison gap and never closes the review", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    candidateWorkId: "ALICE_WORK_A",
    comparisonEvidence: {
      earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
      distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
      accessOrTransferSourceRefs: []
    }
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.equal(receipt.comparisonReadiness, COMPARISON_EVIDENCE_INCOMPLETE);
  assert.ok(receipt.evidenceGaps.includes("ACCESS_OR_TRANSFER_EVIDENCE"));
  assert.equal(receipt.automaticProof, false);
  assert.equal(receipt.automaticOwnershipFinding, false);
});

test("a local timestamp that is not independently source-bound affects comparison readiness only", () => {
  const documents = fixtures();
  documents.localAnchorsDocument.localAnchors[0].independentTimeEvidenceRefs = [];
  const receipt = assessDerivationOrCopyingReview(reviewInput(documents, {
    candidateWorkId: "ALICE_WORK_A",
    comparisonEvidence: {
      earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
      distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
      accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
    }
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.equal(receipt.meritsState, "UNKNOWN");
  assert.ok(receipt.evidenceGaps.includes("EARLIER_INDEPENDENTLY_TIME_BOUND_LOCAL_ARTIFACT"));
});

test("an independent anchor dated after the candidate does not count as earlier", () => {
  const documents = fixtures();
  const timeSource = documents.sourcesDocument.sources.find(({ id }) => id === "SRC_INDEPENDENT_TIME");
  timeSource.publishedAt = "2021-01-01";
  const receipt = assessDerivationOrCopyingReview(reviewInput(documents, {
    candidateWorkId: "ALICE_WORK_A",
    comparisonEvidence: {
      earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
      distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
      accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
    }
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.ok(receipt.evidenceGaps.includes("EARLIER_INDEPENDENTLY_TIME_BOUND_LOCAL_ARTIFACT"));
});

test("an unrelated source cannot masquerade as function-match evidence", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    candidateWorkId: "ALICE_WORK_A",
    comparisonEvidence: {
      earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
      distinctiveFunctionMatchSourceRefs: ["SRC_ALICE_WORK"],
      accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
    }
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.ok(receipt.evidenceGaps.includes("DISTINCTIVE_FUNCTION_MATCH_EVIDENCE"));
  assert.deepEqual(
    receipt.comparisonEvidenceAssessment.nonQualifyingDistinctiveFunctionMatchSourceRefs,
    ["SRC_ALICE_WORK"]
  );
});

test("derivation evidence references are resolved exactly", () => {
  assert.throws(
    () => assessDerivationOrCopyingReview(reviewInput(fixtures(), {
      candidateWorkId: "ALICE_WORK_A",
      comparisonEvidence: {
        earlierLocalAnchorRefs: [],
        distinctiveFunctionMatchSourceRefs: ["src_function_match"],
        accessOrTransferSourceRefs: []
      }
    })),
    /distinctiveFunctionMatchSourceRefs is unknown/u
  );
});

test("all three comparison edges create readiness while merits remain unknown", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    candidateWorkId: "ALICE_WORK_A",
    comparisonEvidence: {
      earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
      distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
      accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
    }
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.equal(receipt.comparisonReadiness, COMPARISON_EVIDENCE_READY);
  assert.equal(receipt.meritsState, "UNKNOWN");
  assert.deepEqual(receipt.evidenceGaps, []);
  assert.equal(receipt.automaticProof, false);
  assert.equal(receipt.automaticFaultFinding, false);
  assert.equal(receipt.automaticOwnershipFinding, false);
  assert.deepEqual(
    receipt.comparisonEvidenceAssessment.sharedDistinctiveFunctionIds,
    ["FUNCTION_AGENCY_REVERSAL"]
  );
  assert.ok(receipt.automaticFindingsExcluded.includes("COPYING_PROVEN"));
  assert.ok(receipt.automaticFindingsExcluded.includes("OWNERSHIP"));
  assert.equal(Object.isFrozen(receipt.automaticFindingsExcluded), true);
});

test("each actor carries only the evidence references attached to that actor's assertion", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    positiveAssertions: [
      {
        id: "ASSERTION_REPORTER",
        actorId: "REPORTER",
        statement: "A transfer path existed.",
        sourceRefs: ["SRC_ACCESS_TRACE"],
        localAnchorRefs: []
      },
      {
        id: "ASSERTION_COUNTERPART",
        actorId: "COUNTERPART",
        statement: "No transfer path existed.",
        sourceRefs: [],
        localAnchorRefs: []
      }
    ]
  }));
  assert.equal(receipt.assertionAssessments[0].evidenceResponsibilityActorId, "REPORTER");
  assert.equal(receipt.assertionAssessments[0].evidenceReferenceState, ASSERTION_EVIDENCE_REFERENCED);
  assert.equal(receipt.assertionAssessments[1].evidenceResponsibilityActorId, "COUNTERPART");
  assert.equal(receipt.assertionAssessments[1].evidenceReferenceState, ASSERTION_EVIDENCE_UNKNOWN);
  assert.equal(receipt.assertionAssessments[1].truthFinding, "NOT_EVALUATED");
});

test("control of an evidence item does not by itself create a production duty", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    controlledEvidence: [{
      id: "INTERNAL_LOG",
      controllerActorId: "COUNTERPART",
      evidenceKind: "ACCESS_LOG",
      declaredAvailableToActorIds: ["COUNTERPART"]
    }]
  }));
  const assessment = receipt.controlledEvidenceAssessments[0];
  assert.equal(assessment.reporterAccessState, "OUTSIDE_DECLARED_AVAILABLE_ACTORS");
  assert.equal(assessment.productionDutyState, PRODUCTION_DUTY_UNBOUND);
  assert.equal(assessment.nonProductionEffect, "NO_AUTOMATIC_ADVERSE_INFERENCE");
});

test("an unknown or type-incompatible production basis is rejected", () => {
  const controlledEvidence = [{
    id: "INTERNAL_LOG",
    controllerActorId: "COUNTERPART",
    evidenceKind: "ACCESS_LOG",
    declaredAvailableToActorIds: ["COUNTERPART"],
    productionDutyBasis: {
      type: "GOVERNING_PROCESS",
      sourceRef: "SRC_DOES_NOT_EXIST",
      scope: "Synthetic process scope."
    }
  }];
  assert.throws(
    () => assessDerivationOrCopyingReview(reviewInput(fixtures(), { controlledEvidence })),
    /sourceRef is unknown/u
  );
  controlledEvidence[0].productionDutyBasis.sourceRef = "SRC_UNRELATED_POLICY";
  assert.throws(
    () => assessDerivationOrCopyingReview(reviewInput(fixtures(), { controlledEvidence })),
    /source type is incompatible/u
  );
});

test("a compatible production basis is bound for human applicability review only", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    controlledEvidence: [{
      id: "INTERNAL_LOG",
      controllerActorId: "COUNTERPART",
      evidenceKind: "ACCESS_LOG",
      declaredAvailableToActorIds: ["COUNTERPART"],
      productionDutyBasis: {
        type: "GOVERNING_PROCESS",
        sourceRef: "SRC_GOVERNING_PROCESS",
        scope: "Synthetic process scope."
      }
    }]
  }));
  const assessment = receipt.controlledEvidenceAssessments[0];
  assert.equal(assessment.productionDutyState, PRODUCTION_DUTY_BASIS_BOUND);
  assert.equal(assessment.productionDutyFinding, "NOT_EVALUATED");
  assert.equal(receipt.automaticAdverseInference, false);
});

test("synthetic ant crushing model keeps observability asymmetry open without automatic blame", () => {
  const receipt = assessDerivationOrCopyingReview(reviewInput(fixtures(), {
    report: {
      id: "SYNTHETIC_ANT_CRUSHING_REPORT",
      actorId: "ANT",
      statement: "A synthetic ant reports crushing pressure."
    },
    controlledEvidence: [{
      id: "SURFACE_CONTACT_RECORD",
      controllerActorId: "SURFACE_OPERATOR",
      evidenceKind: "CONTACT_OR_FORCE_RECORD",
      declaredAvailableToActorIds: ["SURFACE_OPERATOR"]
    }]
  }));
  assert.equal(receipt.state, REPORT_REVIEW_OPEN);
  assert.equal(receipt.report.preservationState, "PRESERVED");
  assert.equal(receipt.meritsState, "UNKNOWN");
  assert.equal(receipt.controlledEvidenceAssessments[0].reporterAccessState, "OUTSIDE_DECLARED_AVAILABLE_ACTORS");
  assert.equal(receipt.controlledEvidenceAssessments[0].productionDutyState, PRODUCTION_DUTY_UNBOUND);
  assert.equal(receipt.automaticProof, false);
  assert.equal(receipt.automaticFaultFinding, false);
  assert.equal(receipt.automaticAdverseInference, false);
  assert.equal(receipt.automaticClaimRejection, false);
});
