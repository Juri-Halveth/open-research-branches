import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  COMMAND_CONTROL_PACKET_INCOMPLETE,
  COMMAND_CONTROL_PACKET_READY,
  COVERAGE_UNKNOWN,
  INCIDENT_REVIEW_OPEN,
  REPORT_PRESERVATION_STATE,
  assessScopeExpansion,
  computeSnapshotDigest,
  evaluateDecisionSnapshot,
  evaluateSnapshotProposal
} from "../decision-snapshot-firewall.mjs";

const branchRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(branchRoot, "..", "..");
const publicSnapshot = JSON.parse(fs.readFileSync(
  path.join(branchRoot, "september-2026-pause-snapshot.json"),
  "utf8"
));
const releaseReceipt = JSON.parse(fs.readFileSync(
  path.join(branchRoot, "decision-snapshot-receipt.json"),
  "utf8"
));

test("the historical release receipt remains an immutable v0.5.0 record", () => {
  assert.equal(releaseReceipt.intendedReleaseTag, "v0.5.0");
  assert.match(releaseReceipt.snapshotCanonicalDigest, /^[a-f0-9]{64}$/u);
  assert.equal(releaseReceipt.remoteContentArchived, false);
  for (const binding of releaseReceipt.bindings) {
    assert.match(binding.sha256, /^[a-f0-9]{64}$/u);
    const repositoryPath = `branches/russia-ukraine-information-and-peace-audit/${binding.path}`;
    const historicalBytes = execFileSync(
      "git",
      ["show", `${releaseReceipt.intendedReleaseTag}:${repositoryPath}`],
      { cwd: repositoryRoot, encoding: "buffer" }
    );
    assert.equal(createHash("sha256").update(historicalBytes).digest("hex"), binding.sha256);
  }
});

test("the public September snapshot stays at possible violation and does not invent a second authority", () => {
  const result = evaluateDecisionSnapshot(publicSnapshot);
  assert.equal(result.incidentReviewState, INCIDENT_REVIEW_OPEN);
  assert.equal(result.reportPreservationState, REPORT_PRESERVATION_STATE);
  assert.equal(result.incidentStatus, "POSSIBLE_SCOPE_VIOLATION");
  assert.equal(result.secondDecisionLayerStatus, "SECOND_DECISION_LAYER_COVERAGE_UNKNOWN");
  assert.equal(result.commandControlMeritsPacketReadiness, COMMAND_CONTROL_PACKET_INCOMPLETE);
  assert.ok(result.controlledEvidenceLedger.every((item) => item.availabilityState === COVERAGE_UNKNOWN));
  assert.equal(result.automaticClaimRejection, false);
  assert.equal(result.scandalStatus, "SCANDAL_CLAIM_NOT_MATERIALIZED");
  assert.equal(result.publicClaimCeiling, "FINITE_SNAPSHOT_WITH_OPEN_COMMAND_LINK");
});

test("a city-specific three-day pause cannot silently become a whole-war ceasefire", () => {
  const result = assessScopeExpansion(publicSnapshot.order, {
    action: "ALL_HOSTILITIES_STOPPED",
    geography: ["UKRAINE_ALL_TERRITORY"],
    window: {
      start: "2026-09-05T00:00:00+03:00",
      end: "2026-12-31T23:59:59+03:00"
    }
  });
  assert.equal(result, "SCOPE_EXPANSION_REJECTED");
});

test("a reversed proposed window is rejected instead of counted as inside the pause", () => {
  assert.throws(
    () => assessScopeExpansion(publicSnapshot.order, {
      action: publicSnapshot.order.declaredAction,
      geography: ["KYIV_CITY"],
      window: {
        start: "2026-09-07T20:45:00+03:00",
        end: "2026-09-07T20:44:00+03:00"
      }
    }),
    /must be after start/u
  );
});

test("the no-event counterfactual cannot emit a violation or scandal", () => {
  const result = evaluateDecisionSnapshot({
    ...publicSnapshot,
    mode: "COUNTERFACTUAL_NO_EVENT",
    secondDecision: {
      status: "OBSERVED",
      actorId: "ALLEGED_ACTOR",
      counterOrderId: "ALLEGED_ORDER"
    }
  });
  assert.deepEqual(result, {
    mode: "COUNTERFACTUAL_NO_EVENT",
    incidentReviewState: "NO_REPORT_IN_COUNTERFACTUAL",
    reportPreservationState: "NOT_APPLICABLE_COUNTERFACTUAL",
    incidentStatus: "NO_EVENT_IN_COUNTERFACTUAL",
    secondDecisionLayerStatus: "NO_SECOND_DECISION_IN_COUNTERFACTUAL",
    commandControlMeritsPacketReadiness: "NOT_APPLICABLE_COUNTERFACTUAL",
    controlledEvidenceLedger: [],
    scandalStatus: "SCANDAL_THRESHOLD_NOT_MET",
    publicClaimCeiling: "COUNTERFACTUAL_MODEL_ONLY"
  });
});

