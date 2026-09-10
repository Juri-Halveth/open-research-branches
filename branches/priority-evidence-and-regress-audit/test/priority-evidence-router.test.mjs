import test from "node:test";
import assert from "node:assert/strict";

import { CLAIM_AXES, auditPriorityEvidence, getOfficialSources, getRouteContract } from "../src/priority-evidence-router.mjs";

const evidence = (refId, evidenceClass) => ({ refId, evidenceClass });
const axisSet = (overrides = {}) => CLAIM_AXES.map((axisId) => ({
  axisId,
  state: overrides[axisId]?.state ?? "UNKNOWN",
  evidenceRefs: overrides[axisId]?.evidenceRefs ?? [],
  authoritySourceIds: overrides[axisId]?.authoritySourceIds ?? []
}));
const fact = (factId, state, evidenceRefs, authoritySourceIds = []) => ({ factId, state, evidenceRefs, authoritySourceIds });

function baseRecord(overrides = {}) {
  return {
    report: {
      id: "REPORT.SYNTHETIC.001",
      statement: "A dated public artifact may establish a snapshot while later legal axes remain open.",
      evidenceRefs: [evidence("report:synthetic:001", "REPORT_ARTIFACT")],
      authoritySourceIds: ["S01_GIT_COMMIT"]
    },
    facts: [],
    evidenceAxes: axisSet(),
    requestedRouteIds: ["GIT_RELEASE_SNAPSHOT"],
    controlledEvidence: [],
    ...overrides
  };
}

test("a report is preserved even when every merits axis is explicitly unknown", () => {
  const receipt = auditPriorityEvidence(baseRecord());
  assert.equal(receipt.intakeState, "REPORT_PRESERVED_REVIEW_OPEN");
  assert.equal(receipt.meritsState, "NOT_EVALUATED");
  assert.equal(receipt.routes[0].state, "ELEMENTS_INCOMPLETE");
  assert.equal(receipt.automaticClaimRejection, false);
  assert.equal(receipt.automaticEntitlementOrRegressFinding, false);
});

test("a bound Git snapshot does not promote public availability, access, derivation, infringement, entitlement or amount", () => {
  const receipt = auditPriorityEvidence(baseRecord({
    facts: [
      fact("EXACT_CONTENT_BOUND", "OBSERVED", [evidence("sha256:content", "ARTIFACT_CONTENT_RECEIPT")], ["S01_GIT_COMMIT"]),
      fact("GIT_OBJECT_BOUND", "OBSERVED", [evidence("git:commit:abc123", "GIT_OBJECT_RECEIPT")], ["S02_GIT_COMMIT_TREE"])
    ],
    evidenceAxes: axisSet({ SNAPSHOT_PRIORITY: {
      state: "OBSERVED",
      evidenceRefs: [evidence("git:commit:abc123", "GIT_OBJECT_RECEIPT")],
      authoritySourceIds: ["S01_GIT_COMMIT", "S02_GIT_COMMIT_TREE"]
    } })
  }));
  assert.equal(receipt.routes[0].state, "ELEMENTS_BOUND_FOR_HUMAN_REVIEW_NOT_MERITS");
  for (const axis of receipt.evidenceAxes.filter((item) => item.axisId !== "SNAPSHOT_PRIORITY")) assert.equal(axis.state, "UNKNOWN");
  assert.ok(receipt.advisoryFlags.includes("GIT_OBJECT_DATE_IS_NOT_QUALIFIED_TIMESTAMP"));
});

test("an ordinary Git object cannot activate the qualified timestamp route", () => {
  const receipt = auditPriorityEvidence(baseRecord({
    facts: [
      fact("EXACT_CONTENT_BOUND", "OBSERVED", [evidence("sha256:content", "ARTIFACT_CONTENT_RECEIPT")]),
      fact("GIT_OBJECT_BOUND", "OBSERVED", [evidence("git:commit:abc123", "GIT_OBJECT_RECEIPT")], ["S02_GIT_COMMIT_TREE"])
    ],
    requestedRouteIds: ["QUALIFIED_EIDAS_TIMESTAMP"]
  }));
  assert.deepEqual(receipt.routes[0].missingFactIds, ["QUALIFIED_TIMESTAMP_BOUND"]);
});

