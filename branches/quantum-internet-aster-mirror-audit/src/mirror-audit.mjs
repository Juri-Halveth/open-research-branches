import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CURRENT_OUTCOME = "NO_CHECKMATE_REFERENTS_SEPARATED_HYPOTHESIS_PRESERVED";
export const REPORT_REVIEW_OPEN = "USER_REPORT_PRESERVED_REVIEW_OPEN";
export const COMPARISON_EVIDENCE_INCOMPLETE = "SOURCE_COMPARISON_EVIDENCE_INCOMPLETE";
export const COMPARISON_EVIDENCE_READY = "SOURCE_COMPARISON_READY_FOR_HUMAN_REVIEW_NOT_PROOF";
export const COVERAGE_UNKNOWN = "COVERAGE_UNKNOWN";

const DEFAULT_PROVENANCE_TARGET_IDS = Object.freeze([
  "ASTAR_NETWORK",
  "OPENAI_GPT6_ASTRA",
  "QUANTUM_INTERNET_RESEARCH_STACK"
]);

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireUniqueTextArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const items = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(items).size !== items.length) throw new TypeError(`${label} contains duplicates`);
  return items;
}

function requirePlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function sourceMapFromDocument(sourcesDocument) {
  requirePlainObject(sourcesDocument, "sourcesDocument");
  const map = new Map();
  for (const [groupName, entries] of Object.entries(sourcesDocument)) {
    if (!Array.isArray(entries)) continue;
    for (const [index, entry] of entries.entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || !("id" in entry)) continue;
      const id = requireText(entry.id, `sourcesDocument.${groupName}[${index}].id`);
      if (map.has(id)) throw new TypeError(`duplicate source id: ${id}`);
      map.set(id, entry);
    }
  }
  if (map.size === 0) throw new TypeError("sourcesDocument must contain at least one source record");
  return map;
}

function bindReport(report, legacyInputUsed) {
  if (report === undefined) {
    return {
      id: "LEGACY_UNBOUND_DERIVATION_QUERY",
      actorId: "LEGACY_CALLER_UNBOUND",
      statement: "Legacy derivation query without a separately bound report.",
      preservationState: "PRESERVED_AS_LEGACY_QUERY",
      proofEffect: "NONE",
      deprecation: "SUPPLY_REPORT_ID_ACTOR_AND_RAW_STATEMENT"
    };
  }
  requirePlainObject(report, "report");
  return {
    id: requireText(report.id, "report.id"),
    actorId: requireText(report.actorId, "report.actorId"),
    statement: requireText(report.statement, "report.statement"),
    preservationState: "PRESERVED",
    proofEffect: "NONE",
    ...(legacyInputUsed ? { deprecation: "LEGACY_EVIDENCE_ARRAYS_ARE_UNBOUND_AND_DO_NOT_QUALIFY" } : {})
  };
}

function bindEvidenceRecords(value, label, sourceMap) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const ids = new Set();
  return value.map((item, index) => {
    const itemLabel = `${label}[${index}]`;
    requirePlainObject(item, itemLabel);
    const id = requireText(item.id, `${itemLabel}.id`);
    if (ids.has(id)) throw new TypeError(`${label} contains duplicate evidence id: ${id}`);
    ids.add(id);
    const sourceRef = requireText(item.sourceRef, `${itemLabel}.sourceRef`);
    if (!sourceMap.has(sourceRef)) throw new RangeError(`${itemLabel}.sourceRef is unknown: ${sourceRef}`);
    return {
      id,
      sourceRef,
      assertingActorId: requireText(item.assertingActorId, `${itemLabel}.assertingActorId`),
      controllerActorId: requireText(item.controllerActorId, `${itemLabel}.controllerActorId`)
    };
  });
}

function legacyRefs(values, label) {
  return requireUniqueTextArray(values, label);
}

function loadSources() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", "sources.json"), "utf8"));
}

export function validateMatrix(matrix) {
  if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
    throw new TypeError("matrix must be an object");
  }
  if (!Array.isArray(matrix.systems) || matrix.systems.length < 3) {
    throw new TypeError("matrix.systems must contain at least three systems");
  }
  const ids = new Set();
  for (const [index, system] of matrix.systems.entries()) {
    const prefix = `systems[${index}]`;
    const id = requireText(system.id, `${prefix}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate system id: ${id}`);
    ids.add(id);
    requireText(system.label, `${prefix}.label`);
    requireText(system.namespace, `${prefix}.namespace`);
    requireText(system.kind, `${prefix}.kind`);
    requireText(system.firstBoundAnchor, `${prefix}.firstBoundAnchor`);
    requireUniqueTextArray(system.sourceIds, `${prefix}.sourceIds`);
    requireUniqueTextArray(system.exactFunctionIds, `${prefix}.exactFunctionIds`);
    requireUniqueTextArray(system.broadMotifIds, `${prefix}.broadMotifIds`);
  }
  return matrix;
}