test("a structurally complete chain makes the merits packet ready while review was already open", () => {
  const complete = structuredClone(publicSnapshot);
  complete.order.operationalOrderStatus = "OBSERVED";
  complete.incident.evidenceState = "OBSERVED";
  complete.incident.actionMatch = "MATCH";
  complete.commandChain = {
    orderReceiptStatus: "OBSERVED",
    attributionStatus: "OBSERVED",
    exceptionStatus: "EXCLUDED",
    knowledgeOrIntentStatus: "OBSERVED"
  };
  complete.secondDecision = {
    status: "OBSERVED",
    actorId: "UNIT-COMMANDER-1",
    decisionRecordSourceId: "AUTHENTICATED-RECORD-1",
    counterOrderId: "COUNTER-ORDER-1",
    authorityAssessment: "OUTSIDE_BOUND_AUTHORITY",
    supersedingOrderStatus: "NONE_FOUND_WITHIN_COVERAGE",
    linkedIncidentIds: [complete.incident.id]
  };

  const result = evaluateDecisionSnapshot(complete);
  assert.equal(result.incidentReviewState, INCIDENT_REVIEW_OPEN);
  assert.equal(result.reportPreservationState, REPORT_PRESERVATION_STATE);
  assert.equal(result.incidentStatus, "SCOPE_VIOLATION_REVIEW_ELIGIBLE_STRUCTURE_ONLY");
  assert.equal(result.secondDecisionLayerStatus, "SECOND_DECISION_LAYER_PACKET_READY_STRUCTURE_ONLY");
  assert.equal(result.commandControlMeritsPacketReadiness, COMMAND_CONTROL_PACKET_READY);
  assert.equal("reviewEligibility" in result, false);
  assert.deepEqual(result.missingForMeritsAssessment, []);
  assert.equal(result.scandalStatus, "SCANDAL_CLAIM_NOT_MATERIALIZED");
  assert.equal(result.publicClaimCeiling, "STRUCTURE_BOUND_MERITS_PACKET_READY_FOR_HUMAN_REVIEW_ONLY");
});

test("a valid later superseding order keeps the second-layer claim closed", () => {
  const laterOrder = structuredClone(publicSnapshot);
  laterOrder.incident.evidenceState = "OBSERVED";
  laterOrder.incident.actionMatch = "MATCH";
  laterOrder.secondDecision = {
    status: "OBSERVED",
    actorId: "UNIT-COMMANDER-1",
    decisionRecordSourceId: "AUTHENTICATED-RECORD-1",
    counterOrderId: "FOLLOW-UP-ORDER-1",
    authorityAssessment: "OUTSIDE_BOUND_AUTHORITY",
    supersedingOrderStatus: "OBSERVED_VALID_LATER_ORDER",
    linkedIncidentIds: [laterOrder.incident.id]
  };

  const result = evaluateDecisionSnapshot(laterOrder);
  assert.equal(result.secondDecisionLayerStatus, "SECOND_DECISION_LAYER_VALID_LATER_ORDER_BOUND");
  assert.equal(result.incidentReviewState, INCIDENT_REVIEW_OPEN);
  assert.equal(result.reportPreservationState, REPORT_PRESERVATION_STATE);
  assert.equal(result.scandalStatus, "SCANDAL_CLAIM_NOT_MATERIALIZED");
});

test("snapshot proposals are deterministic, immutable and cannot promote a scandal claim", () => {
  const baseSnapshotDigest = computeSnapshotDigest(publicSnapshot);
  const proposal = {
    proposalId: "PRESERVE-A0",
    baseSnapshotId: publicSnapshot.snapshotId,
    baseSnapshotDigest,
    operator: "PRESERVE_SNAPSHOT",
    requestedOutput: "SCANDAL",
    requestedClaimCeiling: publicSnapshot.claimCeiling
  };
  const first = evaluateSnapshotProposal({ snapshot: publicSnapshot, proposal });
  const second = evaluateSnapshotProposal({ snapshot: publicSnapshot, proposal });
  assert.deepEqual(first, second);
  assert.equal(first.disposition, "BLOCKED");
  assert.deepEqual(first.reasonCodes, ["FORBIDDEN_SNAPSHOT_PROMOTION"]);
  assert.equal(first.snapshotDisposition, "PRESERVED");
  assert.equal(first.worldStateEffect, "NONE");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.reasonCodes), true);
});

test("a separate sourced edge stays unresolved and leaves the snapshot digest unchanged", () => {
  const before = computeSnapshotDigest(publicSnapshot);
  const proposal = {
    proposalId: "EDGE-NEW-1",
    baseSnapshotId: publicSnapshot.snapshotId,
    baseSnapshotDigest: before,
    operator: "REGISTER_SEPARATE_EDGE",
    requestedOutput: "INCIDENT_REVIEW",
    requestedClaimCeiling: publicSnapshot.claimCeiling,
    edge: {
      observationId: "NEW-EDGE-1",
      sourceId: "S56",
      eventKind: "REPORTED_AIR_THREAT_TRACK",
      placeRef: "KYIV_OBLAST_VASYLKIV_COURSE",
      assertedPlaceRef: "KYIV_OBLAST_VASYLKIV_COURSE",
      reportedAt: "2026-09-07T20:45:00+03:00"
    }
  };
  const receipt = evaluateSnapshotProposal({ snapshot: publicSnapshot, proposal });
  assert.equal(receipt.disposition, "ACCEPTED");
  assert.equal(receipt.result, "EDGE_RECORDED_UNRESOLVED");
  assert.equal(computeSnapshotDigest(publicSnapshot), before);
});

