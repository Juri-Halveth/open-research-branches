import { createHash } from "node:crypto";

export const ROOM_CONTRACT_CANONICAL_BINDING = Object.freeze({
  canonicalizationVersion: "HALVETH_CANONICAL_JSON_V1",
  expectedSha256: "4b62318c168251ea483a66ff63faeac45f6e27a82dd6f9cfb9c11032197c1164"
});

export const ILLUSTRATIVE_USER_REFERENCE = Object.freeze({
  referenceId: "USER_IDEA_OMEGA_VIBER_100K_MONTH",
  amountCents: 10_000_000,
  currency: "EUR",
  cadence: "MONTH",
  classification: "ILLUSTRATIVE_USER_PROPOSAL_ONLY",
  createsEmploymentOffer: false,
  createsEntitlement: false,
  isCostEstimate: false,
  usedByCalculator: false
});

export const MINIMUM_QUALITY_PROFILE = Object.freeze({
  profileId: "MIN_PUBLIC_BUDGET_SIGNAL_V1",
  minSampleSize: 100,
  minResponseRateBps: 100,
  minCellSize: 10,
  maxMarginOfErrorBps: 1_000
});

const REPAIR_POLICY_KEYS = [
  "version",
  "currency",
  "targetScoreBps",
  "activationDeadbandBps",
  "releaseBandBps",
  "trendDeadbandBps",
  "baselineRepairBudgetCents",
  "minRepairBudgetCents",
  "maxRepairBudgetCents",
  "structuralCentsPerScorePoint",
  "trendCentsPerScorePoint",
  "maxIncreaseCentsPerPeriod",
  "maxDecreaseCentsPerPeriod",
  "requiredHealthyPeriods",
  "minSampleSize",
  "minResponseRateBps",
  "minCellSize",
  "maxMarginOfErrorBps",
  "allowedMethodVersions",
  "qualityProfileId",
  "measurementGovernance",
  "spendingEvidenceRequired",
  "qualityHoldEscalationPeriods"
];

const REPAIR_STATE_KEYS = [
  "policyVersion",
  "period",
  "repairBudgetCents",
  "lastValidScoreBps",
  "healthyStreak",
  "consecutiveQualityHolds"
];

const MEASUREMENT_KEYS = [
  "period",
  "populationSatisfactionIndexBps",
  "sampleSize",
  "eligiblePopulation",
  "smallestPublishedCellSize",
  "marginOfErrorBps",
  "methodVersion",
  "sourceReceiptId",
  "dataClass",
  "aggregationOnly",
  "containsDirectIdentifiers",
  "containsFreeText"
];

const COMPENSATION_POLICY_KEYS = [
  "version",
  "currency",
  "basis",
  "floorMonthlyCents",
  "satisfactionLink"
];

const COMPENSATION_STATE_KEYS = [
  "policyVersion",
  "currentBaseMonthlyCents"
];

const LISTENING_ROOM_KEYS = [
  "version",
  "unitType",
  "coverageWindow",
  "minimumListeningStaffOnDuty",
  "backupCoverageDefined",
  "lowStimulusProtocolVersion",
  "listeningRoleHasEnforcementPowers",
  "separateSafetyFunctionAvailable",
  "safetyEscalationProtocolVersion",
  "qualificationPathways"
];

const LISTENING_ALLOWED_POWERS = [
  "LISTEN",
  "EXPLAIN_PROCESS",
  "IDENTIFY_CANDIDATE_AUTHORITY",
  "ORGANIZE_ACCESSIBLE_COMMUNICATION",
  "ACCEPT_OR_ROUTE_WITHIN_LEGAL_MANDATE",
  "PROVIDE_HANDOFF_RECEIPT_ON_REQUEST",
  "FOLLOW_AUTHORIZED_HANDOFF"
];

