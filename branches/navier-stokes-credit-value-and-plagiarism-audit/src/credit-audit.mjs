import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLAIM_TYPES = new Set([
  "PROOF_CORRECTNESS",
  "IDEA_PRIORITY",
  "TEXT_COPYING",
  "PRIVATE_ACCESS",
  "PRIVATE_USE",
  "SCIENTIFIC_CREDIT",
  "COPYRIGHT",
  "CONFIDENTIALITY",
  "CLAY_PRIZE",
  "SCIENTIFIC_VALUE",
  "ECONOMIC_VALUE"
]);

const EVIDENCE_STATES = new Set([
  "OBSERVED",
  "STRONGLY_SUPPORTED",
  "INFERRED",
  "UNKNOWN",
  "NOT_PROVEN"
]);

function cleanText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function bindReportSource(reportSource, referent, legacySourceIds) {
  if (reportSource === undefined) {
    if (legacySourceIds.length === 0) {
      throw new TypeError("reportSource is required when legacy sourceIds are absent");
    }
    return Object.freeze({
      id: "LEGACY_MULTISOURCE_CLAIM_REPORT",
      actorId: "LEGACY_CALLER_UNBOUND",
      statement: referent,
      preservationState: "PRESERVED_AS_LEGACY_REPORT",
      proofEffect: "NONE",
      deprecation: "SUPPLY_REPORT_SOURCE_SEPARATELY_FROM_SUPPORTING_EVIDENCE"
    });
  }
  if (!reportSource || typeof reportSource !== "object" || Array.isArray(reportSource)) {
    throw new TypeError("reportSource must be an object");
  }
  return Object.freeze({
    id: cleanText(reportSource.id, "reportSource.id"),
    actorId: cleanText(reportSource.actorId, "reportSource.actorId"),
    statement: cleanText(reportSource.statement, "reportSource.statement"),
    preservationState: "PRESERVED",
    proofEffect: "NONE"
  });
}

function sourceIdSet(sourcesDocument) {
  if (!sourcesDocument || typeof sourcesDocument !== "object" || Array.isArray(sourcesDocument)) {
    throw new TypeError("sourcesDocument must be an object");
  }
  if (!Array.isArray(sourcesDocument.sources) || sourcesDocument.sources.length === 0) {
    throw new TypeError("sourcesDocument.sources must be a non-empty array");
  }
  const ids = new Set();
  for (const [index, source] of sourcesDocument.sources.entries()) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new TypeError(`sourcesDocument.sources[${index}] must be an object`);
    }
    const id = cleanText(source.id, `sourcesDocument.sources[${index}].id`);
    if (ids.has(id)) throw new TypeError(`duplicate source id: ${id}`);
    ids.add(id);
  }
  return ids;
}

function loadSourcesDocument() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", "sources.json"), "utf8"));
}

function bindSupportingEvidence(value, knownSourceIds) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError("supportingEvidence must be an array");
  const ids = new Set();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError(`supportingEvidence[${index}] must be an object`);
    }
    const id = cleanText(entry.id, `supportingEvidence[${index}].id`);
    if (ids.has(id)) throw new TypeError(`duplicate supporting evidence id: ${id}`);
    ids.add(id);
    const sourceId = cleanText(entry.sourceId, `supportingEvidence[${index}].sourceId`);
    if (!knownSourceIds.has(sourceId)) {
      throw new RangeError(`supportingEvidence[${index}].sourceId is unknown: ${sourceId}`);
    }
    return Object.freeze({
      id,
      sourceId,
      assertingActorId: cleanText(
        entry.assertingActorId,
        `supportingEvidence[${index}].assertingActorId`
      ),
      controllerActorId: cleanText(
        entry.controllerActorId,
        `supportingEvidence[${index}].controllerActorId`
      )
    });
  });
}

export function bindClaim(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }
  if (!CLAIM_TYPES.has(input.claimType)) {
    throw new TypeError("claimType is unsupported");
  }
  if (!EVIDENCE_STATES.has(input.evidenceState)) {
    throw new TypeError("evidenceState is unsupported");
  }
  const legacySourceIds = Array.isArray(input.sourceIds)
    ? input.sourceIds.map((id) => cleanText(id, "sourceIds item"))
    : [];
  if (input.sourceIds !== undefined && !Array.isArray(input.sourceIds)) {
    throw new TypeError("sourceIds must be an array when supplied");
  }
  if (new Set(legacySourceIds).size !== legacySourceIds.length) {
    throw new TypeError("sourceIds must be unique");
  }
  const knownSourceIds = sourceIdSet(input.sourcesDocument ?? loadSourcesDocument());
  if (legacySourceIds.length > 0 && input.supportingEvidence !== undefined) {
    throw new TypeError("sourceIds and supportingEvidence cannot be combined");
  }
  const referent = cleanText(input.referent, "referent");
  const reportSource = bindReportSource(input.reportSource, referent, legacySourceIds);
  const supportingEvidence = bindSupportingEvidence(input.supportingEvidence, knownSourceIds);
  const evidenceState = "UNKNOWN";

  return Object.freeze({
    schemaVersion: "juri-credit-audit.v2",
    claimType: input.claimType,
    referent,
    reportReviewState: "USER_REPORT_PRESERVED_REVIEW_OPEN",
    reportSource,
    reportedEvidenceState: input.evidenceState,
    meritsState: "UNKNOWN",
    evidenceState,
    supportingEvidence: Object.freeze(supportingEvidence),
    supportingEvidenceState: supportingEvidence.length
      ? "ACTOR_AND_CONTROLLER_BOUND_EVIDENCE_REFERENCED_FOR_REVIEW_NOT_PROOF"
      : "COVERAGE_UNKNOWN",
    evidenceResponsibilityActorId: reportSource.actorId,
    legacyInputState: legacySourceIds.length
      ? "DEPRECATED_UNBOUND_SOURCE_IDS_PRESERVED_NOT_USED_FOR_MERITS"
      : "NONE",
    legacyUnboundSourceIds: Object.freeze(legacySourceIds),
    sourceIds: Object.freeze(legacySourceIds),
    causalDirection: "UNBOUND_PENDING_HUMAN_SOURCE_AND_MERITS_REVIEW",
    legalConclusion: "NOT_AUTOMATIC",
    monetaryAmount: null,
    automaticClaimRejection: false,
    automaticFaultFinding: false,
    automaticAdverseInference: false
  });
}

export function classifyMillion(amount, authority, rule) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TypeError("amount must be a non-negative finite number");
  }
  return Object.freeze({
    schemaVersion: "juri-value-ledger.v1",
    amount,
    authority: cleanText(authority, "authority"),
    rule: cleanText(rule, "rule"),
    meaning: "CONDITIONAL_INSTITUTIONAL_AMOUNT",
    intrinsicScientificValue: "UNDETERMINED",
    automaticDebt: false
  });
}

export function compareModels(models) {
  if (!Array.isArray(models) || models.length < 2) {
    throw new TypeError("models must contain at least two candidates");
  }
  return Object.freeze(models.map((model) => {
    if (!model || typeof model !== "object" || Array.isArray(model)) {
      throw new TypeError("each model must be an object");
    }
    return Object.freeze({
      id: cleanText(model.id, "model.id"),
      prediction: cleanText(model.prediction, "model.prediction"),
      discriminator: cleanText(model.discriminator, "model.discriminator"),
      selected: false
    });
  }));
}