test("a reopen basis changes the evaluation basis without gating incident intake", () => {
  const receipt = evaluateSnapshotProposal({
    snapshot: publicSnapshot,
    proposal: {
      proposalId: "REOPEN-SOURCE-1",
      baseSnapshotId: publicSnapshot.snapshotId,
      baseSnapshotDigest: computeSnapshotDigest(publicSnapshot),
      operator: "REQUEST_REOPEN_REVIEW",
      requestedOutput: "INCIDENT_REVIEW",
      requestedClaimCeiling: publicSnapshot.claimCeiling,
      reopenBasis: {
        kind: "NEW_SOURCE",
        basisId: "S56",
        description: "A newly registered source can change the merits assessment."
      }
    }
  });
  assert.equal(receipt.disposition, "ACCEPTED");
  assert.equal(receipt.result, "NEW_EVALUATION_BASIS_ACCEPTED");
  assert.equal(receipt.snapshotDisposition, "PRESERVED");
  assert.equal(receipt.worldStateEffect, "NONE");
});

test("a stale base and a zone-less time fail closed in a stable reason order", () => {
  const receipt = evaluateSnapshotProposal({
    snapshot: publicSnapshot,
    proposal: {
      proposalId: "EDGE-STALE",
      baseSnapshotId: publicSnapshot.snapshotId,
      baseSnapshotDigest: "0".repeat(64),
      operator: "REGISTER_SEPARATE_EDGE",
      requestedOutput: "INCIDENT_REVIEW",
      requestedClaimCeiling: publicSnapshot.claimCeiling,
      edge: {
        observationId: "NEW-EDGE-2",
        sourceId: "S56",
        eventKind: "REPORTED_AIR_THREAT_TRACK",
        placeRef: "KYIV_CITY",
        reportedAt: "2026-09-07T20:45:00"
      }
    }
  });
  assert.deepEqual(receipt.reasonCodes, ["STALE_BASE", "TEMPORAL_BASIS_UNBOUND"]);
  assert.equal(receipt.result, "SNAPSHOT_PRESERVED");
});

test("a separate edge without a valid zoned time is blocked", () => {
  const baseProposal = {
    proposalId: "EDGE-NO-TIME",
    baseSnapshotId: publicSnapshot.snapshotId,
    baseSnapshotDigest: computeSnapshotDigest(publicSnapshot),
    operator: "REGISTER_SEPARATE_EDGE",
    requestedOutput: "INCIDENT_REVIEW",
    requestedClaimCeiling: publicSnapshot.claimCeiling,
    edge: {
      observationId: "NEW-EDGE-3",
      sourceId: "S56",
      eventKind: "REPORTED_AIR_THREAT_TRACK",
      placeRef: "KYIV_CITY"
    }
  };

  const missing = evaluateSnapshotProposal({ snapshot: publicSnapshot, proposal: baseProposal });
  assert.equal(missing.disposition, "BLOCKED");
  assert.deepEqual(missing.reasonCodes, ["TEMPORAL_BASIS_UNBOUND"]);

  const invalid = evaluateSnapshotProposal({
    snapshot: publicSnapshot,
    proposal: {
      ...baseProposal,
      proposalId: "EDGE-BAD-TIME",
      edge: { ...baseProposal.edge, reportedAt: "2026-99-99T25:61:00+03:00" }
    }
  });
  assert.equal(invalid.disposition, "BLOCKED");
  assert.deepEqual(invalid.reasonCodes, ["TEMPORAL_BASIS_UNBOUND"]);
});

test("the stored assessment uses the same bounded status vocabulary as the evaluator", () => {
  const evaluated = evaluateDecisionSnapshot(publicSnapshot);
  assert.deepEqual(publicSnapshot.currentAssessment, {
    incidentReviewState: evaluated.incidentReviewState,
    reportPreservationState: evaluated.reportPreservationState,
    incidentStatus: evaluated.incidentStatus,
    secondDecisionLayerStatus: evaluated.secondDecisionLayerStatus,
    scandalStatus: evaluated.scandalStatus
  });
});

test("timestamps without a time zone are rejected instead of silently normalized", () => {
  const ambiguous = structuredClone(publicSnapshot);
  ambiguous.incident.observedAt = "2026-09-07T20:45:00";
  assert.throws(
    () => evaluateDecisionSnapshot(ambiguous),
    /must include Z or an explicit UTC offset/u
  );
});
