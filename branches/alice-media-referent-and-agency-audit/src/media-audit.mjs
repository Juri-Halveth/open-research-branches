import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const USER_SOURCE_EXPRESSION = "schlecht gemacht";

export const ALLOWED_MECHANISMS = Object.freeze([
  "IN_WORLD_COERCION",
  "FORCED_TRANSFORMATION",
  "ABDUCTION_AND_ABUSE",
  "SUPERNATURAL_TRANSFORMATION",
  "INSTITUTIONAL_DISBELIEF",
  "AUTHORIAL_DARK_REFRAMING",
  "MORAL_ROLE_BLURRING",
  "TITLE_ALLUSION_ONLY",
  "UNKNOWN"
]);

export const REFERENT_UNKNOWN_OUTCOME = "UNKNOWN_ALICE_REFERENT_CANDIDATE_SET_RETAINED";
export const SOURCE_BOUND_OUTCOME = "SOURCE_BOUND_NARRATIVE_COMPARISON_ONLY";
export const REPORT_REVIEW_OPEN = "USER_REPORT_PRESERVED_REVIEW_OPEN";
export const COMPARISON_EVIDENCE_INCOMPLETE = "SOURCE_COMPARISON_EVIDENCE_INCOMPLETE";
export const COMPARISON_EVIDENCE_READY = "SOURCE_COMPARISON_READY_FOR_HUMAN_REVIEW_NOT_PROOF";
export const ASSERTION_EVIDENCE_UNKNOWN = "UNKNOWN_NO_ACTOR_EVIDENCE_REFERENCED";
export const ASSERTION_EVIDENCE_REFERENCED = "ACTOR_EVIDENCE_REFERENCED_FOR_REVIEW_NOT_PROOF";
export const PRODUCTION_DUTY_UNBOUND = "NO_SOURCE_BOUND_PRODUCTION_DUTY_IDENTIFIED";
export const PRODUCTION_DUTY_BASIS_BOUND = "PRODUCTION_DUTY_BASIS_BOUND_FOR_HUMAN_APPLICABILITY_REVIEW";

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const SHA256_PATTERN = /^(?:sha256:)?[a-f0-9]{64}$/u;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u;
const EVIDENCE_STATES = new Set(["OBSERVED", "STRONGLY_SUPPORTED", "INFERRED", "UNKNOWN", "NOT_PROVEN", "FALSIFIED"]);
const INDEPENDENT_TIME_SOURCE_TYPES = new Set([
  "INDEPENDENT_TIMESTAMP",
  "PUBLIC_GIT_COMMIT",
  "PUBLIC_RELEASE",
  "PUBLIC_ARCHIVE_TIMESTAMP"
]);
const FUNCTION_MATCH_SOURCE_TYPES = new Set([
  "COMPARISON_RECEIPT",
  "FUNCTION_LEVEL_COMPARISON",
  "INDEPENDENT_TECHNICAL_COMPARISON"
]);
const ACCESS_OR_TRANSFER_SOURCE_TYPES = new Set([
  "ACCESS_RECEIPT",
  "TRANSFER_RECEIPT",
  "SOURCE_ACCESS_TRACE"
]);
const PRODUCTION_DUTY_SOURCE_TYPES = Object.freeze({
  LAW: new Set(["LAW_OR_REGULATION", "JUDICIAL_ORDER"]),
  GOVERNING_PROCESS: new Set(["GOVERNING_PROCESS_RULE"]),
  SOURCE_COMMITMENT: new Set(["SOURCE_DECLARED_PRODUCTION_COMMITMENT"])
});

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requirePlainObject(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain object`);
  return value;
}

function requireAllowedKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${label} contains unknown keys: ${unknown.sort().join(", ")}`);
}

function requireText(value, label) {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new TypeError(`${label} must be an exact non-empty trimmed string`);
  }
  return value;
}

function requireId(value, label) {
  const id = requireText(value, label);
  if (!ID_PATTERN.test(id)) throw new TypeError(`${label} must be an exact ASCII identifier`);
  return id;
}

