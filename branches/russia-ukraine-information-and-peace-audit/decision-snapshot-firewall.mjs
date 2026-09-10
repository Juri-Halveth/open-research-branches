import { createHash } from "node:crypto";

const ISO_WITH_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/u;

const MATCH_STATES = new Set(["MATCH", "POSSIBLE_MATCH", "NO_MATCH", "UNKNOWN"]);

export const INCIDENT_REVIEW_OPEN = "OPEN";
export const REPORT_PRESERVATION_STATE = "USER_REPORT_PRESERVED_REVIEW_OPEN";
export const COMMAND_CONTROL_PACKET_READY = "COMMAND_CONTROL_MERITS_PACKET_READY_FOR_HUMAN_REVIEW_NOT_PROOF";
export const COMMAND_CONTROL_PACKET_INCOMPLETE = "COMMAND_CONTROL_MERITS_PACKET_INCOMPLETE";
export const COVERAGE_UNKNOWN = "COVERAGE_UNKNOWN";

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function parseInstant(value, label) {
  requireText(value, label);
  if (!ISO_WITH_ZONE.test(value)) {
    throw new TypeError(`${label} must include Z or an explicit UTC offset`);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new TypeError(`${label} must be a valid ISO-8601 instant`);
  }
  return milliseconds;
}

function requireMatch(value, label) {
  if (!MATCH_STATES.has(value)) {
    throw new TypeError(`${label} must be MATCH, POSSIBLE_MATCH, NO_MATCH or UNKNOWN`);
  }
  return value;
}

export function validateBoundOrder(order) {
  requireObject(order, "order");
  requireText(order.id, "order.id");
  requireText(order.declaredAction, "order.declaredAction");
  requireObject(order.window, "order.window");
  const start = parseInstant(order.window.start, "order.window.start");
  const end = parseInstant(order.window.end, "order.window.end");
  if (end <= start) throw new RangeError("order.window.end must be after start");
  if (!Array.isArray(order.geography) || order.geography.length === 0) {
    throw new TypeError("order.geography must contain at least one place");
  }
  order.geography.forEach((place, index) => requireText(place, `order.geography[${index}]`));
  return { start, end };
}

export function assessScopeExpansion(order, proposedClaim) {
  validateBoundOrder(order);
  requireObject(proposedClaim, "proposedClaim");
  requireText(proposedClaim.action, "proposedClaim.action");
  requireObject(proposedClaim.window, "proposedClaim.window");
  if (!Array.isArray(proposedClaim.geography) || proposedClaim.geography.length === 0) {
    throw new TypeError("proposedClaim.geography must contain at least one place");
  }

  const sameAction = proposedClaim.action === order.declaredAction;
  const samePlaces = proposedClaim.geography.every((place) => order.geography.includes(place));
  const proposedStart = parseInstant(proposedClaim.window.start, "proposedClaim.window.start");
  const proposedEnd = parseInstant(proposedClaim.window.end, "proposedClaim.window.end");
  if (proposedEnd <= proposedStart) {
    throw new RangeError("proposedClaim.window.end must be after start");
  }
  const insideWindow = proposedStart >= Date.parse(order.window.start)
    && proposedEnd <= Date.parse(order.window.end);

  return sameAction && samePlaces && insideWindow
    ? "CLAIM_WITHIN_DECLARED_SCOPE"
    : "SCOPE_EXPANSION_REJECTED";
}

export function assessIncident(order, incident) {
  const { start, end } = validateBoundOrder(order);
  requireObject(incident, "incident");
  requireText(incident.id, "incident.id");
  const observedAt = parseInstant(incident.observedAt, "incident.observedAt");
  const action = requireMatch(incident.actionMatch, "incident.actionMatch");
  const geography = requireMatch(incident.geographyMatch, "incident.geographyMatch");
  requireText(incident.evidenceState, "incident.evidenceState");

  const inWindow = observedAt >= start && observedAt < end;
  if (!inWindow || action === "NO_MATCH" || geography === "NO_MATCH") {
    return {
      incidentId: incident.id,
      status: "OUTSIDE_DECLARED_SCOPE",
      inWindow,
      actionMatch: action,
      geographyMatch: geography
    };
  }

  const exactMatch = action === "MATCH" && geography === "MATCH";
  const eventBound = ["OBSERVED", "STRONGLY_SUPPORTED"].includes(incident.evidenceState);
  return {
    incidentId: incident.id,
    status: exactMatch && eventBound
      ? "SCOPE_VIOLATION_REVIEW_ELIGIBLE_STRUCTURE_ONLY"
      : "POSSIBLE_SCOPE_VIOLATION",
    inWindow,
    actionMatch: action,
    geographyMatch: geography
  };
}

