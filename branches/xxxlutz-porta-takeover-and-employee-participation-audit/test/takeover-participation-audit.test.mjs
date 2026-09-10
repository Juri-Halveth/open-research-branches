import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { auditTransactionAndRights, getDealAxes } from "../src/takeover-participation-audit.mjs";

const axis = (axisId, state = "UNKNOWN", sourceIds = []) => ({ axisId, state, sourceIds });

function dealAxes(overrides = {}) {
  return getDealAxes().map((axisId) => overrides[axisId] ?? axis(axisId));
}

function base(overrides = {}) {
  return {
    observedAt: "2026-09-10T02:00:00Z",
    dealAxes: dealAxes({
      ANNOUNCEMENT: axis("ANNOUNCEMENT", "OBSERVED", ["S01_XXXLUTZ_ANNOUNCEMENT"]),
      FORMAL_NOTIFICATION: axis("FORMAL_NOTIFICATION", "OBSERVED", ["S03_EC_CASE_M11895", "S05_EC_M11895_NOTICE"]),
      GUN_JUMPING_INVESTIGATION: axis("GUN_JUMPING_INVESTIGATION", "OBSERVED", ["S02_EC_GUN_JUMPING_2026", "S04_EC_CASE_M11895_AP"])
    }),
    employment: {
      directEmployerChanged: "UNKNOWN",
      economicUnitIdentityPreserved: "UNKNOWN",
      employeeBand: "UNKNOWN",
      worksCouncil: "UNKNOWN",
      economicCommittee: "UNKNOWN",
      operationalChangeMayCauseMaterialDisadvantage: "UNKNOWN",
      individualEvent: "NONE"
    },
    participation: {
      rachelReferenceState: "USER_PROPOSED_PUBLIC_SYSTEM_ROLE",
      naturalPersonConsent: "UNBOUND",
      requestedPaths: ["VOLUNTARY_EMPLOYEE_PARTICIPATION_PLAN"]
    },
    ...overrides
  };
}

test("announced transaction and formal investigation do not become completion or violation findings", () => {
  const result = auditTransactionAndRights(base());
  assert.equal(result.deal.announcementFinding, true);
  assert.equal(result.deal.gunJumpingInvestigationFinding, true);
  assert.equal(result.deal.gunJumpingViolationFinding, false);
  assert.equal(result.deal.formalNotificationFinding, true);
  assert.equal(result.deal.closingOrControlTransferFinding, false);
  assert.equal(result.deal.investigationIsNotViolationFinding, true);
});

test("the dated public snapshot is notified but neither cleared nor closed", () => {
  const result = auditTransactionAndRights(base());
  assert.equal(result.deal.publicStatus, "ANNOUNCED_AND_NOTIFIED_WITH_FORMAL_GUN_JUMPING_INVESTIGATION_CLEARANCE_AND_CLOSING_NOT_BOUND");
  assert.equal(result.deal.clearanceFinding, false);
  assert.equal(result.deal.closingOrControlTransferFinding, false);
});

test("a caller-supplied source string cannot promote clearance", () => {
  const record = base();
  record.dealAxes = dealAxes({
    ANNOUNCEMENT: axis("ANNOUNCEMENT", "OBSERVED", ["S01_XXXLUTZ_ANNOUNCEMENT"]),
    MERGER_CLEARANCE: axis("MERGER_CLEARANCE", "OBSERVED", ["synthetic-clearance"])
  });
  assert.throws(() => auditTransactionAndRights(record), /unregistered source references/u);
});

test("a caller-supplied source string cannot promote closing or control transfer", () => {
  const record = base();
  record.dealAxes = dealAxes({
    ANNOUNCEMENT: axis("ANNOUNCEMENT", "OBSERVED", ["S01_XXXLUTZ_ANNOUNCEMENT"]),
    CLOSING_OR_CONTROL_TRANSFER: axis("CLOSING_OR_CONTROL_TRANSFER", "OBSERVED", ["synthetic-closing"])
  });
  assert.throws(() => auditTransactionAndRights(record), /unregistered source references/u);
});

test("a shareholder change alone does not trigger section 613a on the bound facts", () => {
  const result = auditTransactionAndRights(base({
    employment: {
      ...base().employment,
      directEmployerChanged: "NO",
      economicUnitIdentityPreserved: "YES"
    }
  }));
  assert.equal(result.employment.transferRoute, "NOT_TRIGGERED_BY_BOUND_SHAREHOLDER_CHANGE_ALONE");
  assert.equal(result.employment.automaticBusinessTransferFinding, false);
});

test("a changed employer and preserved economic unit open the section 613a review", () => {
  const result = auditTransactionAndRights(base({
    employment: {
      ...base().employment,
      directEmployerChanged: "YES",
      economicUnitIdentityPreserved: "YES"
    }
  }));
  assert.equal(result.employment.transferRoute, "SECTION_613A_REVIEW_READY");
  assert.equal(result.employment.automaticBusinessTransferFinding, false);
});

test("company takeover information is routed through the economic committee when present", () => {
  const result = auditTransactionAndRights(base({
    employment: {
      ...base().employment,
      employeeBand: "OVER_100",
      economicCommittee: "PRESENT",
      worksCouncil: "PRESENT"
    }
  }));
  assert.equal(result.employment.takeoverInformationRoute, "ECONOMIC_COMMITTEE_SECTION_106");
});

