import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DERIVATION_STATES = Object.freeze({
  REPORT_REVIEW_OPEN: "USER_REPORT_PRESERVED_REVIEW_OPEN",
  COMPARISON_INCOMPLETE: "SOURCE_COMPARISON_EVIDENCE_INCOMPLETE",
  COMPARISON_READY: "SOURCE_COMPARISON_READY_FOR_HUMAN_REVIEW_NOT_PROOF",
  COVERAGE_UNKNOWN: "COVERAGE_UNKNOWN",
  // Deprecated compatibility constants. assessDerivation() no longer returns
  // these one-dimensional states.
  NOT_PROVEN: "NOT_PROVEN_NO_ACCESS_AND_DISTINCTIVE_MATCH",
  REVIEW: "REVIEW_REQUIRED_NO_AUTOMATIC_DERIVATION_FINDING"
});

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireUniqueTextArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const normalized = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(normalized).size !== normalized.length) throw new TypeError(`${label} contains duplicates`);
  return normalized;
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function sourceMapFromDocuments(sourcesDocument, localReceiptDocument) {
  requireObject(sourcesDocument, "sourcesDocument");
  requireObject(localReceiptDocument, "localReceiptDocument");
  const entries = [
    ...(Array.isArray(sourcesDocument.sources) ? sourcesDocument.sources : []),
    ...(Array.isArray(localReceiptDocument.receipts) ? localReceiptDocument.receipts : [])
  ];
  if (entries.length === 0) throw new TypeError("source registry must contain source records");
  const sourceMap = new Map();
  for (const [index, entry] of entries.entries()) {
    requireObject(entry, `sourceRegistry[${index}]`);
    const id = requireText(entry.id, `sourceRegistry[${index}].id`);
    if (sourceMap.has(id)) throw new TypeError(`duplicate source id: ${id}`);
    sourceMap.set(id, entry);
  }
  return sourceMap;
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
  requireObject(report, "report");
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
  return value.map((entry, index) => {
    const itemLabel = `${label}[${index}]`;
    requireObject(entry, itemLabel);
    const id = requireText(entry.id, `${itemLabel}.id`);
    if (ids.has(id)) throw new TypeError(`${label} contains duplicate evidence id: ${id}`);
    ids.add(id);
    const sourceRef = requireText(entry.sourceRef, `${itemLabel}.sourceRef`);
    if (!sourceMap.has(sourceRef)) throw new RangeError(`${itemLabel}.sourceRef is unknown: ${sourceRef}`);
    return {
      id,
      sourceRef,
      assertingActorId: requireText(entry.assertingActorId, `${itemLabel}.assertingActorId`),
      controllerActorId: requireText(entry.controllerActorId, `${itemLabel}.controllerActorId`)
    };
  });
}

function bindLegacyRefs(values, label) {
  return requireUniqueTextArray(values, label);
}

export function validateMatrix(matrix) {
  if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
    throw new TypeError("matrix must be an object");
  }
  if (!Array.isArray(matrix.systems) || matrix.systems.length < 2) {
    throw new TypeError("matrix.systems must contain at least two systems");
  }
  const ids = new Set();
  for (const [index, system] of matrix.systems.entries()) {
    const id = requireText(system.id, `systems[${index}].id`);
    if (ids.has(id)) throw new TypeError(`duplicate system id: ${id}`);
    ids.add(id);
    requireText(system.label, `systems[${index}].label`);
    requireUniqueTextArray(system.sourceIds, `systems[${index}].sourceIds`);
    requireUniqueTextArray(system.exactFeatureIds, `systems[${index}].exactFeatureIds`);
    requireUniqueTextArray(system.broadMotifIds, `systems[${index}].broadMotifIds`);
  }
  return matrix;
}

function systemById(matrix, id) {
  const found = matrix.systems.find((system) => system.id === id);
  if (!found) throw new RangeError(`unknown system id: ${id}`);
  return found;
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).sort();
}

export function compareSystems(matrix, leftId, rightId) {
  validateMatrix(matrix);
  if (leftId === rightId) throw new RangeError("comparison requires two different systems");
  const left = systemById(matrix, leftId);
  const right = systemById(matrix, rightId);
  const exactSharedFeatureIds = intersection(left.exactFeatureIds, right.exactFeatureIds);
  const sharedBroadMotifIds = intersection(left.broadMotifIds, right.broadMotifIds);
  return {
    leftId,
    rightId,
    exactSharedFeatureIds,
    sharedBroadMotifIds,
    overlapState: exactSharedFeatureIds.length
      ? "EXACT_FEATURE_OVERLAP_REQUIRES_FUNCTION_AND_PROVENANCE_REVIEW"
      : sharedBroadMotifIds.length
        ? "BROAD_MOTIF_OVERLAP_ONLY"
        : "NO_REGISTERED_OVERLAP",
    semantics: "OVERLAP_DOES_NOT_ESTABLISH_ACCESS_DERIVATION_COPYING_INVENTORSHIP_OR_PAYMENT"
  };
}