export function assessSecondDecisionLayer(input, incidentAssessment) {
  requireObject(input, "input");
  requireObject(incidentAssessment, "incidentAssessment");
  const decision = input.secondDecision ?? {};
  const linked = Array.isArray(decision.linkedIncidentIds)
    && decision.linkedIncidentIds.includes(incidentAssessment.incidentId);
  const completeCounterOrder = decision.status === "OBSERVED"
    && typeof decision.actorId === "string" && decision.actorId !== ""
    && typeof decision.decisionRecordSourceId === "string" && decision.decisionRecordSourceId !== ""
    && typeof decision.counterOrderId === "string" && decision.counterOrderId !== ""
    && decision.authorityAssessment === "OUTSIDE_BOUND_AUTHORITY"
    && decision.supersedingOrderStatus === "NONE_FOUND_WITHIN_COVERAGE"
    && linked;

  if (completeCounterOrder) return "SECOND_DECISION_LAYER_PACKET_READY_STRUCTURE_ONLY";
  if (decision.status === "OBSERVED" && decision.supersedingOrderStatus === "OBSERVED_VALID_LATER_ORDER") {
    return "SECOND_DECISION_LAYER_VALID_LATER_ORDER_BOUND";
  }
  return "SECOND_DECISION_LAYER_COVERAGE_UNKNOWN";
}

function controlledEvidenceLedger(input, incidentAssessment, secondDecisionLayerStatus) {
  const chain = input.commandChain ?? {};
  const records = [
    {
      id: "CONTROLLED-OPERATIONAL-ORDER",
      controllerActorId: "ORDER_ISSUER_OR_COMMAND_ARCHIVE",
      evidenceKind: "AUTHENTICATED_OPERATIONAL_ORDER",
      availabilityState: input.order.operationalOrderStatus === "OBSERVED"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    },
    {
      id: "CONTROLLED-ORDER-RECEIPT",
      controllerActorId: "RESPONSIBLE_UNIT_OR_COMMAND_ARCHIVE",
      evidenceKind: "ORDER_RECEIPT_OR_READBACK",
      availabilityState: chain.orderReceiptStatus === "OBSERVED"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    },
    {
      id: "CONTROLLED-INCIDENT-EFFECT",
      controllerActorId: "SENSOR_OPERATOR_OR_INCIDENT_ARCHIVE",
      evidenceKind: "STRIKE_TARGET_AND_SCOPE_MATCH",
      availabilityState: incidentAssessment.status === "SCOPE_VIOLATION_REVIEW_ELIGIBLE_STRUCTURE_ONLY"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    },
    {
      id: "CONTROLLED-ATTRIBUTION",
      controllerActorId: "INVESTIGATOR_OR_OPERATIONAL_ARCHIVE",
      evidenceKind: "RESPONSIBLE_ACTOR_ATTRIBUTION",
      availabilityState: chain.attributionStatus === "OBSERVED"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    },
    {
      id: "CONTROLLED-SECOND-DECISION",
      controllerActorId: "DECISION_ACTOR_OR_COMMAND_ARCHIVE",
      evidenceKind: "COUNTER_ORDER_OR_OUTSIDE_AUTHORITY_DECISION",
      availabilityState: secondDecisionLayerStatus === "SECOND_DECISION_LAYER_PACKET_READY_STRUCTURE_ONLY"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    },
    {
      id: "CONTROLLED-EXCEPTION-AND-INTENT",
      controllerActorId: "ORDER_ISSUER_INVESTIGATOR_OR_COMMAND_ARCHIVE",
      evidenceKind: "EXCEPTION_LATER_ORDER_KNOWLEDGE_OR_INTENT",
      availabilityState: chain.exceptionStatus === "EXCLUDED" && chain.knowledgeOrIntentStatus === "OBSERVED"
        ? "SOURCE_BOUND_IN_INPUT"
        : COVERAGE_UNKNOWN
    }
  ];
  return records.map((record) => ({
    ...record,
    reporterAccessEffect: "NONE_MISSING_ACCESS_DOES_NOT_CLOSE_REVIEW",
    productionDutyState: "UNBOUND_NO_AUTOMATIC_PRODUCTION_DUTY",
    nonProductionEffect: "NO_AUTOMATIC_ADVERSE_INFERENCE_FAULT_OR_CLAIM_REJECTION"
  }));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function computeSnapshotDigest(snapshot) {
  requireObject(snapshot, "snapshot");
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(snapshot)), "utf8")
    .digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const ALLOWED_OPERATORS = new Set([
  "PRESERVE_SNAPSHOT",
  "REGISTER_SEPARATE_EDGE",
  "REQUEST_REOPEN_REVIEW"
]);

