const EVIDENCE_STATES = new Set(["OBSERVED", "STRONGLY_SUPPORTED", "INFERRED", "UNKNOWN", "NOT_PROVEN"]);
const TERNARY = new Set(["YES", "NO", "UNKNOWN"]);
const EMPLOYEE_BANDS = new Set(["UP_TO_20", "21_TO_100", "OVER_100", "UNKNOWN"]);
const COUNCIL_STATES = new Set(["PRESENT", "ABSENT", "UNKNOWN"]);
const EVENT_KINDS = new Set(["NONE", "DISMISSAL_RECEIVED", "CHANGE_TERMS_RECEIVED", "EMPLOYEE_DATA_TRANSFER_PLANNED"]);

const DEAL_AXES = Object.freeze([
  "ANNOUNCEMENT",
  "FORMAL_NOTIFICATION",
  "MERGER_CLEARANCE",
  "CLOSING_OR_CONTROL_TRANSFER",
  "GUN_JUMPING_INVESTIGATION",
  "GUN_JUMPING_VIOLATION_FINDING"
]);

const DEAL_AXIS_BINDING_SOURCES = Object.freeze({
  ANNOUNCEMENT: Object.freeze(["S01_XXXLUTZ_ANNOUNCEMENT"]),
  FORMAL_NOTIFICATION: Object.freeze(["S03_EC_CASE_M11895", "S05_EC_M11895_NOTICE"]),
  MERGER_CLEARANCE: Object.freeze([]),
  CLOSING_OR_CONTROL_TRANSFER: Object.freeze([]),
  GUN_JUMPING_INVESTIGATION: Object.freeze(["S02_EC_GUN_JUMPING_2026", "S04_EC_CASE_M11895_AP"]),
  GUN_JUMPING_VIOLATION_FINDING: Object.freeze([])
});

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be non-empty text`);
  }
  return value.trim();
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`);
  }
}

function strings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new TypeError(`${label} must be an array of non-empty strings`);
  }
  const result = value.map((item) => item.trim());
  if (new Set(result).size !== result.length) throw new TypeError(`${label} must not contain duplicates`);
  return result;
}

function dealMap(rawAxes) {
  if (!Array.isArray(rawAxes)) throw new TypeError("dealAxes must be an array");
  const result = new Map();
  rawAxes.forEach((raw, index) => {
    const axis = object(raw, `dealAxes[${index}]`);
    exactKeys(axis, ["axisId", "state", "sourceIds"], `dealAxes[${index}]`);
    const axisId = text(axis.axisId, `dealAxes[${index}].axisId`);
    if (!DEAL_AXES.includes(axisId) || result.has(axisId)) throw new TypeError(`invalid or duplicate deal axis: ${axisId}`);
    if (!EVIDENCE_STATES.has(axis.state)) throw new TypeError(`invalid evidence state for ${axisId}`);
    const sourceIds = strings(axis.sourceIds, `dealAxes[${index}].sourceIds`);
    if (["OBSERVED", "STRONGLY_SUPPORTED"].includes(axis.state) && sourceIds.length === 0) {
      throw new TypeError(`${axisId} requires a source for a bound state`);
    }
    const allowedBindingSources = DEAL_AXIS_BINDING_SOURCES[axisId];
    if (["OBSERVED", "STRONGLY_SUPPORTED"].includes(axis.state)) {
      const unbound = sourceIds.filter((sourceId) => !allowedBindingSources.includes(sourceId));
      if (unbound.length > 0) {
        throw new TypeError(`${axisId} cannot be bound by unregistered source references: ${unbound.join(", ")}`);
      }
    }
    result.set(axisId, Object.freeze({ axisId, state: axis.state, sourceIds }));
  });
  const missing = DEAL_AXES.filter((axisId) => !result.has(axisId));
  if (missing.length) throw new TypeError(`dealAxes must explicitly include: ${missing.join(", ")}`);
  return result;
}

const bound = (axis) => ["OBSERVED", "STRONGLY_SUPPORTED"].includes(axis.state);