export function assessDerivation({
  comparison,
  report,
  sourcesDocument = loadDefaultSources(),
  localReceiptDocument = loadDefaultLocalReceipts(),
  comparisonEvidence = {},
  accessEvidenceIds = [],
  distinctiveMatchEvidenceIds = []
}) {
  requireObject(comparison, "comparison");
  const sourceMap = sourceMapFromDocuments(sourcesDocument, localReceiptDocument);
  if (!Array.isArray(accessEvidenceIds)) throw new TypeError("accessEvidenceIds must be an array");
  if (!Array.isArray(distinctiveMatchEvidenceIds)) {
    throw new TypeError("distinctiveMatchEvidenceIds must be an array");
  }
  const legacyInputUsed = accessEvidenceIds.length > 0 || distinctiveMatchEvidenceIds.length > 0;
  const boundReport = bindReport(report, legacyInputUsed);
  requireObject(comparisonEvidence, "comparisonEvidence");
  const accessEvidence = bindEvidenceRecords(
    comparisonEvidence.accessEvidence ?? [],
    "comparisonEvidence.accessEvidence",
    sourceMap
  );
  const distinctiveMatchEvidence = bindEvidenceRecords(
    comparisonEvidence.distinctiveMatchEvidence ?? [],
    "comparisonEvidence.distinctiveMatchEvidence",
    sourceMap
  );
  const evidenceGaps = [
    ...(accessEvidence.length ? [] : ["SOURCE_BOUND_ACCESS_EVIDENCE"]),
    ...(distinctiveMatchEvidence.length ? [] : ["DISTINCTIVE_FUNCTION_LEVEL_MATCH_EVIDENCE"])
  ];
  const legacyUnboundEvidenceRefs = legacyInputUsed ? {
    accessEvidenceIds: bindLegacyRefs(accessEvidenceIds, "accessEvidenceIds"),
    distinctiveMatchEvidenceIds: bindLegacyRefs(
      distinctiveMatchEvidenceIds,
      "distinctiveMatchEvidenceIds"
    ),
    state: "DEPRECATED_UNBOUND_EVIDENCE_REFS_NOT_USED_FOR_READINESS"
  } : null;

  return {
    receiptVersion: "2.0.0",
    state: DERIVATION_STATES.REPORT_REVIEW_OPEN,
    report: boundReport,
    comparison: {
      leftId: requireText(comparison.leftId, "comparison.leftId"),
      rightId: requireText(comparison.rightId, "comparison.rightId")
    },
    meritsState: "UNKNOWN",
    comparisonReadiness: evidenceGaps.length
      ? DERIVATION_STATES.COMPARISON_INCOMPLETE
      : DERIVATION_STATES.COMPARISON_READY,
    controlledAccessState: accessEvidence.length
      ? "SOURCE_BOUND_ACCESS_RECORD_REFERENCED_FOR_HUMAN_REVIEW_NOT_PROOF"
      : DERIVATION_STATES.COVERAGE_UNKNOWN,
    evidenceGaps,
    evidence: { accessEvidence, distinctiveMatchEvidence },
    legacyInputState: legacyInputUsed ? "DEPRECATED_UNBOUND_LEGACY_INPUT" : "NONE",
    legacyUnboundEvidenceRefs,
    automaticProof: false,
    automaticDerivationFinding: false,
    automaticIndependentDevelopmentFinding: false,
    automaticFaultFinding: false,
    automaticAdverseInference: false,
    automaticClaimRejection: false,
    semantics: "REPORT_IS_PRESERVED_AND_REVIEW_OPEN_WHILE_EVIDENCE_ONLY_CHANGES_COMPARISON_READINESS"
  };
}

export function preserveIdentifier(value) {
  return requireText(value, "identifier");
}

function loadDefaultMatrix() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, "component-matrix.json"), "utf8"));
}

function loadDefaultSources() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, "sources.json"), "utf8"));
}

function loadDefaultLocalReceipts() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, "local-source-receipt.json"), "utf8"));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  const [leftId, rightId] = process.argv.slice(2);
  if (!leftId || !rightId) {
    console.error("usage: node audit-lens.mjs <left-system-id> <right-system-id>");
    process.exit(1);
  }
  try {
    const comparison = compareSystems(loadDefaultMatrix(), leftId, rightId);
    console.log(JSON.stringify({
      comparison,
      derivation: assessDerivation({ comparison })
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