function requireUniqueIds(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const ids = value.map((item, index) => requireId(item, `${label}[${index}]`));
  if (!allowEmpty && ids.length === 0) throw new TypeError(`${label} must not be empty`);
  if (new Set(ids).size !== ids.length) throw new TypeError(`${label} contains duplicates`);
  return ids;
}

function requireUniqueTexts(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const texts = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(texts).size !== texts.length) throw new TypeError(`${label} contains duplicates`);
  return texts;
}

function requireInstant(value, label) {
  const instant = requireText(value, label);
  if (!DATE_ONLY_PATTERN.test(instant) && !INSTANT_PATTERN.test(instant)) {
    throw new TypeError(`${label} must be an ISO date or timezone-bound instant`);
  }
  const [year, month, day] = instant.slice(0, 10).split("-").map(Number);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year
    || calendarCheck.getUTCMonth() !== month - 1
    || calendarCheck.getUTCDate() !== day
  ) {
    throw new TypeError(`${label} is not a valid calendar date`);
  }
  const time = Date.parse(DATE_ONLY_PATTERN.test(instant) ? `${instant}T00:00:00Z` : instant);
  if (!Number.isFinite(time)) throw new TypeError(`${label} is not a valid instant`);
  return instant;
}

function instantValue(value) {
  return Date.parse(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00Z` : value);
}

function requirePublicUrl(value, label) {
  const text = requireText(value, label);
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new TypeError(`${label} must be an absolute URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError(`${label} must use http or https`);
  }
  return text;
}

function optionalText(record, key, label) {
  if (record[key] !== undefined) requireText(record[key], `${label}.${key}`);
}

function requireStringRecord(value, label) {
  requirePlainObject(value, label);
  for (const [key, item] of Object.entries(value)) {
    requireId(key, `${label} key`);
    requireText(item, `${label}.${key}`);
  }
}

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("receipt contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new TypeError("receipt contains a non-JSON value");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function frozenReceipt(receiptType, payload) {
  const body = { receiptVersion: "1.0.0", receiptType, ...payload };
  const receiptDigest = `sha256:${createHash("sha256").update(canonicalJson(body), "utf8").digest("hex")}`;
  return deepFreeze({ ...body, receiptDigest });
}

function validateSourceDocument(document) {
  requirePlainObject(document, "sourcesDocument");
  requireAllowedKeys(
    document,
    new Set(["schemaVersion", "asOf", "collectionState", "sources", "claimCeiling"]),
    "sourcesDocument"
  );
  if (document.schemaVersion !== "alice-media-sources.v1") {
    throw new TypeError("sourcesDocument.schemaVersion must be alice-media-sources.v1");
  }
  if (document.asOf !== undefined) requireInstant(document.asOf, "sourcesDocument.asOf");
  optionalText(document, "collectionState", "sourcesDocument");
  optionalText(document, "claimCeiling", "sourcesDocument");
  if (!Array.isArray(document.sources)) throw new TypeError("sourcesDocument.sources must be an array");
  const ids = new Set();
  const sources = document.sources.map((source, index) => {
    const label = `sources[${index}]`;
    requirePlainObject(source, label);
    requireAllowedKeys(source, new Set([
      "id", "url", "title", "publisher", "sourceType", "publishedAt", "accessedAt", "scope", "evidenceState",
      "claimBound"
    ]), label);
    const id = requireId(source.id, `${label}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate source id: ${id}`);
    ids.add(id);
    requirePublicUrl(source.url, `${label}.url`);
    requireText(source.title, `${label}.title`);
    requireText(source.publisher, `${label}.publisher`);
    requireText(source.sourceType, `${label}.sourceType`);
    if (source.publishedAt !== undefined) requireInstant(source.publishedAt, `${label}.publishedAt`);
    if (source.accessedAt !== undefined) requireInstant(source.accessedAt, `${label}.accessedAt`);
    optionalText(source, "scope", label);
    optionalText(source, "claimBound", label);
    if (source.evidenceState !== undefined && !EVIDENCE_STATES.has(source.evidenceState)) {
      throw new TypeError(`${label}.evidenceState is not allowed`);
    }
    return { ...source };
  });
  return sources;
}

