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
  const sourceIds = Array.isArray(input.sourceIds)
    ? input.sourceIds.map((id) => cleanText(id, "sourceIds item"))
    : [];
  if (sourceIds.length === 0 || new Set(sourceIds).size !== sourceIds.length) {
    throw new TypeError("sourceIds must be a non-empty unique list");
  }

  return Object.freeze({
    schemaVersion: "juri-credit-audit.v1",
    claimType: input.claimType,
    referent: cleanText(input.referent, "referent"),
    evidenceState: input.evidenceState,
    sourceIds: Object.freeze(sourceIds),
    causalDirection: input.evidenceState === "OBSERVED" ? "SOURCE_BOUND_ONLY" : "UNBOUND",
    legalConclusion: "NOT_AUTOMATIC",
    monetaryAmount: null
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