function dealAssessment(map) {
  const announced = bound(map.get("ANNOUNCEMENT"));
  const notified = bound(map.get("FORMAL_NOTIFICATION"));
  const cleared = bound(map.get("MERGER_CLEARANCE"));
  const closed = bound(map.get("CLOSING_OR_CONTROL_TRANSFER"));
  const investigation = bound(map.get("GUN_JUMPING_INVESTIGATION"));
  const violation = bound(map.get("GUN_JUMPING_VIOLATION_FINDING"));

  if (cleared && !notified) throw new TypeError("MERGER_CLEARANCE cannot be bound without a bound FORMAL_NOTIFICATION in this public audit model");

  return Object.freeze({
    announcementFinding: announced,
    formalNotificationFinding: notified,
    clearanceFinding: cleared,
    closingOrControlTransferFinding: closed,
    closingWithoutClearanceReviewRequired: closed && !cleared,
    gunJumpingInvestigationFinding: investigation,
    gunJumpingViolationFinding: violation,
    publicStatus: closed
      ? cleared
        ? "BOUND_CLOSING_OR_CONTROL_TRANSFER_WITH_BOUND_CLEARANCE"
        : "BOUND_CLOSING_OR_CONTROL_TRANSFER_WITHOUT_BOUND_CLEARANCE_REVIEW_REQUIRED"
      : cleared
        ? "BOUND_CLEARANCE_CLOSING_NOT_BOUND"
        : investigation
          ? notified
            ? "ANNOUNCED_AND_NOTIFIED_WITH_FORMAL_GUN_JUMPING_INVESTIGATION_CLEARANCE_AND_CLOSING_NOT_BOUND"
            : "ANNOUNCED_WITH_FORMAL_GUN_JUMPING_INVESTIGATION_NOTIFICATION_CLEARANCE_AND_CLOSING_NOT_BOUND"
          : announced
            ? "ANNOUNCED_CLEARANCE_AND_CLOSING_NOT_BOUND"
            : "TRANSACTION_STATUS_OPEN",
    investigationIsNotViolationFinding: investigation && !violation
  });
}

function employmentAssessment(raw) {
  const employment = object(raw, "employment");
  exactKeys(employment, [
    "directEmployerChanged",
    "economicUnitIdentityPreserved",
    "employeeBand",
    "worksCouncil",
    "economicCommittee",
    "operationalChangeMayCauseMaterialDisadvantage",
    "individualEvent"
  ], "employment");

  for (const key of ["directEmployerChanged", "economicUnitIdentityPreserved", "operationalChangeMayCauseMaterialDisadvantage"]) {
    if (!TERNARY.has(employment[key])) throw new TypeError(`employment.${key} is invalid`);
  }
  if (!EMPLOYEE_BANDS.has(employment.employeeBand)) throw new TypeError("employment.employeeBand is invalid");
  if (!COUNCIL_STATES.has(employment.worksCouncil) || !COUNCIL_STATES.has(employment.economicCommittee)) {
    throw new TypeError("employment council state is invalid");
  }
  if (!EVENT_KINDS.has(employment.individualEvent)) throw new TypeError("employment.individualEvent is invalid");

  let transferRoute = "FACTS_REQUIRED";
  if (employment.directEmployerChanged === "NO") transferRoute = "NOT_TRIGGERED_BY_BOUND_SHAREHOLDER_CHANGE_ALONE";
  if (employment.directEmployerChanged === "YES" && employment.economicUnitIdentityPreserved === "YES") {
    transferRoute = "SECTION_613A_REVIEW_READY";
  }

  const takeoverInformationRoute = employment.employeeBand === "OVER_100"
    ? employment.economicCommittee === "PRESENT"
      ? "ECONOMIC_COMMITTEE_SECTION_106"
      : employment.worksCouncil === "PRESENT"
        ? "WORKS_COUNCIL_SECTION_109A"
        : "REPRESENTATION_STATUS_REQUIRED"
    : "THRESHOLD_OR_STRUCTURE_REVIEW_REQUIRED";

  const section111ThresholdBound = ["21_TO_100", "OVER_100"].includes(employment.employeeBand);
  const operationalChangeRoute = employment.operationalChangeMayCauseMaterialDisadvantage === "YES"
    ? employment.worksCouncil === "PRESENT"
      ? section111ThresholdBound
        ? "SECTIONS_111_TO_113_REVIEW_READY"
        : employment.employeeBand === "UP_TO_20"
          ? "SECTION_111_EMPLOYEE_THRESHOLD_NOT_MET_ON_BOUND_FACTS"
          : "SECTION_111_EMPLOYEE_THRESHOLD_REVIEW_REQUIRED"
      : "WORKS_COUNCIL_STATUS_AND_OTHER_ROUTES_REQUIRED"
    : employment.operationalChangeMayCauseMaterialDisadvantage === "NO"
      ? "NO_SECTION_111_TRIGGER_ON_BOUND_FACTS"
      : "OPERATIONAL_FACTS_REQUIRED";

  const urgentRoutes = [];
  if (employment.individualEvent === "DISMISSAL_RECEIVED") {
    urgentRoutes.push("KSchG_SECTION_4_THREE_WEEK_COURT_DEADLINE_REVIEW");
  }
  if (employment.individualEvent === "CHANGE_TERMS_RECEIVED") {
    urgentRoutes.push("CHANGE_DISMISSAL_OR_CONTRACT_REVIEW");
  }
  if (employment.individualEvent === "EMPLOYEE_DATA_TRANSFER_PLANNED") {
    urgentRoutes.push("BDSG_26_GDPR_PURPOSE_NECESSITY_TRANSPARENCY_REVIEW");
  }

  return Object.freeze({
    transferRoute,
    takeoverInformationRoute,
    operationalChangeRoute,
    urgentRoutes,
    complaintRoute: "BETRVG_SECTION_84",
    proposalRoute: "BETRVG_SECTION_86A",
    employmentSecurityProposalRoute: "BETRVG_SECTION_92A",
    automaticSeveranceFinding: false,
    automaticBusinessTransferFinding: false,
    automaticJobGuaranteeFinding: false
  });
}