function validateLocalAnchorDocument(document, sourceMap) {
  requirePlainObject(document, "localAnchorsDocument");
  requireAllowedKeys(
    document,
    new Set([
      "schemaVersion", "capturedAt", "baseRelease", "localAnchors", "requestedReferentStatus", "claimCeiling"
    ]),
    "localAnchorsDocument"
  );
  if (document.schemaVersion !== "alice-local-anchor-receipts.v1") {
    throw new TypeError("localAnchorsDocument.schemaVersion must be alice-local-anchor-receipts.v1");
  }
  if (document.capturedAt !== undefined) requireInstant(document.capturedAt, "localAnchorsDocument.capturedAt");
  if (document.baseRelease !== undefined) requirePublicUrl(document.baseRelease, "localAnchorsDocument.baseRelease");
  if (document.requestedReferentStatus !== undefined) {
    requireStringRecord(document.requestedReferentStatus, "localAnchorsDocument.requestedReferentStatus");
  }
  optionalText(document, "claimCeiling", "localAnchorsDocument");
  if (!Array.isArray(document.localAnchors)) throw new TypeError("localAnchorsDocument.localAnchors must be an array");
  const ids = new Set();
  return document.localAnchors.map((anchor, index) => {
    const label = `localAnchors[${index}]`;
    requirePlainObject(anchor, label);
    requireAllowedKeys(anchor, new Set([
      "id", "label", "sourceRef", "capturedAt", "artifactDigest", "distinctiveFunctionIds", "independentTimeEvidenceRefs",
      "evidenceState", "claimBound"
    ]), label);
    const id = requireId(anchor.id, `${label}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate local anchor id: ${id}`);
    ids.add(id);
    requirePublicUrl(anchor.sourceRef, `${label}.sourceRef`);
    requireInstant(anchor.capturedAt, `${label}.capturedAt`);
    if (!SHA256_PATTERN.test(anchor.artifactDigest)) {
      throw new TypeError(`${label}.artifactDigest must be a lowercase SHA-256 digest with an optional sha256: prefix`);
    }
    const distinctiveFunctionIds = requireUniqueIds(anchor.distinctiveFunctionIds, `${label}.distinctiveFunctionIds`);
    const independentTimeEvidenceRefs = requireUniqueIds(
      anchor.independentTimeEvidenceRefs ?? [],
      `${label}.independentTimeEvidenceRefs`
    );
    for (const ref of independentTimeEvidenceRefs) {
      if (!sourceMap.has(ref)) throw new RangeError(`${label}.independentTimeEvidenceRefs is unknown: ${ref}`);
    }
    optionalText(anchor, "label", label);
    optionalText(anchor, "evidenceState", label);
    optionalText(anchor, "claimBound", label);
    return { ...anchor, distinctiveFunctionIds, independentTimeEvidenceRefs };
  });
}