test("an operational change with material disadvantage opens sections 111 to 113 review", () => {
  const result = auditTransactionAndRights(base({
    employment: {
      ...base().employment,
      employeeBand: "21_TO_100",
      worksCouncil: "PRESENT",
      operationalChangeMayCauseMaterialDisadvantage: "YES"
    }
  }));
  assert.equal(result.employment.operationalChangeRoute, "SECTIONS_111_TO_113_REVIEW_READY");
  assert.equal(result.employment.automaticSeveranceFinding, false);
});

test("section 111 threshold remains open when the contractual employer employee band is unknown", () => {
  const result = auditTransactionAndRights(base({
    employment: {
      ...base().employment,
      worksCouncil: "PRESENT",
      operationalChangeMayCauseMaterialDisadvantage: "YES"
    }
  }));
  assert.equal(result.employment.operationalChangeRoute, "SECTION_111_EMPLOYEE_THRESHOLD_REVIEW_REQUIRED");
});

test("a received dismissal exposes the three-week court deadline route", () => {
  const result = auditTransactionAndRights(base({
    employment: { ...base().employment, individualEvent: "DISMISSAL_RECEIVED" }
  }));
  assert.deepEqual(result.employment.urgentRoutes, ["KSchG_SECTION_4_THREE_WEEK_COURT_DEADLINE_REVIEW"]);
});

test("employee data transfer opens purpose necessity and transparency review", () => {
  const result = auditTransactionAndRights(base({
    employment: { ...base().employment, individualEvent: "EMPLOYEE_DATA_TRANSFER_PLANNED" }
  }));
  assert.deepEqual(result.employment.urgentRoutes, ["BDSG_26_GDPR_PURPOSE_NECESSITY_TRANSPARENCY_REVIEW"]);
});

test("Rachel remains a public system reference without appointment ownership or payment", () => {
  const result = auditTransactionAndRights(base());
  assert.equal(result.participation.roleMeaning, "PUBLIC_COUNTERDESIGN_AND_PARTICIPATION_REFERENCE_ONLY");
  assert.equal(result.participation.naturalPersonAppointmentFinding, false);
  assert.equal(result.participation.naturalPersonOwnershipFinding, false);
  assert.equal(result.participation.automaticPaymentFinding, false);
});

test("human dignity stays unpriced while concrete value routes remain visible", () => {
  const result = auditTransactionAndRights(base());
  assert.ok(result.valueAxes.includes("HUMAN_DIGNITY_UNPRICED"));
  assert.ok(result.valueAxes.includes("SPECIFIC_PROTECTED_IP_CONTRIBUTION"));
  assert.ok(result.valueAxes.includes("VOLUNTARY_PARTICIPATION"));
  assert.equal(result.automaticHumanValuePriceFinding, false);
  assert.equal(result.automaticCompanyOwnershipFinding, false);
});

test("every deal axis is mandatory and cannot disappear", () => {
  const record = base();
  record.dealAxes = record.dealAxes.filter((item) => item.axisId !== "CLOSING_OR_CONTROL_TRANSFER");
  assert.throws(() => auditTransactionAndRights(record), /must explicitly include: CLOSING_OR_CONTROL_TRANSFER/u);
});

test("the published current input reproduces the dated public status", () => {
  const input = JSON.parse(fs.readFileSync(new URL("../current-audit-input.json", import.meta.url), "utf8"));
  const result = auditTransactionAndRights(input);
  assert.equal(result.deal.formalNotificationFinding, true);
  assert.equal(result.deal.clearanceFinding, false);
  assert.equal(result.deal.closingOrControlTransferFinding, false);
  assert.equal(result.deal.gunJumpingInvestigationFinding, true);
  assert.equal(result.deal.gunJumpingViolationFinding, false);
  assert.equal(result.participation.naturalPersonAppointmentFinding, false);
  assert.equal(result.automaticEmployeeShareFinding, false);
});

test("every current source reference resolves to one unique public source record", () => {
  const input = JSON.parse(fs.readFileSync(new URL("../current-audit-input.json", import.meta.url), "utf8"));
  const registry = JSON.parse(fs.readFileSync(new URL("../sources.json", import.meta.url), "utf8"));
  const ids = registry.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const source of registry.sources) {
    assert.match(source.url, /^https:\/\//u);
    assert.ok(["OBSERVED", "STRONGLY_SUPPORTED"].includes(source.evidenceState));
  }
  const boundIds = new Set(ids);
  const referenced = [];
  for (const item of input.dealAxes) {
    referenced.push(...item.sourceIds);
  }
  for (const name of ["timeline.json", "claims.json", "participation-contract.json", "navigation-frame.json", "reconstruction-cycle.json"]) {
    const value = JSON.parse(fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8"));
    const collect = (node) => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (!node || typeof node !== "object") return;
      for (const [key, child] of Object.entries(node)) {
        if (["sourceIds", "sourceRefs", "sourceBasisRefs"].includes(key) && Array.isArray(child)) referenced.push(...child);
        else collect(child);
      }
    };
    collect(value);
  }
  for (const sourceId of referenced) assert.ok(boundIds.has(sourceId), sourceId);
});
