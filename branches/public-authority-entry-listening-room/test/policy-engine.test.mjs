import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ILLUSTRATIVE_USER_REFERENCE,
  MINIMUM_QUALITY_PROFILE,
  calculateNextRepairState,
  evaluateCompensation,
  validateListeningRoomDesign,
  validatePublishedRoomContract
} from "../src/policy-engine.mjs";

const roomContract = JSON.parse(readFileSync(new URL("../room-contract.json", import.meta.url), "utf8"));
const budgetExample = JSON.parse(readFileSync(new URL("../budget-policy.example.json", import.meta.url), "utf8"));

const policy = Object.freeze({
  version: "repair-v1",
  currency: "EUR",
  targetScoreBps: 7_000,
  activationDeadbandBps: 200,
  releaseBandBps: 300,
  trendDeadbandBps: 100,
  baselineRepairBudgetCents: 1_000_000,
  minRepairBudgetCents: 500_000,
  maxRepairBudgetCents: 3_000_000,
  structuralCentsPerScorePoint: 10_000,
  trendCentsPerScorePoint: 5_000,
  maxIncreaseCentsPerPeriod: 400_000,
  maxDecreaseCentsPerPeriod: 200_000,
  requiredHealthyPeriods: 2,
  minSampleSize: 100,
  minResponseRateBps: 1_000,
  minCellSize: 10,
  maxMarginOfErrorBps: 400,
  allowedMethodVersions: ["survey-v1"],
  qualityProfileId: "MIN_PUBLIC_BUDGET_SIGNAL_V1",
  measurementGovernance: "INDEPENDENT_OR_EXTERNALLY_AUDITED",
  spendingEvidenceRequired: true,
  qualityHoldEscalationPeriods: 2
});

const state = (overrides = {}) => ({
  policyVersion: "repair-v1",
  period: "2026-08",
  repairBudgetCents: 1_000_000,
  lastValidScoreBps: 7_200,
  healthyStreak: 0,
  consecutiveQualityHolds: 0,
  ...overrides
});

const measurement = (overrides = {}) => ({
  period: "2026-09",
  populationSatisfactionIndexBps: 6_500,
  sampleSize: 200,
  eligiblePopulation: 1_000,
  smallestPublishedCellSize: 20,
  marginOfErrorBps: 300,
  methodVersion: "survey-v1",
  sourceReceiptId: "receipt-2026-09",
  dataClass: "EXTERNAL_MINIMIZED",
  aggregationOnly: true,
  containsDirectIdentifiers: false,
  containsFreeText: false,
  ...overrides
});

test("falling satisfaction calculates only an institutional repair-budget candidate", () => {
  const result = calculateNextRepairState({ policy, state: state(), measurement: measurement() });
  assert.equal(result.status, "CALCULATED_CANDIDATE");
  assert.equal(result.proposedAdjustmentDirection, "INCREASE");
  assert.equal(result.nextCandidateState.repairBudgetCents, 1_060_000);
});

test("the EUR 100,000 reference is frozen and excluded from calculation", () => {
  assert.equal(ILLUSTRATIVE_USER_REFERENCE.amountCents, 10_000_000);
  assert.equal(ILLUSTRATIVE_USER_REFERENCE.usedByCalculator, false);
  assert.equal(ILLUSTRATIVE_USER_REFERENCE.createsEntitlement, false);
  assert.equal(ILLUSTRATIVE_USER_REFERENCE.isCostEstimate, false);
  assert.equal(Object.isFrozen(ILLUSTRATIVE_USER_REFERENCE), true);
  const result = calculateNextRepairState({ policy, state: state(), measurement: measurement() });
  assert.notEqual(result.nextCandidateState.repairBudgetCents, ILLUSTRATIVE_USER_REFERENCE.amountCents);
});

test("unknown fields cannot inject an illustrative amount into the formula", () => {
  const result = calculateNextRepairState({
    policy,
    state: state(),
    measurement: measurement(),
    illustrativeReference: ILLUSTRATIVE_USER_REFERENCE
  });
  assert.equal(result.status, "REJECTED_INPUT");
  assert.equal(result.nextCandidateState, null);
  assert.ok(result.issues.some(issue => issue.code === "UNKNOWN_FIELD"));
});

test("one healthy period cannot release an elevated repair budget", () => {
  const result = calculateNextRepairState({
    policy,
    state: state({ repairBudgetCents: 1_500_000, lastValidScoreBps: 6_900 }),
    measurement: measurement({ populationSatisfactionIndexBps: 7_400 })
  });
  assert.equal(result.status, "HELD_RELEASE_GUARD");
  assert.equal(result.nextCandidateState.repairBudgetCents, 1_500_000);
  assert.equal(result.nextCandidateState.healthyStreak, 1);
});