function findSystem(matrix, id) {
  const system = matrix.systems.find((entry) => entry.id === id);
  if (!system) throw new RangeError(`unknown system id: ${id}`);
  return system;
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).sort();
}

export function comparePair(matrix, leftId, rightId) {
  validateMatrix(matrix);
  if (leftId === rightId) throw new RangeError("pair requires two distinct systems");
  const left = findSystem(matrix, leftId);
  const right = findSystem(matrix, rightId);
  const exactSharedFunctionIds = intersection(left.exactFunctionIds, right.exactFunctionIds);
  const sharedBroadMotifIds = intersection(left.broadMotifIds, right.broadMotifIds);
  return {
    leftId,
    rightId,
    sameNamespace: left.namespace === right.namespace,
    sameKind: left.kind === right.kind,
    exactSharedFunctionIds,
    sharedBroadMotifIds,
    overlapState: exactSharedFunctionIds.length
      ? "EXACT_FUNCTION_OVERLAP_REQUIRES_SOURCE_REVIEW"
      : sharedBroadMotifIds.length
        ? "BROAD_MOTIF_OVERLAP_ONLY"
        : "NO_REGISTERED_OVERLAP",
    semantics: "NAME_OR_MOTIF_OVERLAP_IS_NOT_IDENTITY_ACCESS_DERIVATION_COPYING_AUTHORSHIP_OR_PAYMENT"
  };
}

export function threeWayAudit(matrix, systemIds) {
  validateMatrix(matrix);
  const ids = requireUniqueTextArray(systemIds, "systemIds");
  if (ids.length !== 3) throw new RangeError("three-way audit requires exactly three distinct systems");
  ids.forEach((id) => findSystem(matrix, id));
  const pairs = [];
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      pairs.push(comparePair(matrix, ids[left], ids[right]));
    }
  }
  return {
    systemIds: ids,
    pairs,
    pairCount: pairs.length,
    outcome: CURRENT_OUTCOME,
    reason: "The registered comparisons keep each referent separate; provenance review and comparison readiness are evaluated independently for each target."
  };
}