test("functionality-only overlap does not make software-expression infringement review ready", () => {
  const receipt = auditPriorityEvidence(baseRecord({
    facts: [fact("FUNCTIONALITY_ONLY_OVERLAP_REPORTED", "OBSERVED", [evidence("comparison:functionality-only", "FUNCTIONALITY_COMPARISON_RECEIPT")], ["S11_CJEU_SAS"])],
    requestedRouteIds: ["SOFTWARE_EXPRESSION_REVIEW"]
  }));
  assert.equal(receipt.routes[0].state, "ELEMENTS_INCOMPLETE");
  assert.ok(receipt.routes[0].missingFactIds.includes("PROTECTED_EXPRESSION_BOUND"));
  assert.ok(receipt.advisoryFlags.includes("SOFTWARE_FUNCTIONALITY_IS_NOT_PROTECTED_EXPRESSION"));
});

test("public availability opens separate patent and trade-secret timeline reviews without deciding either", () => {
  const receipt = auditPriorityEvidence(baseRecord({
    facts: [
      fact("PUBLIC_ACCESS_DATE_BOUND", "OBSERVED", [evidence("public:url:dated-copy", "PUBLIC_ACCESS_RECEIPT")], ["S06_PATG_3"]),
      fact("PATENT_APPLICATION_BOUND", "OBSERVED", [evidence("patent:application:synthetic", "PATENT_RECORD_RECEIPT")], ["S08_PATG_RIGHT_AND_PROCEDURE"]),
      fact("SECRECY_STATE_BOUND", "STRONGLY_SUPPORTED", [evidence("secrecy:timeline:synthetic", "SECRECY_RECORD_RECEIPT")], ["S13_GESCHGEHG"])
    ],
    requestedRouteIds: ["PUBLIC_DISCLOSURE_PRIOR_ART", "TRADE_SECRET_REVIEW"]
  }));
  assert.ok(receipt.advisoryFlags.includes("PATENT_NOVELTY_TIMELINE_REVIEW_REQUIRED"));
  assert.ok(receipt.advisoryFlags.includes("TRADE_SECRET_TIMELINE_AND_SCOPE_REVIEW_REQUIRED"));
  assert.equal(receipt.automaticInfringementFinding, false);
  assert.equal(receipt.automaticEntitlementOrRegressFinding, false);
});

test("specific evidence in another sphere opens procedural review without an automatic duty or adverse inference", () => {
  const receipt = auditPriorityEvidence(baseRecord({
    facts: [fact("CONTROLLED_EVIDENCE_DESIGNATED", "OBSERVED", [evidence("designation:access-log:window", "CONTROLLED_EVIDENCE_DESIGNATION")], ["S19_ZPO_142", "S19A_ARBGG_46"])],
    requestedRouteIds: ["EVIDENCE_IN_OTHER_SPHERE_REVIEW"],
    controlledEvidence: [{
      controllerRole: "TARGET_ORGANIZATION",
      evidenceKind: "VERSIONED_ACCESS_LOG",
      reporterAccessState: "CONTROLLED_BY_OTHER",
      scope: "Exact artifact identifier and bounded date window",
      evidenceRefs: [evidence("designation:access-log:window", "CONTROLLED_EVIDENCE_DESIGNATION")],
      authoritySourceIds: ["S19_ZPO_142", "S19A_ARBGG_46", "S20_IP_ENFORCEMENT_DIRECTIVE", "S21_BAG_10_AZR_56_19"]
    }]
  }));
  assert.equal(receipt.routes[0].state, "ELEMENTS_BOUND_FOR_HUMAN_REVIEW_NOT_MERITS");
  assert.equal(receipt.controlledEvidence[0].reviewState, "SCOPED_PRODUCTION_INSPECTION_OR_SECONDARY_SUBSTANTIATION_REVIEW_CANDIDATE");
  assert.equal(receipt.controlledEvidence[0].automaticProductionDuty, false);
  assert.equal(receipt.controlledEvidence[0].automaticAdverseInference, false);
  assert.equal(receipt.controlledEvidence[0].automaticBurdenReversal, false);
});