function validateCandidateDocument(document, sourceMap, anchorMap) {
  requirePlainObject(document, "candidateWorksDocument");
  requireAllowedKeys(
    document,
    new Set([
      "schemaVersion", "sourceExpression", "defaultCandidateWorkId", "identificationState", "candidateWorks",
      "selectionRule", "claimCeiling"
    ]),
    "candidateWorksDocument"
  );
  if (document.schemaVersion !== "alice-media-candidates.v1") {
    throw new TypeError("candidateWorksDocument.schemaVersion must be alice-media-candidates.v1");
  }
  if (document.sourceExpression !== undefined) requireText(document.sourceExpression, "candidateWorksDocument.sourceExpression");
  optionalText(document, "identificationState", "candidateWorksDocument");
  optionalText(document, "selectionRule", "candidateWorksDocument");
  optionalText(document, "claimCeiling", "candidateWorksDocument");
  if (document.defaultCandidateWorkId !== null) {
    throw new TypeError("candidateWorksDocument.defaultCandidateWorkId must be null to prevent implicit referent selection");
  }
  if (!Array.isArray(document.candidateWorks) || document.candidateWorks.length === 0) {
    throw new TypeError("candidateWorksDocument.candidateWorks must be a non-empty array");
  }
  const ids = new Set();
  return document.candidateWorks.map((candidate, index) => {
    const label = `candidateWorks[${index}]`;
    requirePlainObject(candidate, label);
    requireAllowedKeys(candidate, new Set([
      "id", "title", "sourceRefs", "mechanisms", "medium", "period", "markers", "aliceReferent",
      "counterpartReferent", "localAnchorRefs", "distinctiveFunctionIds", "fit", "exclusion"
    ]), label);
    const id = requireId(candidate.id, `${label}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate candidate work id: ${id}`);
    ids.add(id);
    requireText(candidate.title, `${label}.title`);
    const sourceRefs = requireUniqueIds(candidate.sourceRefs, `${label}.sourceRefs`, { allowEmpty: false });
    for (const ref of sourceRefs) {
      if (!sourceMap.has(ref)) throw new RangeError(`${label}.sourceRefs is unknown: ${ref}`);
    }
    const mechanisms = requireUniqueIds(candidate.mechanisms, `${label}.mechanisms`, { allowEmpty: false });
    for (const mechanism of mechanisms) {
      if (!ALLOWED_MECHANISMS.includes(mechanism)) throw new RangeError(`${label}.mechanisms is not allowed: ${mechanism}`);
    }
    const localAnchorRefs = requireUniqueIds(candidate.localAnchorRefs ?? [], `${label}.localAnchorRefs`);
    for (const ref of localAnchorRefs) {
      if (!anchorMap.has(ref)) throw new RangeError(`${label}.localAnchorRefs is unknown: ${ref}`);
    }
    const distinctiveFunctionIds = requireUniqueIds(
      candidate.distinctiveFunctionIds ?? [],
      `${label}.distinctiveFunctionIds`
    );
    optionalText(candidate, "medium", label);
    optionalText(candidate, "period", label);
    optionalText(candidate, "aliceReferent", label);
    optionalText(candidate, "counterpartReferent", label);
    optionalText(candidate, "fit", label);
    optionalText(candidate, "exclusion", label);
    const markers = candidate.markers === undefined ? [] : requireUniqueTexts(candidate.markers, `${label}.markers`);
    return { ...candidate, sourceRefs, mechanisms, localAnchorRefs, distinctiveFunctionIds, markers };
  });
}

function normalizeDataset({ candidateWorksDocument, sourcesDocument, localAnchorsDocument }) {
  const sources = validateSourceDocument(sourcesDocument);
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const localAnchors = validateLocalAnchorDocument(localAnchorsDocument, sourceMap);
  const anchorMap = new Map(localAnchors.map((anchor) => [anchor.id, anchor]));
  const candidateWorks = validateCandidateDocument(candidateWorksDocument, sourceMap, anchorMap);
  const candidateMap = new Map(candidateWorks.map((candidate) => [candidate.id, candidate]));
  return { candidateWorks, candidateMap, sources, sourceMap, localAnchors, anchorMap };
}

function resolveExactIds(ids, map, label) {
  for (const id of ids) {
    if (!map.has(id)) throw new RangeError(`${label} is unknown: ${id}`);
  }
  return ids;
}

export function validateDatasets(documents) {
  requirePlainObject(documents, "documents");
  requireAllowedKeys(
    documents,
    new Set(["candidateWorksDocument", "sourcesDocument", "localAnchorsDocument"]),
    "documents"
  );
  const dataset = normalizeDataset(documents);
  return frozenReceipt("ALICE_MEDIA_DATASET_VALIDATION", {
    candidateWorkIds: dataset.candidateWorks.map(({ id }) => id).sort(),
    sourceIds: dataset.sources.map(({ id }) => id).sort(),
    localAnchorIds: dataset.localAnchors.map(({ id }) => id).sort(),
    allowedMechanisms: [...ALLOWED_MECHANISMS],
    allReferencesResolved: true,
    claimCeiling: "REGISTRY_STRUCTURE_AND_EXACT_REFERENCE_RESOLUTION_ONLY"
  });
}