export function assessDerivation(input = {}) {
  requirePlainObject(input, "input");
  const {
    matrix = loadMatrix(),
    sourcesDocument = loadSources(),
    report,
    targetEvidence = [],
    earlierPublicArtifactEvidenceIds = [],
    distinctiveFunctionMatchEvidenceIds = [],
    accessOrTransferEvidenceIds = [],
    targetSystemId
  } = input;
  validateMatrix(matrix);
  const sourceMap = sourceMapFromDocument(sourcesDocument);
  if (!Array.isArray(earlierPublicArtifactEvidenceIds)) {
    throw new TypeError("earlierPublicArtifactEvidenceIds must be an array");
  }
  if (!Array.isArray(distinctiveFunctionMatchEvidenceIds)) {
    throw new TypeError("distinctiveFunctionMatchEvidenceIds must be an array");
  }
  if (!Array.isArray(accessOrTransferEvidenceIds)) {
    throw new TypeError("accessOrTransferEvidenceIds must be an array");
  }
  const legacyInputUsed = targetSystemId !== undefined
    || earlierPublicArtifactEvidenceIds.length > 0
    || distinctiveFunctionMatchEvidenceIds.length > 0
    || accessOrTransferEvidenceIds.length > 0;
  const boundReport = bindReport(report, legacyInputUsed);

  if (!Array.isArray(targetEvidence)) throw new TypeError("targetEvidence must be an array");
  const evidenceByTarget = new Map();
  for (const [index, entry] of targetEvidence.entries()) {
    const label = `targetEvidence[${index}]`;
    requirePlainObject(entry, label);
    const targetId = requireText(entry.targetSystemId, `${label}.targetSystemId`);
    if (targetId === "LUCINET_ASTER") throw new RangeError(`${label}.targetSystemId cannot be the source system`);
    findSystem(matrix, targetId);
    if (evidenceByTarget.has(targetId)) throw new TypeError(`duplicate target evidence: ${targetId}`);
    evidenceByTarget.set(targetId, {
      earlierArtifacts: bindEvidenceRecords(entry.earlierArtifacts ?? [], `${label}.earlierArtifacts`, sourceMap),
      distinctiveFunctionMatches: bindEvidenceRecords(
        entry.distinctiveFunctionMatches ?? [],
        `${label}.distinctiveFunctionMatches`,
        sourceMap
      ),
      accessOrTransfers: bindEvidenceRecords(entry.accessOrTransfers ?? [], `${label}.accessOrTransfers`, sourceMap)
    });
  }

  const targetIds = DEFAULT_PROVENANCE_TARGET_IDS.filter((id) => matrix.systems.some((system) => system.id === id));
  if (targetIds.length !== DEFAULT_PROVENANCE_TARGET_IDS.length) {
    throw new TypeError("matrix is missing one or more default provenance targets");
  }

  let legacyUnboundEvidenceRefs = null;
  if (legacyInputUsed) {
    const legacyTargetId = targetSystemId === undefined
      ? "OPENAI_GPT6_ASTRA"
      : requireText(targetSystemId, "targetSystemId");
    findSystem(matrix, legacyTargetId);
    legacyUnboundEvidenceRefs = {
      targetSystemId: legacyTargetId,
      earlierPublicArtifactEvidenceIds: legacyRefs(
        earlierPublicArtifactEvidenceIds,
        "earlierPublicArtifactEvidenceIds"
      ),
      distinctiveFunctionMatchEvidenceIds: legacyRefs(
        distinctiveFunctionMatchEvidenceIds,
        "distinctiveFunctionMatchEvidenceIds"
      ),
      accessOrTransferEvidenceIds: legacyRefs(
        accessOrTransferEvidenceIds,
        "accessOrTransferEvidenceIds"
      ),
      state: "DEPRECATED_UNBOUND_EVIDENCE_REFS_NOT_USED_FOR_READINESS"
    };
  }

  const targetAssessments = targetIds.map((targetId) => {
    const evidence = evidenceByTarget.get(targetId) ?? {
      earlierArtifacts: [],
      distinctiveFunctionMatches: [],
      accessOrTransfers: []
    };
    const evidenceGaps = [
      ...(evidence.earlierArtifacts.length ? [] : ["EARLIER_PUBLIC_OR_INDEPENDENTLY_TIMESTAMPED_ARTIFACT"]),
      ...(evidence.distinctiveFunctionMatches.length ? [] : ["DISTINCTIVE_FUNCTION_LEVEL_MATCH"]),
      ...(evidence.accessOrTransfers.length ? [] : ["SOURCE_BOUND_ACCESS_OR_TRANSFER_TRACE"])
    ];
    return {
      targetSystemId: targetId,
      reportReviewState: REPORT_REVIEW_OPEN,
      meritsState: "UNKNOWN",
      comparisonReadiness: evidenceGaps.length
        ? COMPARISON_EVIDENCE_INCOMPLETE
        : COMPARISON_EVIDENCE_READY,
      controlledAccessState: evidence.accessOrTransfers.length
        ? "SOURCE_BOUND_ACCESS_RECORD_REFERENCED_FOR_HUMAN_REVIEW_NOT_PROOF"
        : COVERAGE_UNKNOWN,
      evidenceGaps,
      evidence,
      automaticIndependentDevelopmentFinding: false,
      automaticDerivationFinding: false,
      automaticClaimRejection: false
    };
  });

  return {
    receiptVersion: "2.0.0",
    state: REPORT_REVIEW_OPEN,
    report: boundReport,
    targetAssessments,
    legacyInputState: legacyInputUsed ? "DEPRECATED_UNBOUND_LEGACY_INPUT" : "NONE",
    legacyUnboundEvidenceRefs,
    meritsState: "UNKNOWN",
    automaticProof: false,
    automaticFaultFinding: false,
    automaticAdverseInference: false,
    automaticClaimRejection: false,
    automaticIndependentDevelopmentFinding: false,
    outcome: CURRENT_OUTCOME,
    claimCeiling: "REPORT_PRESERVATION_AND_THREE_TARGET_RECIPROCAL_PROVENANCE_REVIEW_ONLY_NOT_DERIVATION_INDEPENDENCE_COPYING_CO_DEVELOPMENT_OWNERSHIP_RIGHTS_OR_PAYMENT_FINDING"
  };
}

export function classifyInternationalEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new TypeError("entry must be an object");
  }
  requireText(entry.name, "entry.name");
  requireText(entry.scope, "entry.scope");
  const sourceIds = requireUniqueTextArray(entry.sourceIds ?? [], "entry.sourceIds");
  return {
    name: entry.name,
    scope: entry.scope,
    state: sourceIds.length ? "SOURCE_BOUND_CONTRIBUTION_WITHIN_SCOPE" : "OPEN_CONTRIBUTION_APERTURE",
    sourceIds,
    semantics: "A_NAMED_COUNTRY_PERSON_OR_ERA_IS_NOT_UNIVERSAL_AUTHORSHIP_CONSENT_OR_OWNERSHIP"
  };
}

function loadMatrix() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", "model-matrix.json"), "utf8"));
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked && invoked === fileURLToPath(import.meta.url)) {
  try {
    const ids = process.argv.slice(2);
    const matrix = loadMatrix();
    const result = threeWayAudit(matrix, ids.length ? ids : matrix.defaultThreeWay);
    console.log(JSON.stringify({ result, derivation: assessDerivation() }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