test("sustained recovery permits only a capped budget decrease", () => {
  const first = calculateNextRepairState({
    policy,
    state: state({ repairBudgetCents: 1_500_000, lastValidScoreBps: 6_900 }),
    measurement: measurement({ populationSatisfactionIndexBps: 7_400 })
  });
  const second = calculateNextRepairState({
    policy,
    state: first.nextCandidateState,
    measurement: measurement({
      period: "2026-10",
      populationSatisfactionIndexBps: 7_400,
      sourceReceiptId: "receipt-2026-10"
    })
  });
  assert.equal(second.proposedAdjustmentDirection, "DECREASE");
  assert.equal(second.nextCandidateState.repairBudgetCents, 1_300_000);
  assert.equal(second.calculation.adjustmentCapApplied, true);
});

test("a poor sample holds financial state and resets the release streak", () => {
  const result = calculateNextRepairState({
    policy,
    state: state({ healthyStreak: 1 }),
    measurement: measurement({ sampleSize: 20, eligiblePopulation: 1_000 })
  });
  assert.equal(result.status, "HELD_QUALITY_GUARD");
  assert.equal(result.proposedAdjustmentDirection, "NONE");
  assert.equal(result.nextCandidateState.repairBudgetCents, 1_000_000);
  assert.equal(result.nextCandidateState.healthyStreak, 0);
  assert.equal(result.nextCandidateState.consecutiveQualityHolds, 1);
  assert.equal(result.oversightEscalationRequired, false);
  assert.ok(result.reasonCodes.includes("SAMPLE_BELOW_MINIMUM"));
});

test("raw respondent material is rejected rather than silently ignored", () => {
  const result = calculateNextRepairState({
    policy,
    state: state(),
    measurement: { ...measurement(), responses: [{ name: "person", answer: "text" }] }
  });
  assert.equal(result.status, "REJECTED_INPUT");
  assert.equal(result.nextCandidateState, null);
});

test("privacy-unsafe measurements are rejected", () => {
  const result = calculateNextRepairState({
    policy,
    state: state(),
    measurement: measurement({ containsDirectIdentifiers: true })
  });
  assert.equal(result.status, "REJECTED_PRIVACY");
  assert.equal(result.nextCandidateState, null);
});

test("population satisfaction cannot enter the pay evaluator", () => {
  const compensationPolicy = {
    version: "comp-v1",
    currency: "EUR",
    basis: "ROLE_MONTHLY_GROSS_FTE",
    floorMonthlyCents: 400_000,
    satisfactionLink: "PROHIBITED"
  };
  const compensationState = { policyVersion: "comp-v1", currentBaseMonthlyCents: 500_000 };
  const unchanged = evaluateCompensation({ policy: compensationPolicy, state: compensationState });
  assert.equal(unchanged.status, "UNCHANGED_BY_SATISFACTION_MODEL");
  assert.equal(unchanged.monthlyBaseCents, 500_000);
  const injectionAttempt = evaluateCompensation({
    policy: compensationPolicy,
    state: compensationState,
    populationSatisfactionIndexBps: 0
  });
  assert.equal(injectionAttempt.status, "REJECTED_INPUT");
});

test("compensation below the configured floor is rejected", () => {
  const result = evaluateCompensation({
    policy: {
      version: "comp-v1",
      currency: "EUR",
      basis: "ROLE_MONTHLY_GROSS_FTE",
      floorMonthlyCents: 400_000,
      satisfactionLink: "PROHIBITED"
    },
    state: { policyVersion: "comp-v1", currentBaseMonthlyCents: 399_999 }
  });
  assert.equal(result.status, "REJECTED_COMPENSATION_FLOOR");
});

test("listening role requires backup, separate safety, and an experience route", () => {
  const valid = validateListeningRoomDesign({
    version: "room-v1",
    unitType: "AUTHORITY_ENTRY_LISTENING_ROOM",
    coverageWindow: "PUBLIC_OPENING_HOURS",
    minimumListeningStaffOnDuty: 1,
    backupCoverageDefined: true,
    lowStimulusProtocolVersion: "low-stimulus-v1",
    listeningRoleHasEnforcementPowers: false,
    separateSafetyFunctionAvailable: true,
    safetyEscalationProtocolVersion: "safety-v1",
    qualificationPathways: ["FORMAL_QUALIFICATION", "EQUIVALENT_EXPERIENCE"]
  });
  assert.equal(valid.status, "STRUCTURE_BOUND");
  const invalid = validateListeningRoomDesign({
    version: "room-v1",
    unitType: "AUTHORITY_ENTRY_LISTENING_ROOM",
    coverageWindow: "PUBLIC_OPENING_HOURS",
    minimumListeningStaffOnDuty: 1,
    backupCoverageDefined: true,
    lowStimulusProtocolVersion: "low-stimulus-v1",
    listeningRoleHasEnforcementPowers: false,
    separateSafetyFunctionAvailable: false,
    safetyEscalationProtocolVersion: "safety-v1",
    qualificationPathways: ["FORMAL_QUALIFICATION"]
  });
  assert.equal(invalid.status, "REJECTED");
  assert.ok(invalid.issues.some(issue => issue.code === "SEPARATE_SAFETY_FUNCTION_REQUIRED"));
  assert.ok(invalid.issues.some(issue => issue.code === "EXPERIENCE_BASED_PATHWAY_REQUIRED"));
});