const LISTENING_REQUIRED_PROHIBITIONS = [
  "SEARCH_PERSON",
  "COERCE_ENTRY",
  "SANCTION",
  "DIAGNOSE",
  "DECIDE_BENEFIT",
  "DECIDE_LEGAL_MERITS",
  "PROFILE_DANGER_FROM_IDENTITY"
];

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// HALVETH_CANONICAL_JSON_V1 sorts object keys by UTF-16 code unit, preserves
// array order, rejects non-JSON values and hashes the resulting UTF-8 bytes.
function canonicalJsonV1(value, ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new TypeError("canonical JSON values must be JSON-compatible");
  }
  if (ancestors.has(value)) throw new TypeError("canonical JSON values must be acyclic");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value).filter(key => key !== "length");
      const expectedKeys = Array.from({ length: value.length }, (_, index) => String(index));
      if (ownKeys.some(key => typeof key !== "string") ||
          ownKeys.length !== expectedKeys.length ||
          expectedKeys.some(key => !Object.hasOwn(value, key))) {
        throw new TypeError("canonical JSON arrays must be dense and contain no extra properties");
      }
      return `[${expectedKeys.map(key => canonicalJsonV1(value[key], ancestors)).join(",")}]`;
    }
    if (!isPlainObject(value)) throw new TypeError("canonical JSON objects must be plain objects");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some(key => typeof key !== "string")) {
      throw new TypeError("canonical JSON object keys must be strings");
    }
    const keys = ownKeys.sort();
    const members = keys.map(key => {
      const descriptor = descriptors[key];
      if (!descriptor?.enumerable || !("value" in descriptor)) {
        throw new TypeError("canonical JSON object properties must be enumerable data properties");
      }
      return `${JSON.stringify(key)}:${canonicalJsonV1(descriptor.value, ancestors)}`;
    });
    return `{${members.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function canonicalContractDigest(contract) {
  return createHash("sha256").update(canonicalJsonV1(contract), "utf8").digest("hex");
}

function addIssue(issues, code, path) {
  issues.push({ code, path });
}

function sortIssues(issues) {
  return issues.sort((left, right) => {
    const a = `${left.path}\0${left.code}`;
    const b = `${right.path}\0${right.code}`;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function exactObject(value, path, requiredKeys, issues) {
  if (!isPlainObject(value)) {
    addIssue(issues, "EXPECTED_PLAIN_OBJECT", path);
    return false;
  }
  const allowed = new Set(requiredKeys);
  const ownKeys = Reflect.ownKeys(value).sort((left, right) =>
    String(left).localeCompare(String(right), "en")
  );
  for (const key of ownKeys) {
    if (typeof key !== "string" || !allowed.has(key)) {
      addIssue(issues, "UNKNOWN_FIELD", `${path}.${String(key)}`);
    }
  }
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) addIssue(issues, "MISSING_FIELD", `${path}.${key}`);
  }
  return true;
}

function integerField(value, path, min, max, issues) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    addIssue(issues, "INVALID_SAFE_INTEGER", path);
  }
}

function nonEmptyString(value, path, issues) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 || value.length > 128) {
    addIssue(issues, "INVALID_STRING", path);
  }
}

function identifierField(value, path, issues) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    addIssue(issues, "INVALID_IDENTIFIER", path);
  }
}

function exactStringSet(value, expected, path, issues) {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string")) {
    addIssue(issues, "EXPECTED_STRING_ARRAY", path);
    return;
  }
  if (new Set(value).size !== value.length) {
    addIssue(issues, "DUPLICATE_ARRAY_VALUE", path);
  }
  const actualSorted = [...value].sort();
  const expectedSorted = [...expected].sort();
  if (actualSorted.length !== expectedSorted.length ||
      actualSorted.some((item, index) => item !== expectedSorted[index])) {
    addIssue(issues, "EXACT_CAPABILITY_SET_REQUIRED", path);
  }
}

function monthIndex(period) {
  const match = /^([1-9]\d{3})-(0[1-9]|1[0-2])$/.exec(period);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function ceilDiv(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

function minBig(...values) {
  return values.reduce((result, value) => value < result ? value : result);
}

function maxBig(...values) {
  return values.reduce((result, value) => value > result ? value : result);
}

function rejected(status, issues) {
  return {
    status,
    proposedAdjustmentDirection: "NONE",
    nextCandidateState: null,
    issues: sortIssues(issues)
  };
}

function validateRepairPolicy(policy) {
  const issues = [];
  if (!exactObject(policy, "policy", REPAIR_POLICY_KEYS, issues)) return issues;
  nonEmptyString(policy.version, "policy.version", issues);
  if (policy.currency !== "EUR") addIssue(issues, "CURRENCY_MUST_BE_EUR", "policy.currency");
  for (const key of [
    "targetScoreBps", "activationDeadbandBps", "releaseBandBps", "trendDeadbandBps"
  ]) integerField(policy[key], `policy.${key}`, 0, 10_000, issues);
  integerField(
    policy.minResponseRateBps,
    "policy.minResponseRateBps",
    MINIMUM_QUALITY_PROFILE.minResponseRateBps,
    10_000,
    issues
  );
  integerField(
    policy.maxMarginOfErrorBps,
    "policy.maxMarginOfErrorBps",
    0,
    MINIMUM_QUALITY_PROFILE.maxMarginOfErrorBps,
    issues
  );
  for (const key of [
    "baselineRepairBudgetCents", "minRepairBudgetCents", "maxRepairBudgetCents",
    "structuralCentsPerScorePoint", "trendCentsPerScorePoint",
    "maxIncreaseCentsPerPeriod", "maxDecreaseCentsPerPeriod"
  ]) integerField(policy[key], `policy.${key}`, 0, Number.MAX_SAFE_INTEGER, issues);
  integerField(
    policy.minSampleSize,
    "policy.minSampleSize",
    MINIMUM_QUALITY_PROFILE.minSampleSize,
    Number.MAX_SAFE_INTEGER,
    issues
  );
  integerField(
    policy.minCellSize,
    "policy.minCellSize",
    MINIMUM_QUALITY_PROFILE.minCellSize,
    Number.MAX_SAFE_INTEGER,
    issues
  );
  integerField(policy.requiredHealthyPeriods, "policy.requiredHealthyPeriods", 1, 120, issues);
  integerField(policy.qualityHoldEscalationPeriods, "policy.qualityHoldEscalationPeriods", 1, 12, issues);
  if (policy.qualityProfileId !== MINIMUM_QUALITY_PROFILE.profileId) {
    addIssue(issues, "QUALITY_PROFILE_MUST_BE_BOUND", "policy.qualityProfileId");
  }
  if (policy.measurementGovernance !== "INDEPENDENT_OR_EXTERNALLY_AUDITED") {
    addIssue(issues, "INDEPENDENT_MEASUREMENT_GOVERNANCE_REQUIRED", "policy.measurementGovernance");
  }
  if (policy.spendingEvidenceRequired !== true) {
    addIssue(issues, "SPENDING_EVIDENCE_REQUIRED", "policy.spendingEvidenceRequired");
  }
  if (Number.isSafeInteger(policy.targetScoreBps) &&
      Number.isSafeInteger(policy.releaseBandBps) &&
      policy.targetScoreBps + policy.releaseBandBps > 10_000) {
    addIssue(issues, "RELEASE_THRESHOLD_OUT_OF_RANGE", "policy.releaseBandBps");
  }
  if (Number.isSafeInteger(policy.minRepairBudgetCents) &&
      Number.isSafeInteger(policy.baselineRepairBudgetCents) &&
      Number.isSafeInteger(policy.maxRepairBudgetCents) &&
      !(policy.minRepairBudgetCents <= policy.baselineRepairBudgetCents &&
        policy.baselineRepairBudgetCents <= policy.maxRepairBudgetCents)) {
    addIssue(issues, "INVALID_BUDGET_ORDER", "policy.baselineRepairBudgetCents");
  }
  if (!Array.isArray(policy.allowedMethodVersions) ||
      policy.allowedMethodVersions.length === 0 ||
      policy.allowedMethodVersions.some(value => typeof value !== "string" || value.length === 0 || value.length > 128) ||
      new Set(policy.allowedMethodVersions).size !== policy.allowedMethodVersions.length) {
    addIssue(issues, "INVALID_METHOD_ALLOWLIST", "policy.allowedMethodVersions");
  }
  return issues;
}

function validateRepairState(state, policy) {
  const issues = [];
  if (!exactObject(state, "state", REPAIR_STATE_KEYS, issues)) return issues;
  nonEmptyString(state.policyVersion, "state.policyVersion", issues);
  if (state.policyVersion !== policy.version) addIssue(issues, "POLICY_VERSION_MISMATCH", "state.policyVersion");
  if (monthIndex(state.period) === null) addIssue(issues, "INVALID_PERIOD", "state.period");
  integerField(state.repairBudgetCents, "state.repairBudgetCents", policy.minRepairBudgetCents, policy.maxRepairBudgetCents, issues);
  if (state.lastValidScoreBps !== null) {
    integerField(state.lastValidScoreBps, "state.lastValidScoreBps", 0, 10_000, issues);
  }
  integerField(state.healthyStreak, "state.healthyStreak", 0, policy.requiredHealthyPeriods, issues);
  integerField(
    state.consecutiveQualityHolds,
    "state.consecutiveQualityHolds",
    0,
    policy.qualityHoldEscalationPeriods,
    issues
  );
  if (state.lastValidScoreBps === null && state.healthyStreak !== 0) {
    addIssue(issues, "STREAK_WITHOUT_VALID_SCORE", "state.healthyStreak");
  }
  return issues;
}

function validateMeasurement(measurement) {
  const issues = [];
  if (!exactObject(measurement, "measurement", MEASUREMENT_KEYS, issues)) return issues;
  if (monthIndex(measurement.period) === null) addIssue(issues, "INVALID_PERIOD", "measurement.period");
  integerField(measurement.populationSatisfactionIndexBps, "measurement.populationSatisfactionIndexBps", 0, 10_000, issues);
  integerField(measurement.sampleSize, "measurement.sampleSize", 1, Number.MAX_SAFE_INTEGER, issues);
  integerField(measurement.eligiblePopulation, "measurement.eligiblePopulation", 1, Number.MAX_SAFE_INTEGER, issues);
  integerField(measurement.smallestPublishedCellSize, "measurement.smallestPublishedCellSize", 1, Number.MAX_SAFE_INTEGER, issues);
  integerField(measurement.marginOfErrorBps, "measurement.marginOfErrorBps", 0, 10_000, issues);
  if (Number.isSafeInteger(measurement.sampleSize) && Number.isSafeInteger(measurement.eligiblePopulation) &&
      measurement.sampleSize > measurement.eligiblePopulation) addIssue(issues, "SAMPLE_EXCEEDS_POPULATION", "measurement.sampleSize");
  if (Number.isSafeInteger(measurement.smallestPublishedCellSize) && Number.isSafeInteger(measurement.sampleSize) &&
      measurement.smallestPublishedCellSize > measurement.sampleSize) addIssue(issues, "CELL_EXCEEDS_SAMPLE", "measurement.smallestPublishedCellSize");
  nonEmptyString(measurement.methodVersion, "measurement.methodVersion", issues);
  identifierField(measurement.sourceReceiptId, "measurement.sourceReceiptId", issues);
  for (const key of ["aggregationOnly", "containsDirectIdentifiers", "containsFreeText"]) {
    if (typeof measurement[key] !== "boolean") addIssue(issues, "EXPECTED_BOOLEAN", `measurement.${key}`);
  }
  return issues;
}

export function calculateNextRepairState(input) {
  const envelopeIssues = [];
  if (!exactObject(input, "input", ["policy", "state", "measurement"], envelopeIssues) || envelopeIssues.length > 0) {
    return rejected("REJECTED_INPUT", envelopeIssues);
  }
  const policyIssues = validateRepairPolicy(input.policy);
  if (policyIssues.length > 0) return rejected("REJECTED_POLICY", policyIssues);
  const issues = [...validateRepairState(input.state, input.policy), ...validateMeasurement(input.measurement)];
  if (issues.length > 0) return rejected("REJECTED_INPUT", issues);
  const { policy, state, measurement } = input;
  if (monthIndex(measurement.period) !== monthIndex(state.period) + 1) {
    return rejected("REJECTED_PERIOD_SEQUENCE", [{ code: "PERIOD_MUST_BE_NEXT_MONTH", path: "measurement.period" }]);
  }

  const privacyIssues = [];
  if (measurement.dataClass !== "EXTERNAL_MINIMIZED") addIssue(privacyIssues, "DATA_NOT_MINIMIZED", "measurement.dataClass");
  if (!measurement.aggregationOnly) addIssue(privacyIssues, "AGGREGATION_REQUIRED", "measurement.aggregationOnly");
  if (measurement.containsDirectIdentifiers) addIssue(privacyIssues, "DIRECT_IDENTIFIERS_PROHIBITED", "measurement.containsDirectIdentifiers");
  if (measurement.containsFreeText) addIssue(privacyIssues, "RAW_FREE_TEXT_PROHIBITED", "measurement.containsFreeText");
  if (privacyIssues.length > 0) return rejected("REJECTED_PRIVACY", privacyIssues);

  const responseRateBps = Number((BigInt(measurement.sampleSize) * 10_000n) / BigInt(measurement.eligiblePopulation));
  const qualityReasons = [];
  if (measurement.sampleSize < policy.minSampleSize) qualityReasons.push("SAMPLE_BELOW_MINIMUM");
  if (responseRateBps < policy.minResponseRateBps) qualityReasons.push("RESPONSE_RATE_BELOW_MINIMUM");
  if (measurement.smallestPublishedCellSize < policy.minCellSize) qualityReasons.push("PUBLISHED_CELL_BELOW_PRIVACY_MINIMUM");
  if (measurement.marginOfErrorBps > policy.maxMarginOfErrorBps) qualityReasons.push("MARGIN_OF_ERROR_TOO_HIGH");
  if (!policy.allowedMethodVersions.includes(measurement.methodVersion)) qualityReasons.push("METHOD_VERSION_NOT_ALLOWED");
  qualityReasons.sort();
  if (qualityReasons.length > 0) {
    const consecutiveQualityHolds = Math.min(
      policy.qualityHoldEscalationPeriods,
      state.consecutiveQualityHolds + 1
    );
    return {
      status: "HELD_QUALITY_GUARD",
      proposedAdjustmentDirection: "NONE",
      responseRateBps,
      reasonCodes: qualityReasons,
      oversightEscalationRequired:
        consecutiveQualityHolds >= policy.qualityHoldEscalationPeriods,
      nextCandidateState: {
        ...state,
        period: measurement.period,
        healthyStreak: 0,
        consecutiveQualityHolds
      }
    };
  }

  const score = measurement.populationSatisfactionIndexBps;
  const structuralDeficitBps = Math.max(0, policy.targetScoreBps - score - policy.activationDeadbandBps);
  const dropSinceLastValidBps = state.lastValidScoreBps === null
    ? 0
    : Math.max(0, state.lastValidScoreBps - score - policy.trendDeadbandBps);
  const structuralLift = ceilDiv(BigInt(structuralDeficitBps) * BigInt(policy.structuralCentsPerScorePoint), 100n);
  const trendLift = ceilDiv(BigInt(dropSinceLastValidBps) * BigInt(policy.trendCentsPerScorePoint), 100n);
  const rawTarget = maxBig(
    BigInt(policy.minRepairBudgetCents),
    minBig(BigInt(policy.maxRepairBudgetCents), BigInt(policy.baselineRepairBudgetCents) + structuralLift + trendLift)
  );
  const previousBudget = BigInt(state.repairBudgetCents);
  const healthyNow = score >= policy.targetScoreBps + policy.releaseBandBps;
  const healthyStreak = healthyNow ? Math.min(policy.requiredHealthyPeriods, state.healthyStreak + 1) : 0;
  let nextBudget = previousBudget;
  let releaseGuardHeld = false;
  if (rawTarget > previousBudget) {
    nextBudget = minBig(rawTarget, previousBudget + BigInt(policy.maxIncreaseCentsPerPeriod));
  } else if (rawTarget < previousBudget) {
    if (healthyNow && healthyStreak >= policy.requiredHealthyPeriods) {
      nextBudget = maxBig(rawTarget, BigInt(policy.minRepairBudgetCents), previousBudget - BigInt(policy.maxDecreaseCentsPerPeriod));
    } else {
      releaseGuardHeld = true;
    }
  }
  const proposedAdjustmentDirection = nextBudget > previousBudget
    ? "INCREASE"
    : nextBudget < previousBudget
      ? "DECREASE"
      : "NONE";
  return {
    status: releaseGuardHeld
      ? "HELD_RELEASE_GUARD"
      : proposedAdjustmentDirection === "NONE"
        ? "UNCHANGED_CANDIDATE"
        : "CALCULATED_CANDIDATE",
    proposedAdjustmentDirection,
    responseRateBps,
    formulaVersion: "countercyclical-repair-v1",
    calculation: {
      structuralDeficitBps,
      dropSinceLastValidBps,
      rawTargetBudgetCents: Number(rawTarget),
      adjustmentCapApplied: nextBudget !== rawTarget
    },
    nextCandidateState: {
      policyVersion: policy.version,
      period: measurement.period,
      repairBudgetCents: Number(nextBudget),
      lastValidScoreBps: score,
      healthyStreak,
      consecutiveQualityHolds: 0
    }
  };
}

export function evaluateCompensation(input) {
  const issues = [];
  if (!exactObject(input, "input", ["policy", "state"], issues)) return rejected("REJECTED_INPUT", issues);
  if (!exactObject(input.policy, "policy", COMPENSATION_POLICY_KEYS, issues) ||
      !exactObject(input.state, "state", COMPENSATION_STATE_KEYS, issues)) return rejected("REJECTED_INPUT", issues);
  nonEmptyString(input.policy.version, "policy.version", issues);
  if (input.policy.currency !== "EUR") addIssue(issues, "CURRENCY_MUST_BE_EUR", "policy.currency");
  if (input.policy.basis !== "ROLE_MONTHLY_GROSS_FTE") addIssue(issues, "INVALID_COMPENSATION_BASIS", "policy.basis");
  if (input.policy.satisfactionLink !== "PROHIBITED") addIssue(issues, "SATISFACTION_LINK_MUST_BE_PROHIBITED", "policy.satisfactionLink");
  integerField(input.policy.floorMonthlyCents, "policy.floorMonthlyCents", 0, Number.MAX_SAFE_INTEGER, issues);
  integerField(input.state.currentBaseMonthlyCents, "state.currentBaseMonthlyCents", 0, Number.MAX_SAFE_INTEGER, issues);
  if (input.state.policyVersion !== input.policy.version) addIssue(issues, "POLICY_VERSION_MISMATCH", "state.policyVersion");
  if (issues.length > 0) return rejected("REJECTED_INPUT", issues);
  if (input.state.currentBaseMonthlyCents < input.policy.floorMonthlyCents) {
    return rejected("REJECTED_COMPENSATION_FLOOR", [{ code: "BASE_COMPENSATION_BELOW_FLOOR", path: "state.currentBaseMonthlyCents" }]);
  }
  return {
    status: "UNCHANGED_BY_SATISFACTION_MODEL",
    proposedAdjustmentDirection: "NONE",
    monthlyBaseCents: input.state.currentBaseMonthlyCents,
    floorMonthlyCents: input.policy.floorMonthlyCents,
    reasonCode: "POPULATION_SATISFACTION_IS_NOT_A_PAY_INPUT"
  };
}

export function validateListeningRoomDesign(design) {
  const issues = [];
  if (!exactObject(design, "design", LISTENING_ROOM_KEYS, issues)) {
    return { status: "REJECTED", structureBound: false, issues: sortIssues(issues) };
  }
  nonEmptyString(design.version, "design.version", issues);
  if (design.unitType !== "AUTHORITY_ENTRY_LISTENING_ROOM") addIssue(issues, "INVALID_UNIT_TYPE", "design.unitType");
  if (design.coverageWindow !== "PUBLIC_OPENING_HOURS" && design.coverageWindow !== "24_7") {
    addIssue(issues, "INVALID_COVERAGE_WINDOW", "design.coverageWindow");
  }
  integerField(design.minimumListeningStaffOnDuty, "design.minimumListeningStaffOnDuty", 1, 100, issues);
  if (design.backupCoverageDefined !== true) addIssue(issues, "BACKUP_COVERAGE_REQUIRED", "design.backupCoverageDefined");
  if (design.listeningRoleHasEnforcementPowers !== false) {
    addIssue(issues, "LISTENING_AND_ENFORCEMENT_ROLES_MUST_BE_SEPARATE", "design.listeningRoleHasEnforcementPowers");
  }
  if (design.separateSafetyFunctionAvailable !== true) {
    addIssue(issues, "SEPARATE_SAFETY_FUNCTION_REQUIRED", "design.separateSafetyFunctionAvailable");
  }
  nonEmptyString(design.lowStimulusProtocolVersion, "design.lowStimulusProtocolVersion", issues);
  nonEmptyString(design.safetyEscalationProtocolVersion, "design.safetyEscalationProtocolVersion", issues);
  if (!Array.isArray(design.qualificationPathways) ||
      !design.qualificationPathways.includes("EQUIVALENT_EXPERIENCE") ||
      design.qualificationPathways.some(value => typeof value !== "string" || value.length === 0)) {
    addIssue(issues, "EXPERIENCE_BASED_PATHWAY_REQUIRED", "design.qualificationPathways");
  }
  return {
    status: issues.length === 0 ? "STRUCTURE_BOUND" : "REJECTED",
    structureBound: issues.length === 0,
    issues: sortIssues(issues)
  };
}

export function validatePublishedRoomContract(contract) {
  const issues = [];
  let actualContractDigest = null;
  try {
    actualContractDigest = canonicalContractDigest(contract);
  } catch {
    addIssue(issues, "CANONICAL_CONTRACT_SERIALIZATION_FAILED", "contract");
  }
  const canonicalContractBound =
    actualContractDigest === ROOM_CONTRACT_CANONICAL_BINDING.expectedSha256;
  if (!canonicalContractBound) {
    addIssue(issues, "CANONICAL_CONTRACT_DIGEST_MISMATCH", "contract");
  }
  const finish = (baseResult = {}, criticalStructureBound = false) => {
    const combinedIssues = sortIssues([...issues, ...(baseResult.issues ?? [])]);
    const structureBound =
      combinedIssues.length === 0 && criticalStructureBound && canonicalContractBound;
    return {
      ...baseResult,
      status: structureBound ? "STRUCTURE_BOUND" : "REJECTED",
      structureBound,
      issues: combinedIssues,
      canonicalContractBound,
      canonicalizationVersion: ROOM_CONTRACT_CANONICAL_BINDING.canonicalizationVersion,
      expectedContractDigest: ROOM_CONTRACT_CANONICAL_BINDING.expectedSha256,
      actualContractDigest,
      contractId: isPlainObject(contract) && typeof contract.contractId === "string"
        ? contract.contractId
        : null
    };
  };
  if (!isPlainObject(contract)) {
    addIssue(issues, "EXPECTED_PLAIN_OBJECT", "contract");
    return finish();
  }
  if (!isPlainObject(contract.unit)) {
    addIssue(issues, "EXPECTED_PLAIN_OBJECT", "contract.unit");
  }
  if (!Array.isArray(contract.roles)) {
    addIssue(issues, "EXPECTED_ARRAY", "contract.roles");
  }
  if (issues.length > 0) {
    return finish();
  }

  const listeningRoles = contract.roles.filter(
    role => isPlainObject(role) && role.roleId === "LISTENING_STEWARD"
  );
  const safetyRoles = contract.roles.filter(
    role => isPlainObject(role) && role.roleId === "SAFETY_FUNCTION"
  );
  if (listeningRoles.length !== 1) {
    addIssue(issues, "EXACTLY_ONE_LISTENING_ROLE_REQUIRED", "contract.roles");
  }
  if (safetyRoles.length !== 1) {
    addIssue(issues, "EXACTLY_ONE_SAFETY_ROLE_REQUIRED", "contract.roles");
  }
  if (issues.length > 0) {
    return finish();
  }

  const listeningRole = listeningRoles[0];
  const safetyRole = safetyRoles[0];
  exactStringSet(
    listeningRole.powers,
    LISTENING_ALLOWED_POWERS,
    "contract.roles.LISTENING_STEWARD.powers",
    issues
  );
  exactStringSet(
    listeningRole.prohibitedPowers,
    LISTENING_REQUIRED_PROHIBITIONS,
    "contract.roles.LISTENING_STEWARD.prohibitedPowers",
    issues
  );
  if (safetyRole.mayDecideComplaintMerits !== false) {
    addIssue(
      issues,
      "SAFETY_MUST_NOT_DECIDE_COMPLAINT_MERITS",
      "contract.roles.SAFETY_FUNCTION.mayDecideComplaintMerits"
    );
  }
  const result = validateListeningRoomDesign({
    version: contract.schemaVersion,
    unitType: contract.unit.type,
    coverageWindow: contract.unit.coverageWindow,
    minimumListeningStaffOnDuty: listeningRole.minimumOnDuty,
    backupCoverageDefined: listeningRole.backupRequired,
    lowStimulusProtocolVersion: contract.unit.lowStimulusProtocolVersion,
    listeningRoleHasEnforcementPowers: listeningRole.hasEnforcementPowers,
    separateSafetyFunctionAvailable:
      safetyRole.availability === "REACHABLE_DURING_PUBLIC_OPENING_HOURS",
    safetyEscalationProtocolVersion: safetyRole.protocolVersion,
    qualificationPathways: listeningRole.qualificationPathways
  });
  return finish(result, result.structureBound);
}