export function auditAliceMedia({
  candidateWorksDocument,
  sourcesDocument,
  localAnchorsDocument,
  selectedCandidateWorkId,
  selectedLocalAnchorRefs,
  sourceExpression
}) {
  const dataset = normalizeDataset({ candidateWorksDocument, sourcesDocument, localAnchorsDocument });
  const expression = requireText(
    sourceExpression ?? candidateWorksDocument.sourceExpression ?? USER_SOURCE_EXPRESSION,
    "sourceExpression"
  );
  const selectedId = selectedCandidateWorkId === undefined
    ? candidateWorksDocument.defaultCandidateWorkId
    : selectedCandidateWorkId;

  if (selectedId === null) {
    if (selectedLocalAnchorRefs !== undefined) {
      const refs = requireUniqueIds(selectedLocalAnchorRefs, "selectedLocalAnchorRefs");
      resolveExactIds(refs, dataset.anchorMap, "selectedLocalAnchorRefs");
    }
    return frozenReceipt("ALICE_MEDIA_REFERENT_AUDIT", {
      outcome: REFERENT_UNKNOWN_OUTCOME,
      sourceExpression: {
        raw: expression,
        state: "USER_REPORTED_SOURCE_INPUT",
        directMechanismClassification: null
      },
      selectedCandidateWorkId: null,
      candidateWorks: dataset.candidateWorks.map(({ id, title, mechanisms }) => ({ id, title, mechanisms: [...mechanisms] })),
      claimCeiling: "CANDIDATE_SET_AND_SOURCE_EXPRESSION_PRESERVED_NO_REFERENT_SELECTED"
    });
  }

  const candidateId = requireId(selectedId, "selectedCandidateWorkId");
  const candidate = dataset.candidateMap.get(candidateId);
  if (!candidate) throw new RangeError(`selectedCandidateWorkId is unknown: ${candidateId}`);
  const anchorRefs = requireUniqueIds(
    selectedLocalAnchorRefs ?? candidate.localAnchorRefs,
    "selectedLocalAnchorRefs"
  );
  resolveExactIds(anchorRefs, dataset.anchorMap, "selectedLocalAnchorRefs");

  return frozenReceipt("ALICE_MEDIA_REFERENT_AUDIT", {
    outcome: SOURCE_BOUND_OUTCOME,
    sourceExpression: {
      raw: expression,
      state: "USER_REPORTED_SOURCE_INPUT",
      directMechanismClassification: null
    },
    selectedCandidateWorkId: candidate.id,
    selectedCandidateTitle: candidate.title,
    mechanisms: [...candidate.mechanisms],
    boundSourceRefs: [...candidate.sourceRefs],
    boundLocalAnchorRefs: [...anchorRefs],
    classificationMethod: "REGISTERED_CANDIDATE_AND_BOUND_SOURCES_ONLY",
    automaticFindingsExcluded: [
      "DERIVATION_OR_COPYING",
      "AUTHORSHIP",
      "OWNERSHIP",
      "LEGAL_ENTITLEMENT",
      "EXTERNAL_CAUSALITY"
    ],
    claimCeiling: "SOURCE_BOUND_NARRATIVE_MECHANISM_COMPARISON_ONLY"
  });
}