const FORBIDDEN_OUTPUTS = new Set([
  "LIVE_CEASEFIRE",
  "AGREEMENT",
  "CONSENT",
  "COMPLIANCE",
  "VIOLATION",
  "ATTRIBUTION",
  "AUTHORIZATION",
  "SECOND_AUTHORITY",
  "HIDDEN_ACTOR",
  "FIELD_EFFECT",
  "RELEASE_APPROVED",
  "SCANDAL"
]);

function proposalReceipt(snapshot, proposal, disposition, reasonCodes, result) {
  return deepFreeze({
    schemaVersion: "decision-snapshot-evaluation.v1",
    proposalId: proposal.proposalId,
    baseSnapshotId: snapshot.snapshotId,
    baseSnapshotDigest: computeSnapshotDigest(snapshot),
    operator: proposal.operator,
    disposition,
    reasonCodes,
    result,
    snapshotDisposition: "PRESERVED",
    worldStateEffect: "NONE",
    evidenceTruth: "NOT_EVALUATED_BY_STRUCTURE",
    materialized: false
  });
}

export function evaluateSnapshotProposal({ snapshot, proposal }) {
  requireObject(snapshot, "snapshot");
  requireObject(proposal, "proposal");
  requireText(snapshot.snapshotId, "snapshot.snapshotId");
  requireText(snapshot.claimCeiling, "snapshot.claimCeiling");
  requireText(proposal.proposalId, "proposal.proposalId");
  requireText(proposal.baseSnapshotId, "proposal.baseSnapshotId");
  requireText(proposal.baseSnapshotDigest, "proposal.baseSnapshotDigest");
  requireText(proposal.operator, "proposal.operator");
  requireText(proposal.requestedOutput, "proposal.requestedOutput");

  const reasons = [];
  if (proposal.baseSnapshotId !== snapshot.snapshotId
      || proposal.baseSnapshotDigest !== computeSnapshotDigest(snapshot)) {
    reasons.push("STALE_BASE");
  }
  if (!ALLOWED_OPERATORS.has(proposal.operator)) reasons.push("UNKNOWN_OPERATOR");
  if (FORBIDDEN_OUTPUTS.has(proposal.requestedOutput)) {
    reasons.push("FORBIDDEN_SNAPSHOT_PROMOTION");
  }
  if (proposal.requestedClaimCeiling !== snapshot.claimCeiling) {
    reasons.push("CLAIM_CEILING_EXPANSION");
  }

  if (proposal.operator === "REGISTER_SEPARATE_EDGE") {
    const edge = proposal.edge;
    if (!edge || typeof edge !== "object") reasons.push("EDGE_REQUIRED");
    else {
      const edgeFields = ["observationId", "sourceId", "eventKind", "placeRef"];
      if (edgeFields.some((field) => typeof edge[field] !== "string" || edge[field].trim() === "")) {
        reasons.push("EDGE_FIELDS_MISSING");
      }
      if (snapshot.edgeObservations?.some((item) => item.id === edge.observationId)) {
        reasons.push("DUPLICATE_OBSERVATION_ID");
      }
      try {
        parseInstant(edge.reportedAt, "edge.reportedAt");
      } catch {
        reasons.push("TEMPORAL_BASIS_UNBOUND");
      }
      if (edge.eventKind === "REPORTED_AIR_THREAT_TRACK"
          && ["VIOLATION", "COMPLIANCE", "ATTRIBUTION"].includes(proposal.requestedOutput)) {
        reasons.push("EVENT_KIND_NOT_STRIKE_EFFECT");
      }
      if (edge.placeRef !== edge.assertedPlaceRef && edge.assertedPlaceRef) {
        reasons.push("PLACE_SCOPE_UNBOUND");
      }
    }
  }

  if (proposal.operator === "REQUEST_REOPEN_REVIEW") {
    const basis = proposal.reopenBasis;
    const validKinds = new Set(["NEW_SOURCE", "NEW_OBSERVATION", "NEW_DEFINITION", "NEW_DISCRIMINATOR"]);
    if (!basis || !validKinds.has(basis.kind) || !basis.basisId || !basis.description) {
      reasons.push("REOPEN_BASIS_UNBOUND");
    }
  }

  if (reasons.length > 0) {
    return proposalReceipt(snapshot, proposal, "BLOCKED", reasons, "SNAPSHOT_PRESERVED");
  }

  const result = proposal.operator === "PRESERVE_SNAPSHOT"
    ? "SNAPSHOT_PRESERVED"
    : proposal.operator === "REGISTER_SEPARATE_EDGE"
      ? "EDGE_RECORDED_UNRESOLVED"
      : "NEW_EVALUATION_BASIS_ACCEPTED";
  return proposalReceipt(snapshot, proposal, "ACCEPTED", [], result);
}

