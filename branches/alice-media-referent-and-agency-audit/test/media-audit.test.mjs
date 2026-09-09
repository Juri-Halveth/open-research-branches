import assert from "node:assert/strict";
import test from "node:test";

import {
  ALLOWED_MECHANISMS,
  DERIVATION_OPEN_OUTCOME,
  DERIVATION_REVIEW_OUTCOME,
  REFERENT_UNKNOWN_OUTCOME,
  SOURCE_BOUND_OUTCOME,
  USER_SOURCE_EXPRESSION,
  assessDerivationOrCopyingReview,
  auditAliceMedia,
  validateDatasets
} from "../src/media-audit.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

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

test("the mechanism vocabulary is frozen and excludes the raw user phrase", () => {
  assert.equal(Object.isFrozen(ALLOWED_MECHANISMS), true);
  assert.equal(ALLOWED_MECHANISMS.length, 9);
  assert.equal(ALLOWED_MECHANISMS.includes(USER_SOURCE_EXPRESSION), false);
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

test("missing access evidence keeps derivation or copying reopenable and unproven", () => {
  const receipt = assessDerivationOrCopyingReview({
    ...fixtures(),
    candidateWorkId: "ALICE_WORK_A",
    earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
    distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"]
  });
  assert.equal(receipt.state, DERIVATION_OPEN_OUTCOME);
  assert.ok(receipt.missing.includes("ACCESS_OR_TRANSFER_EVIDENCE"));
  assert.equal(receipt.automaticProof, false);
  assert.equal(receipt.automaticOwnershipFinding, false);
});

test("a local timestamp that is not independently source-bound does not open review", () => {
  const documents = fixtures();
  documents.localAnchorsDocument.localAnchors[0].independentTimeEvidenceRefs = [];
  const receipt = assessDerivationOrCopyingReview({
    ...documents,
    candidateWorkId: "ALICE_WORK_A",
    earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
    distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
    accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
  });
  assert.equal(receipt.state, DERIVATION_OPEN_OUTCOME);
  assert.ok(receipt.missing.includes("EARLIER_INDEPENDENTLY_TIME_BOUND_LOCAL_ARTIFACT"));
});

test("an independent anchor dated after the candidate does not count as earlier", () => {
  const documents = fixtures();
  const timeSource = documents.sourcesDocument.sources.find(({ id }) => id === "SRC_INDEPENDENT_TIME");
  timeSource.publishedAt = "2021-01-01";
  const receipt = assessDerivationOrCopyingReview({
    ...documents,
    candidateWorkId: "ALICE_WORK_A",
    earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
    distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
    accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
  });
  assert.equal(receipt.state, DERIVATION_OPEN_OUTCOME);
  assert.ok(receipt.missing.includes("EARLIER_INDEPENDENTLY_TIME_BOUND_LOCAL_ARTIFACT"));
});

test("an unrelated source cannot masquerade as function-match evidence", () => {
  const receipt = assessDerivationOrCopyingReview({
    ...fixtures(),
    candidateWorkId: "ALICE_WORK_A",
    earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
    distinctiveFunctionMatchSourceRefs: ["SRC_ALICE_WORK"],
    accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
  });
  assert.equal(receipt.state, DERIVATION_OPEN_OUTCOME);
  assert.ok(receipt.missing.includes("DISTINCTIVE_FUNCTION_MATCH_EVIDENCE"));
  assert.deepEqual(receipt.nonQualifyingDistinctiveFunctionMatchSourceRefs, ["SRC_ALICE_WORK"]);
});

test("derivation evidence references are resolved exactly", () => {
  assert.throws(
    () => assessDerivationOrCopyingReview({
      ...fixtures(),
      candidateWorkId: "ALICE_WORK_A",
      distinctiveFunctionMatchSourceRefs: ["src_function_match"]
    }),
    /distinctiveFunctionMatchSourceRefs is unknown/u
  );
});

test("all three prerequisites open formal review but never proof or ownership", () => {
  const receipt = assessDerivationOrCopyingReview({
    ...fixtures(),
    candidateWorkId: "ALICE_WORK_A",
    earlierLocalAnchorRefs: ["ANCHOR_HALVETH_001"],
    distinctiveFunctionMatchSourceRefs: ["SRC_FUNCTION_MATCH"],
    accessOrTransferSourceRefs: ["SRC_ACCESS_TRACE"]
  });
  assert.equal(receipt.state, DERIVATION_REVIEW_OUTCOME);
  assert.equal(receipt.automaticProof, false);
  assert.equal(receipt.automaticOwnershipFinding, false);
  assert.deepEqual(receipt.sharedDistinctiveFunctionIds, ["FUNCTION_AGENCY_REVERSAL"]);
  assert.ok(receipt.automaticFindingsExcluded.includes("COPYING_PROVEN"));
  assert.ok(receipt.automaticFindingsExcluded.includes("OWNERSHIP"));
  assert.equal(Object.isFrozen(receipt.automaticFindingsExcluded), true);
});