export function assessDerivationOrCopyingReview(input) {
  requirePlainObject(input, "reviewInput");
  requireAllowedKeys(input, new Set([
    "candidateWorksDocument",
    "sourcesDocument",
    "localAnchorsDocument",
    "report",
    "candidateWorkId",
    "comparisonEvidence",
    "positiveAssertions",
    "controlledEvidence"
  ]), "reviewInput");
  const {
    candidateWorksDocument,
    sourcesDocument,
    localAnchorsDocument,
    report,
    candidateWorkId = null,
    comparisonEvidence = {
      earlierLocalAnchorRefs: [],
      distinctiveFunctionMatchSourceRefs: [],
      accessOrTransferSourceRefs: []
    },
    positiveAssertions = [],
    controlledEvidence = []
  } = input;
  const dataset = normalizeDataset({ candidateWorksDocument, sourcesDocument, localAnchorsDocument });
  requirePlainObject(report, "report");
  requireAllowedKeys(report, new Set(["id", "actorId", "statement"]), "report");
  const boundReport = {
    id: requireId(report.id, "report.id"),
    actorId: requireId(report.actorId, "report.actorId"),
    statement: requireText(report.statement, "report.statement"),
    preservationState: "PRESERVED",
    proofEffect: "NONE"
  };

  let candidate = null;
  if (candidateWorkId !== null) {
    const candidateId = requireId(candidateWorkId, "candidateWorkId");
    candidate = dataset.candidateMap.get(candidateId);
    if (!candidate) throw new RangeError(`candidateWorkId is unknown: ${candidateId}`);
  }

  requirePlainObject(comparisonEvidence, "comparisonEvidence");
  requireAllowedKeys(comparisonEvidence, new Set([
    "earlierLocalAnchorRefs",
    "distinctiveFunctionMatchSourceRefs",
    "accessOrTransferSourceRefs"
  ]), "comparisonEvidence");
  const anchorRefs = requireUniqueIds(comparisonEvidence.earlierLocalAnchorRefs, "comparisonEvidence.earlierLocalAnchorRefs");
  const functionRefs = requireUniqueIds(comparisonEvidence.distinctiveFunctionMatchSourceRefs, "comparisonEvidence.distinctiveFunctionMatchSourceRefs");
  const accessRefs = requireUniqueIds(comparisonEvidence.accessOrTransferSourceRefs, "comparisonEvidence.accessOrTransferSourceRefs");
  resolveExactIds(anchorRefs, dataset.anchorMap, "comparisonEvidence.earlierLocalAnchorRefs");
  resolveExactIds(functionRefs, dataset.sourceMap, "comparisonEvidence.distinctiveFunctionMatchSourceRefs");
  resolveExactIds(accessRefs, dataset.sourceMap, "comparisonEvidence.accessOrTransferSourceRefs");

  const candidateTimes = candidate?.sourceRefs
    .map((ref) => dataset.sourceMap.get(ref).publishedAt)
    .filter((value) => value !== undefined)
    .map(instantValue) ?? [];
  const candidateFirstPublication = candidateTimes.length ? Math.min(...candidateTimes) : null;
  const qualifyingAnchors = [];

  if (candidateFirstPublication !== null) {
    for (const anchorId of anchorRefs) {
      const anchor = dataset.anchorMap.get(anchorId);
      const independentTimes = anchor.independentTimeEvidenceRefs
        .map((ref) => dataset.sourceMap.get(ref))
        .filter((source) => INDEPENDENT_TIME_SOURCE_TYPES.has(source.sourceType))
        .map((source) => source.publishedAt)
        .filter((value) => value !== undefined)
        .map(instantValue);
      if (independentTimes.some((time) => time < candidateFirstPublication)) qualifyingAnchors.push(anchorId);
    }
  }

  const qualifyingFunctionRefs = functionRefs.filter((ref) =>
    FUNCTION_MATCH_SOURCE_TYPES.has(dataset.sourceMap.get(ref).sourceType)
  );
  const qualifyingAccessRefs = accessRefs.filter((ref) =>
    ACCESS_OR_TRANSFER_SOURCE_TYPES.has(dataset.sourceMap.get(ref).sourceType)
  );
  const anchorFunctionIds = new Set(
    qualifyingAnchors.flatMap((anchorId) => dataset.anchorMap.get(anchorId).distinctiveFunctionIds)
  );
  const sharedDistinctiveFunctionIds = (candidate?.distinctiveFunctionIds ?? [])
    .filter((id) => anchorFunctionIds.has(id))
    .sort();

  const evidenceGaps = candidate === null
    ? ["EXACT_CANDIDATE_REFERENT"]
    : [
        ...(candidateFirstPublication === null ? ["CANDIDATE_PUBLICATION_TIME_SOURCE"] : []),
        ...(qualifyingAnchors.length ? [] : ["EARLIER_INDEPENDENTLY_TIME_BOUND_LOCAL_ARTIFACT"]),
        ...(qualifyingFunctionRefs.length && sharedDistinctiveFunctionIds.length
          ? []
          : ["DISTINCTIVE_FUNCTION_MATCH_EVIDENCE"]),
        ...(qualifyingAccessRefs.length ? [] : ["ACCESS_OR_TRANSFER_EVIDENCE"])
      ];

  if (!Array.isArray(positiveAssertions)) throw new TypeError("positiveAssertions must be an array");
  const assertionIds = new Set();
  const assertionAssessments = positiveAssertions.map((assertion, index) => {
    const label = `positiveAssertions[${index}]`;
    requirePlainObject(assertion, label);
    requireAllowedKeys(assertion, new Set(["id", "actorId", "statement", "sourceRefs", "localAnchorRefs"]), label);
    const id = requireId(assertion.id, `${label}.id`);
    if (assertionIds.has(id)) throw new TypeError(`duplicate positive assertion id: ${id}`);
    assertionIds.add(id);
    const actorId = requireId(assertion.actorId, `${label}.actorId`);
    const sourceRefs = requireUniqueIds(assertion.sourceRefs, `${label}.sourceRefs`);
    const localAnchorRefs = requireUniqueIds(assertion.localAnchorRefs, `${label}.localAnchorRefs`);
    resolveExactIds(sourceRefs, dataset.sourceMap, `${label}.sourceRefs`);
    resolveExactIds(localAnchorRefs, dataset.anchorMap, `${label}.localAnchorRefs`);
    return {
      id,
      actorId,
      statement: requireText(assertion.statement, `${label}.statement`),
      sourceRefs,
      localAnchorRefs,
      evidenceResponsibilityActorId: actorId,
      evidenceReferenceState: sourceRefs.length || localAnchorRefs.length
        ? ASSERTION_EVIDENCE_REFERENCED
        : ASSERTION_EVIDENCE_UNKNOWN,
      truthFinding: "NOT_EVALUATED"
    };
  });

  if (!Array.isArray(controlledEvidence)) throw new TypeError("controlledEvidence must be an array");
  const controlledEvidenceIds = new Set();
  const controlledEvidenceAssessments = controlledEvidence.map((item, index) => {
    const label = `controlledEvidence[${index}]`;
    requirePlainObject(item, label);
    requireAllowedKeys(item, new Set([
      "id",
      "controllerActorId",
      "evidenceKind",
      "declaredAvailableToActorIds",
      "productionDutyBasis"
    ]), label);
    const id = requireId(item.id, `${label}.id`);
    if (controlledEvidenceIds.has(id)) throw new TypeError(`duplicate controlled evidence id: ${id}`);
    controlledEvidenceIds.add(id);
    const controllerActorId = requireId(item.controllerActorId, `${label}.controllerActorId`);
    const declaredAvailableToActorIds = requireUniqueIds(
      item.declaredAvailableToActorIds,
      `${label}.declaredAvailableToActorIds`
    );
    let productionDutyState = PRODUCTION_DUTY_UNBOUND;
    let productionDutyBasis = null;
    if (item.productionDutyBasis !== undefined && item.productionDutyBasis !== null) {
      requirePlainObject(item.productionDutyBasis, `${label}.productionDutyBasis`);
      requireAllowedKeys(item.productionDutyBasis, new Set(["type", "sourceRef", "scope"]), `${label}.productionDutyBasis`);
      const type = requireText(item.productionDutyBasis.type, `${label}.productionDutyBasis.type`);
      if (!Object.hasOwn(PRODUCTION_DUTY_SOURCE_TYPES, type)) {
        throw new TypeError(`${label}.productionDutyBasis.type is unsupported`);
      }
      const sourceRef = requireId(item.productionDutyBasis.sourceRef, `${label}.productionDutyBasis.sourceRef`);
      resolveExactIds([sourceRef], dataset.sourceMap, `${label}.productionDutyBasis.sourceRef`);
      const sourceType = dataset.sourceMap.get(sourceRef).sourceType;
      if (!PRODUCTION_DUTY_SOURCE_TYPES[type].has(sourceType)) {
        throw new TypeError(`${label}.productionDutyBasis source type is incompatible with ${type}`);
      }
      productionDutyBasis = {
        type,
        sourceRef,
        scope: requireText(item.productionDutyBasis.scope, `${label}.productionDutyBasis.scope`)
      };
      productionDutyState = PRODUCTION_DUTY_BASIS_BOUND;
    }
    return {
      id,
      controllerActorId,
      evidenceKind: requireId(item.evidenceKind, `${label}.evidenceKind`),
      declaredAvailableToActorIds,
      reporterAccessState: declaredAvailableToActorIds.includes(boundReport.actorId)
        ? "IN_DECLARED_AVAILABLE_ACTORS"
        : "OUTSIDE_DECLARED_AVAILABLE_ACTORS",
      productionDutyBasis,
      productionDutyState,
      productionDutyFinding: "NOT_EVALUATED",
      nonProductionEffect: "NO_AUTOMATIC_ADVERSE_INFERENCE"
    };
  });

  return frozenReceipt("ALICE_RECIPROCAL_DERIVATION_OR_COPYING_REVIEW_V2", {
    receiptVersion: "2.0.0",
    state: REPORT_REVIEW_OPEN,
    report: boundReport,
    candidateWorkId: candidate?.id ?? null,
    meritsState: "UNKNOWN",
    comparisonReadiness: evidenceGaps.length
      ? COMPARISON_EVIDENCE_INCOMPLETE
      : COMPARISON_EVIDENCE_READY,
    evidenceGaps,
    comparisonEvidenceAssessment: {
      qualifyingEarlierLocalAnchorRefs: qualifyingAnchors,
      sharedDistinctiveFunctionIds,
      distinctiveFunctionMatchSourceRefs: qualifyingFunctionRefs,
      accessOrTransferSourceRefs: qualifyingAccessRefs,
      nonQualifyingDistinctiveFunctionMatchSourceRefs: functionRefs.filter((ref) => !qualifyingFunctionRefs.includes(ref)),
      nonQualifyingAccessOrTransferSourceRefs: accessRefs.filter((ref) => !qualifyingAccessRefs.includes(ref))
    },
    assertionAssessments,
    controlledEvidenceAssessments,
    automaticProof: false,
    automaticFaultFinding: false,
    automaticAdverseInference: false,
    automaticClaimRejection: false,
    automaticOwnershipFinding: false,
    automaticFindingsExcluded: [
      "COPYING_PROVEN",
      "AUTHORSHIP_PROVEN",
      "OWNERSHIP",
      "LEGAL_ENTITLEMENT",
      "FAULT",
      "ADVERSE_INFERENCE",
      "CLAIM_REJECTION"
    ],
    phaseOrder: [
      "PRESERVE_REPORT",
      "MAP_ACTOR_ASSERTIONS",
      "MAP_EVIDENCE_ACCESS_AND_CONTROL",
      "BIND_APPLICABLE_PROCEDURAL_BASIS",
      "HUMAN_SOURCE_AND_MERITS_REVIEW"
    ],
    claimCeiling: "REPORT_PRESERVATION_AND_RECIPROCAL_EVIDENCE_ROUTING_ONLY_NOT_WRONGDOING_TRUTH_FAULT_ADVERSE_INFERENCE_PRODUCTION_DUTY_AUTHORSHIP_OWNERSHIP_OR_LEGAL_ENTITLEMENT_FINDING"
  });
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function defaultDocuments() {
  const branchRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  return {
    candidateWorksDocument: loadJson(path.join(branchRoot, "candidate-works.json")),
    localAnchorsDocument: loadJson(path.join(branchRoot, "local-anchors.json")),
    sourcesDocument: loadJson(path.join(branchRoot, "sources.json"))
  };
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const validArgs = args.length === 0 || (args.length === 2 && args[0] === "--candidate");
    if (!validArgs) {
      throw new TypeError("usage: node src/media-audit.mjs [--candidate EXACT_WORK_ID]");
    }
    const documents = defaultDocuments();
    const selectedCandidateWorkId = args.length === 2 ? args[1] : undefined;
    const receipt = auditAliceMedia({ ...documents, selectedCandidateWorkId });
    console.log(JSON.stringify({
      outcome: receipt.outcome,
      sourceExpression: receipt.sourceExpression.raw,
      selectedCandidateWorkId: receipt.selectedCandidateWorkId,
      candidateWorkIds: receipt.candidateWorks?.map(({ id }) => id) ?? [receipt.selectedCandidateWorkId],
      claimCeiling: receipt.claimCeiling
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