test("the published room contract itself passes canonical structure validation", () => {
  const result = validatePublishedRoomContract(roomContract);
  assert.equal(result.status, "STRUCTURE_BOUND");
  assert.equal(result.structureBound, true);
  assert.equal(result.canonicalContractBound, true);
  assert.deepEqual(result.issues, []);
});

test("canonical room validation rejects material changes to the real contract", () => {
  const mutations = [
    contract => {
      contract.roles.find(role => role.roleId === "LISTENING_STEWARD").minimumOnDuty = 0;
    },
    contract => {
      contract.roles.find(role => role.roleId === "LISTENING_STEWARD").powers.push("SEARCH_PERSON");
    },
    contract => {
      contract.roles.find(role => role.roleId === "LISTENING_STEWARD").prohibitedPowers = [];
    },
    contract => {
      contract.roles.find(role => role.roleId === "SAFETY_FUNCTION").mayDecideComplaintMerits = true;
    }
  ];
  for (const mutate of mutations) {
    const altered = structuredClone(roomContract);
    mutate(altered);
    const result = validatePublishedRoomContract(altered);
    assert.equal(result.status, "REJECTED");
    assert.equal(result.canonicalContractBound, false);
    assert.ok(result.issues.length > 0);
  }
});

test("the published contract separates current law from the proposed duty", () => {
  assert.equal(
    roomContract.currentLegalState,
    "NO_GENERAL_FEDERAL_DUTY_FOUND_FOR_A_DEDICATED_ROOM_AT_EVERY_AUTHORITY_ENTRANCE"
  );
  assert.equal(roomContract.proposalState, "PUBLIC_POLICY_AND_PILOT_PROPOSAL");
  assert.equal(roomContract.proposerOffer.createsAppointment, false);
  assert.equal(roomContract.proposerOffer.createsCompensationEntitlement, false);
});

test("listening and enforcement powers cannot be silently merged", () => {
  const result = validateListeningRoomDesign({
    version: "room-v1",
    unitType: "AUTHORITY_ENTRY_LISTENING_ROOM",
    coverageWindow: "PUBLIC_OPENING_HOURS",
    minimumListeningStaffOnDuty: 1,
    backupCoverageDefined: true,
    lowStimulusProtocolVersion: "low-stimulus-v1",
    listeningRoleHasEnforcementPowers: true,
    separateSafetyFunctionAvailable: true,
    safetyEscalationProtocolVersion: "safety-v1",
    qualificationPathways: ["EQUIVALENT_EXPERIENCE"]
  });
  assert.equal(result.status, "REJECTED");
  assert.ok(result.issues.some(issue => issue.code === "LISTENING_AND_ENFORCEMENT_ROLES_MUST_BE_SEPARATE"));
});

test("the published example preserves the complete illustrative reference", () => {
  assert.deepEqual(budgetExample.illustrativeUserReference, ILLUSTRATIVE_USER_REFERENCE);
});

test("quality safeguards cannot be configured down to zero", () => {
  const result = calculateNextRepairState({
    policy: {
      ...policy,
      minSampleSize: 0,
      minResponseRateBps: 0,
      minCellSize: 0,
      maxMarginOfErrorBps: 10_000
    },
    state: state(),
    measurement: measurement()
  });
  assert.equal(result.status, "REJECTED_POLICY");
  assert.equal(result.nextCandidateState, null);
  assert.equal(MINIMUM_QUALITY_PROFILE.minSampleSize, 100);
  assert.ok(result.issues.length >= 4);
});

test("a whitespace receipt identifier is rejected", () => {
  const result = calculateNextRepairState({
    policy,
    state: state(),
    measurement: measurement({ sourceReceiptId: " " })
  });
  assert.equal(result.status, "REJECTED_INPUT");
  assert.ok(result.issues.some(issue => issue.code === "INVALID_IDENTIFIER"));
});

test("non-enumerable unknown fields cannot bypass exact input validation", () => {
  const input = { policy, state: state(), measurement: measurement() };
  Object.defineProperty(input, "hiddenOverride", { value: true, enumerable: false });
  const result = calculateNextRepairState(input);
  assert.equal(result.status, "REJECTED_INPUT");
  assert.ok(result.issues.some(issue => issue.path === "input.hiddenOverride"));
});

test("repeated quality holds trigger independent oversight without moving money", () => {
  const first = calculateNextRepairState({
    policy,
    state: state(),
    measurement: measurement({ sampleSize: 20 })
  });
  const second = calculateNextRepairState({
    policy,
    state: first.nextCandidateState,
    measurement: measurement({
      period: "2026-10",
      sampleSize: 20,
      sourceReceiptId: "receipt-2026-10"
    })
  });
  assert.equal(second.status, "HELD_QUALITY_GUARD");
  assert.equal(second.proposedAdjustmentDirection, "NONE");
  assert.equal(second.oversightEscalationRequired, true);
  assert.equal(second.nextCandidateState.repairBudgetCents, 1_000_000);
});