test("all route source identifiers exist and every registry URL is first-party official", () => {
  const contract = getRouteContract();
  const registry = getOfficialSources();
  const sourceIds = new Set(registry.sources.map((source) => source.id));
  const allowedHosts = new Set(["git-scm.com", "docs.github.com", "eur-lex.europa.eu", "www.gesetze-im-internet.de", "www.epo.org", "juris.bundesgerichtshof.de", "www.dpma.de", "www.bundesarbeitsgericht.de", "www.bundesverfassungsgericht.de"]);
  for (const route of contract.routes) for (const sourceId of route.officialSourceIds) assert.ok(sourceIds.has(sourceId), sourceId);
  for (const source of registry.sources) assert.ok(allowedHosts.has(new URL(source.url).hostname), source.url);
});

test("the contract rejects a silently omitted claim axis", () => {
  const record = baseRecord();
  record.evidenceAxes = record.evidenceAxes.filter((axis) => axis.axisId !== "AMOUNT");
  assert.throws(() => auditPriorityEvidence(record), /explicitly include: AMOUNT/u);
});

test("an observed fact cannot use an official authority citation as its factual evidence", () => {
  const record = baseRecord({ facts: [fact("EXACT_CONTENT_BOUND", "OBSERVED", [], ["S01_GIT_COMMIT"])] });
  assert.throws(() => auditPriorityEvidence(record), /must contain matching evidence for a bound state/u);
});

test("an observed amount axis cannot remain evidence-empty", () => {
  const record = baseRecord({ evidenceAxes: axisSet({
    AMOUNT: { state: "OBSERVED", evidenceRefs: [], authoritySourceIds: ["S14_BGB_812"] }
  }) });
  assert.throws(() => auditPriorityEvidence(record), /must contain matching evidence for a bound state/u);
});

test("an observed amount axis rejects a Git-object evidence class", () => {
  const record = baseRecord({ evidenceAxes: axisSet({
    AMOUNT: {
      state: "OBSERVED",
      evidenceRefs: [evidence("git:commit:abc123", "GIT_OBJECT_RECEIPT")],
      authoritySourceIds: ["S14_BGB_812"]
    }
  }) });
  assert.throws(() => auditPriorityEvidence(record), /does not match the bound evidence contract/u);
});

test("an observed amount axis accepts a matching calculation receipt", () => {
  const receipt = auditPriorityEvidence(baseRecord({ evidenceAxes: axisSet({
    AMOUNT: {
      state: "OBSERVED",
      evidenceRefs: [evidence("amount:method-and-data:synthetic", "AMOUNT_CALCULATION_RECEIPT")],
      authoritySourceIds: ["S14_BGB_812"]
    }
  }) }));
  assert.equal(receipt.evidenceAxes.find((axis) => axis.axisId === "AMOUNT").state, "OBSERVED");
});

test("a fact rejects an evidence class that does not match that fact", () => {
  const record = baseRecord({ facts: [fact("EXACT_CONTENT_BOUND", "OBSERVED", [evidence("git:commit:abc123", "GIT_OBJECT_RECEIPT")], ["S01_GIT_COMMIT"])] });
  assert.throws(() => auditPriorityEvidence(record), /does not match the bound evidence contract/u);
});

test("other-sphere review rejects a nonprocedural authority source", () => {
  const record = baseRecord({ controlledEvidence: [{
    controllerRole: "TARGET_ORGANIZATION",
    evidenceKind: "VERSIONED_ACCESS_LOG",
    reporterAccessState: "CONTROLLED_BY_OTHER",
    scope: "Exact artifact identifier and bounded date window",
    evidenceRefs: [evidence("designation:access-log:window", "CONTROLLED_EVIDENCE_DESIGNATION")],
    authoritySourceIds: ["S01_GIT_COMMIT"]
  }] });
  assert.throws(() => auditPriorityEvidence(record), /must include a matching procedural authority source/u);
});