export function evaluateDecisionSnapshot(input) {
  requireObject(input, "input");
  if (input.mode === "COUNTERFACTUAL_NO_EVENT") {
    return {
      mode: input.mode,
      incidentReviewState: "NO_REPORT_IN_COUNTERFACTUAL",
      reportPreservationState: "NOT_APPLICABLE_COUNTERFACTUAL",
      incidentStatus: "NO_EVENT_IN_COUNTERFACTUAL",
      secondDecisionLayerStatus: "NO_SECOND_DECISION_IN_COUNTERFACTUAL",
      commandControlMeritsPacketReadiness: "NOT_APPLICABLE_COUNTERFACTUAL",
      controlledEvidenceLedger: [],
      scandalStatus: "SCANDAL_THRESHOLD_NOT_MET",
      publicClaimCeiling: "COUNTERFACTUAL_MODEL_ONLY"
    };
  }

  const incidentAssessment = assessIncident(input.order, input.incident);
  const secondDecisionLayerStatus = assessSecondDecisionLayer(input, incidentAssessment);
  const chain = input.commandChain ?? {};
  const meritsPacketReady = incidentAssessment.status === "SCOPE_VIOLATION_REVIEW_ELIGIBLE_STRUCTURE_ONLY"
    && input.order.operationalOrderStatus === "OBSERVED"
    && chain.orderReceiptStatus === "OBSERVED"
    && secondDecisionLayerStatus === "SECOND_DECISION_LAYER_PACKET_READY_STRUCTURE_ONLY"
    && chain.exceptionStatus === "EXCLUDED"
    && chain.attributionStatus === "OBSERVED"
    && chain.knowledgeOrIntentStatus === "OBSERVED";
  const evidenceControlLedger = controlledEvidenceLedger(input, incidentAssessment, secondDecisionLayerStatus);

  return {
    mode: "SOURCE_BOUND_REALITY",
    incidentReviewState: INCIDENT_REVIEW_OPEN,
    reportPreservationState: REPORT_PRESERVATION_STATE,
    incidentStatus: incidentAssessment.status,
    secondDecisionLayerStatus,
    commandControlMeritsPacketReadiness: meritsPacketReady
      ? COMMAND_CONTROL_PACKET_READY
      : COMMAND_CONTROL_PACKET_INCOMPLETE,
    controlledEvidenceLedger: evidenceControlLedger,
    scandalStatus: "SCANDAL_CLAIM_NOT_MATERIALIZED",
    publicClaimCeiling: meritsPacketReady
      ? "STRUCTURE_BOUND_MERITS_PACKET_READY_FOR_HUMAN_REVIEW_ONLY"
      : "FINITE_SNAPSHOT_WITH_OPEN_COMMAND_LINK",
    missingForMeritsAssessment: evidenceControlLedger
      .filter((record) => record.availabilityState === COVERAGE_UNKNOWN)
      .map((record) => ({
        evidenceId: record.id,
        controllerActorId: record.controllerActorId,
        evidenceKind: record.evidenceKind,
        availabilityState: record.availabilityState
      })),
    legacyFieldDeprecations: {
      reviewEligibility: "RENAMED_TO_COMMAND_CONTROL_MERITS_PACKET_READINESS",
      missingForEscalation: "RENAMED_TO_MISSING_FOR_MERITS_ASSESSMENT_WITH_CONTROLLER_AND_AVAILABILITY"
    },
    automaticClaimRejection: false,
    automaticFaultFinding: false,
    automaticAdverseInference: false
  };
}