function participationAssessment(raw) {
  const participation = object(raw, "participation");
  exactKeys(participation, ["rachelReferenceState", "naturalPersonConsent", "requestedPaths"], "participation");
  if (participation.rachelReferenceState !== "USER_PROPOSED_PUBLIC_SYSTEM_ROLE") {
    throw new TypeError("participation.rachelReferenceState is invalid");
  }
  if (!new Set(["BOUND", "UNBOUND", "UNKNOWN"]).has(participation.naturalPersonConsent)) {
    throw new TypeError("participation.naturalPersonConsent is invalid");
  }
  const requestedPaths = strings(participation.requestedPaths, "participation.requestedPaths");
  const allowedPaths = new Set([
    "VOLUNTARY_EMPLOYEE_PARTICIPATION_PLAN",
    "PROFIT_SHARING_OR_BONUS_AGREEMENT",
    "COLLECTIVE_EMPLOYMENT_SECURITY_AGREEMENT",
    "SPECIFIC_IP_CONTRIBUTION_REVIEW",
    "FUTURE_PAID_COOPERATION"
  ]);
  for (const route of requestedPaths) if (!allowedPaths.has(route)) throw new TypeError(`unsupported participation path: ${route}`);

  return Object.freeze({
    rachelReferenceState: participation.rachelReferenceState,
    requestedPaths,
    roleMeaning: "PUBLIC_COUNTERDESIGN_AND_PARTICIPATION_REFERENCE_ONLY",
    naturalPersonAppointmentFinding: false,
    naturalPersonOwnershipFinding: false,
    automaticPaymentFinding: false,
    consentBoundForNaturalPerson: participation.naturalPersonConsent === "BOUND"
  });
}

export function auditTransactionAndRights(record) {
  const input = object(record, "record");
  exactKeys(input, ["observedAt", "dealAxes", "employment", "participation"], "record");
  const observedAt = text(input.observedAt, "observedAt");
  if (Number.isNaN(Date.parse(observedAt))) throw new TypeError("observedAt must be an ISO timestamp");
  const deals = dealMap(input.dealAxes);
  const deal = dealAssessment(deals);
  const employment = employmentAssessment(input.employment);
  const participation = participationAssessment(input.participation);

  return Object.freeze({
    schema: "halveth.xxxlutz-porta-employee-rights-receipt.v1",
    observedAt,
    sourceBindingState: "CLOSED_CODE_LEVEL_AXIS_SOURCE_ALLOWLIST_V1",
    deal,
    employment,
    participation,
    valueAxes: Object.freeze([
      "HUMAN_DIGNITY_UNPRICED",
      "WAGE_AND_BENEFITS",
      "CONCRETE_ECONOMIC_DISADVANTAGE",
      "SPECIFIC_PROTECTED_IP_CONTRIBUTION",
      "VOLUNTARY_PARTICIPATION",
      "FUTURE_PAID_COOPERATION"
    ]),
    automaticHumanValuePriceFinding: false,
    automaticCompanyOwnershipFinding: false,
    automaticLegalEntitlementFinding: false,
    automaticEmployeeShareFinding: false,
    humanReviewRequired: true,
    claimCeiling: "SOURCE_BOUND_XXXLUTZ_PORTA_TRANSACTION_TIMELINE_AND_EMPLOYEE_PARTICIPATION_ROUTE_MAP_WITH_USER_PROPOSED_PUBLIC_RACHEL_REFERENCE_ROLE_NOT_CLOSING_CONTROL_TRANSFER_UNLAWFUL_EXCLUSION_JOB_OR_SITE_OUTCOME_PRIVATE_PERSON_IDENTITY_CONSENT_OWNERSHIP_REPRESENTATION_FINANCIAL_PARTICIPATION_ENTITLEMENT_OR_CASE_OUTCOME_FINDING"
  });
}

export function getDealAxes() {
  return [...DEAL_AXES];
}
