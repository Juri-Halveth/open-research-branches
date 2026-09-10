import { readFileSync } from "node:fs";

const CONTRACT = JSON.parse(readFileSync(new URL("../route-contract.json", import.meta.url), "utf8"));
const SOURCES = JSON.parse(readFileSync(new URL("../sources.json", import.meta.url), "utf8"));

export const CLAIM_AXES = Object.freeze([...CONTRACT.claimAxes]);
export const EVIDENCE_STATES = Object.freeze([...CONTRACT.evidenceStates]);
export const FACT_IDS = Object.freeze([...CONTRACT.factIds]);

const EVIDENCE_STATE_SET = new Set(EVIDENCE_STATES);
const FACT_ID_SET = new Set(FACT_IDS);
const EVIDENCE_CLASS_SET = new Set(CONTRACT.evidenceClasses);
const FACT_EVIDENCE_CLASSES = new Map(Object.entries(CONTRACT.factEvidenceClasses).map(([factId, classes]) => [factId, new Set(classes)]));
const AXIS_EVIDENCE_CLASSES = new Map(Object.entries(CONTRACT.axisEvidenceClasses).map(([axisId, classes]) => [axisId, new Set(classes)]));
const ROUTE_BY_ID = new Map(CONTRACT.routes.map((route) => [route.routeId, route]));
const SOURCE_ID_SET = new Set(SOURCES.sources.map((source) => source.id));
const ACCESS_STATES = new Set(["AVAILABLE_TO_REPORTER", "CONTROLLED_BY_OTHER", "UNKNOWN"]);
const STRONG_STATES = new Set(["OBSERVED", "STRONGLY_SUPPORTED"]);
const PROCEDURAL_AUTHORITY_SOURCE_IDS = new Set(ROUTE_BY_ID.get("EVIDENCE_IN_OTHER_SPHERE_REVIEW").officialSourceIds);

for (const factId of FACT_IDS) {
  const classes = FACT_EVIDENCE_CLASSES.get(factId);
  if (!classes?.size) throw new TypeError(`route contract has no evidence class for fact: ${factId}`);
  for (const evidenceClass of classes) {
    if (!EVIDENCE_CLASS_SET.has(evidenceClass)) throw new TypeError(`route contract has an unknown evidence class for ${factId}: ${evidenceClass}`);
  }
}
for (const factId of FACT_EVIDENCE_CLASSES.keys()) {
  if (!FACT_ID_SET.has(factId)) throw new TypeError(`route contract maps an unknown fact id: ${factId}`);
}
for (const axisId of CLAIM_AXES) {
  const classes = AXIS_EVIDENCE_CLASSES.get(axisId);
  if (!classes?.size) throw new TypeError(`route contract has no evidence class for axis: ${axisId}`);
  for (const evidenceClass of classes) {
    if (!EVIDENCE_CLASS_SET.has(evidenceClass)) throw new TypeError(`route contract has an unknown evidence class for ${axisId}: ${evidenceClass}`);
  }
}
for (const axisId of AXIS_EVIDENCE_CLASSES.keys()) {
  if (!CLAIM_AXES.includes(axisId)) throw new TypeError(`route contract maps an unknown axis id: ${axisId}`);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`);
  }
}

function nonemptyText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function uniqueStrings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new TypeError(`${label} must be an array of non-empty strings`);
  }
  const result = value.map((item) => item.trim());
  if (new Set(result).size !== result.length) throw new TypeError(`${label} must not contain duplicates`);
  return result;
}

function validateAuthoritySourceIds(refs, label) {
  for (const ref of refs) {
    if (!SOURCE_ID_SET.has(ref)) throw new TypeError(`${label} contains unknown source id: ${ref}`);
  }
}

function typedEvidenceRefs(value, label, allowedClasses, required = false) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const result = value.map((raw, index) => {
    const ref = object(raw, `${label}[${index}]`);
    exactKeys(ref, ["refId", "evidenceClass"], `${label}[${index}]`);
    const refId = nonemptyText(ref.refId, `${label}[${index}].refId`);
    const evidenceClass = nonemptyText(ref.evidenceClass, `${label}[${index}].evidenceClass`);
    if (!EVIDENCE_CLASS_SET.has(evidenceClass)) throw new TypeError(`${label}[${index}].evidenceClass is unknown: ${evidenceClass}`);
    if (allowedClasses && !allowedClasses.has(evidenceClass)) {
      throw new TypeError(`${label}[${index}].evidenceClass does not match the bound evidence contract: ${evidenceClass}`);
    }
    return Object.freeze({ refId, evidenceClass });
  });
  if (required && result.length === 0) throw new TypeError(`${label} must contain matching evidence for a bound state`);
  const identities = result.map((ref) => `${ref.evidenceClass}\u0000${ref.refId}`);
  if (new Set(identities).size !== identities.length) throw new TypeError(`${label} must not contain duplicates`);
  return result;
}

function bindFacts(facts) {
  if (!Array.isArray(facts)) throw new TypeError("facts must be an array");
  const map = new Map();
  for (const [index, raw] of facts.entries()) {
    const fact = object(raw, `facts[${index}]`);
    exactKeys(fact, ["factId", "state", "evidenceRefs", "authoritySourceIds"], `facts[${index}]`);
    const factId = nonemptyText(fact.factId, `facts[${index}].factId`);
    if (!FACT_ID_SET.has(factId)) throw new TypeError(`facts[${index}].factId is unknown: ${factId}`);
    if (map.has(factId)) throw new TypeError(`facts contains duplicate fact id: ${factId}`);
    if (!EVIDENCE_STATE_SET.has(fact.state)) throw new TypeError(`facts[${index}].state is invalid: ${fact.state}`);
    const allowedClasses = FACT_EVIDENCE_CLASSES.get(factId);
    const evidenceRefs = typedEvidenceRefs(fact.evidenceRefs, `facts[${index}].evidenceRefs`, allowedClasses, STRONG_STATES.has(fact.state));
    const authoritySourceIds = uniqueStrings(fact.authoritySourceIds, `facts[${index}].authoritySourceIds`);
    validateAuthoritySourceIds(authoritySourceIds, `facts[${index}].authoritySourceIds`);
    map.set(factId, { factId, state: fact.state, evidenceRefs, authoritySourceIds });
  }
  return map;
}

function bindAxes(evidenceAxes) {
  if (!Array.isArray(evidenceAxes)) throw new TypeError("evidenceAxes must be an array");
  const map = new Map();
  for (const [index, raw] of evidenceAxes.entries()) {
    const axis = object(raw, `evidenceAxes[${index}]`);
    exactKeys(axis, ["axisId", "state", "evidenceRefs", "authoritySourceIds"], `evidenceAxes[${index}]`);
    const axisId = nonemptyText(axis.axisId, `evidenceAxes[${index}].axisId`);
    if (!CLAIM_AXES.includes(axisId)) throw new TypeError(`unknown axis id: ${axisId}`);
    if (map.has(axisId)) throw new TypeError(`duplicate axis id: ${axisId}`);
    if (!EVIDENCE_STATE_SET.has(axis.state)) throw new TypeError(`invalid axis state for ${axisId}: ${axis.state}`);
    const evidenceRefs = typedEvidenceRefs(axis.evidenceRefs, `evidenceAxes[${index}].evidenceRefs`, AXIS_EVIDENCE_CLASSES.get(axisId), STRONG_STATES.has(axis.state));
    const authoritySourceIds = uniqueStrings(axis.authoritySourceIds, `evidenceAxes[${index}].authoritySourceIds`);
    validateAuthoritySourceIds(authoritySourceIds, `evidenceAxes[${index}].authoritySourceIds`);
    map.set(axisId, Object.freeze({ axisId, state: axis.state, evidenceRefs, authoritySourceIds }));
  }
  const missing = CLAIM_AXES.filter((axisId) => !map.has(axisId));
  if (missing.length) throw new TypeError(`evidenceAxes must explicitly include: ${missing.join(", ")}`);
  return CLAIM_AXES.map((axisId) => map.get(axisId));
}

function isBound(fact) {
  return Boolean(fact && STRONG_STATES.has(fact.state) && fact.evidenceRefs.length);
}

function assessRoute(route, factMap) {
  const missingFactIds = route.elementFactIds.filter((factId) => !isBound(factMap.get(factId)));
  return Object.freeze({
    routeId: route.routeId,
    state: missingFactIds.length ? "ELEMENTS_INCOMPLETE" : "ELEMENTS_BOUND_FOR_HUMAN_REVIEW_NOT_MERITS",
    missingFactIds,
    officialSourceIds: [...route.officialSourceIds],
    canEstablish: [...route.canEstablish],
    cannotEstablish: [...route.cannotEstablish],
    automaticMeritsFinding: false,
    automaticAmountFinding: false
  });
}

function assessControlledEvidence(items) {
  if (!Array.isArray(items)) throw new TypeError("controlledEvidence must be an array");
  return items.map((raw, index) => {
    const item = object(raw, `controlledEvidence[${index}]`);
    exactKeys(item, ["controllerRole", "evidenceKind", "reporterAccessState", "scope", "evidenceRefs", "authoritySourceIds"], `controlledEvidence[${index}]`);
    const controllerRole = nonemptyText(item.controllerRole, `controlledEvidence[${index}].controllerRole`);
    const evidenceKind = nonemptyText(item.evidenceKind, `controlledEvidence[${index}].evidenceKind`);
    const scope = nonemptyText(item.scope, `controlledEvidence[${index}].scope`);
    if (!ACCESS_STATES.has(item.reporterAccessState)) throw new TypeError(`controlledEvidence[${index}].reporterAccessState is invalid`);
    const evidenceRefs = typedEvidenceRefs(item.evidenceRefs, `controlledEvidence[${index}].evidenceRefs`, new Set(["CONTROLLED_EVIDENCE_DESIGNATION"]), item.reporterAccessState === "CONTROLLED_BY_OTHER");
    const authoritySourceIds = uniqueStrings(item.authoritySourceIds, `controlledEvidence[${index}].authoritySourceIds`);
    validateAuthoritySourceIds(authoritySourceIds, `controlledEvidence[${index}].authoritySourceIds`);
    if (item.reporterAccessState === "CONTROLLED_BY_OTHER" && !authoritySourceIds.some((sourceId) => PROCEDURAL_AUTHORITY_SOURCE_IDS.has(sourceId))) {
      throw new TypeError(`controlledEvidence[${index}].authoritySourceIds must include a matching procedural authority source`);
    }
    return Object.freeze({
      controllerRole,
      evidenceKind,
      reporterAccessState: item.reporterAccessState,
      scope,
      evidenceRefs,
      authoritySourceIds,
      reviewState: item.reporterAccessState === "CONTROLLED_BY_OTHER"
        ? "SCOPED_PRODUCTION_INSPECTION_OR_SECONDARY_SUBSTANTIATION_REVIEW_CANDIDATE"
        : "NO_OTHER_SPHERE_PROCEDURAL_ROUTE_SELECTED",
      automaticProductionDuty: false,
      automaticAdverseInference: false,
      automaticBurdenReversal: false
    });
  });
}

function advisoryFlags(factMap) {
  const flags = [];
  if (isBound(factMap.get("GIT_OBJECT_BOUND")) && !isBound(factMap.get("QUALIFIED_TIMESTAMP_BOUND"))) {
    flags.push("GIT_OBJECT_DATE_IS_NOT_QUALIFIED_TIMESTAMP");
  }
  if (isBound(factMap.get("PUBLIC_ACCESS_DATE_BOUND")) && isBound(factMap.get("PATENT_APPLICATION_BOUND"))) {
    flags.push("PATENT_NOVELTY_TIMELINE_REVIEW_REQUIRED");
  }
  if (isBound(factMap.get("PUBLIC_ACCESS_DATE_BOUND")) && isBound(factMap.get("SECRECY_STATE_BOUND"))) {
    flags.push("TRADE_SECRET_TIMELINE_AND_SCOPE_REVIEW_REQUIRED");
  }
  if (isBound(factMap.get("FUNCTIONALITY_ONLY_OVERLAP_REPORTED")) && !isBound(factMap.get("PROTECTED_EXPRESSION_BOUND"))) {
    flags.push("SOFTWARE_FUNCTIONALITY_IS_NOT_PROTECTED_EXPRESSION");
  }
  return flags;
}

export function auditPriorityEvidence(record) {
  const input = object(record, "record");
  exactKeys(input, ["report", "facts", "evidenceAxes", "requestedRouteIds", "controlledEvidence"], "record");
  const report = object(input.report, "report");
  exactKeys(report, ["id", "statement", "evidenceRefs", "authoritySourceIds"], "report");
  const evidenceRefs = typedEvidenceRefs(report.evidenceRefs, "report.evidenceRefs", new Set(["REPORT_ARTIFACT"]), true);
  const authoritySourceIds = uniqueStrings(report.authoritySourceIds, "report.authoritySourceIds");
  validateAuthoritySourceIds(authoritySourceIds, "report.authoritySourceIds");
  const boundReport = Object.freeze({
    id: nonemptyText(report.id, "report.id"),
    statement: nonemptyText(report.statement, "report.statement"),
    evidenceRefs,
    authoritySourceIds
  });

  const factMap = bindFacts(input.facts);
  const evidenceAxes = bindAxes(input.evidenceAxes);
  const requestedRouteIds = uniqueStrings(input.requestedRouteIds, "requestedRouteIds");
  const routes = requestedRouteIds.map((routeId) => {
    const route = ROUTE_BY_ID.get(routeId);
    if (!route) throw new TypeError(`unknown route id: ${routeId}`);
    return assessRoute(route, factMap);
  });
  const controlledEvidence = assessControlledEvidence(input.controlledEvidence);

  return Object.freeze({
    schema: "halveth.priority-evidence-route-receipt.v1",
    report: boundReport,
    intakeState: CONTRACT.intakeState,
    meritsState: CONTRACT.meritsState,
    evidenceAxes,
    routes,
    controlledEvidence,
    advisoryFlags: advisoryFlags(factMap),
    automaticClaimRejection: false,
    automaticAuthorshipOrInventorshipFinding: false,
    automaticAccessOrDerivationFinding: false,
    automaticInfringementFinding: false,
    automaticEntitlementOrRegressFinding: false,
    automaticAmountFinding: false,
    claimCeiling: CONTRACT.claimCeiling
  });
}

export function getRouteContract() {
  return structuredClone(CONTRACT);
}

export function getOfficialSources() {
  return structuredClone(SOURCES);
}
