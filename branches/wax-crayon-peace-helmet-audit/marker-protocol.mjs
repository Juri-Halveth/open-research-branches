import { createHash } from "node:crypto";

const HEX_SHA256 = /^[0-9a-f]{64}$/u;
const ISO_INSTANT_WITH_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/u;

export const BINDING_STATES = Object.freeze({
  BOUND: "SOURCE_SPAN_BOUND",
  MISSING: "SOURCE_SPAN_MISSING"
});

export const MEANING_STATES = Object.freeze({
  UNKNOWN: "UNKNOWN",
  USER_REPORTED: "USER_REPORTED",
  OBSERVED_BOUND: "OBSERVED_BOUND"
});

export const CLAIM_CEILINGS = Object.freeze({
  MARKER_ONLY: "MARKER_ONLY_NO_EXTERNAL_EFFECT_OR_CAUSATION",
  IOS_MARKER_ONLY: "EXACT_USER_REPORTED_MARKER_ONLY_NO_IOS_UI_TARGET_EXTERNAL_EFFECT_OR_CAUSATION",
  HELMET_STATEMENT_ONLY: "USER_REPORTED_HELMET_STATEMENT_NO_MATERIAL_RECEPTION_OR_HISTORICAL_EFFECT",
  DIGITAL_CONCEPT_ONLY: "DIGITAL_CONCEPT_ASSET_ONLY_NO_PHYSICAL_OBJECT_OR_PROTECTION_CLAIM"
});

const ALLOWED_MEANING_STATES = new Set(Object.values(MEANING_STATES));
const ALLOWED_CLAIM_CEILINGS = new Set(Object.values(CLAIM_CEILINGS));

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function requireSha256(value, label) {
  requireText(value, label);
  if (!HEX_SHA256.test(value)) {
    throw new TypeError(`${label} must be a lowercase hexadecimal SHA-256 digest`);
  }
  return value;
}

function requireInstant(value, label) {
  requireText(value, label);
  if (!ISO_INSTANT_WITH_ZONE.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${label} must be a valid ISO-8601 instant with a timezone`);
  }
  return value;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function sha256Utf8(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function computeMarkerDigest(marker) {
  requireObject(marker, "marker");
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(marker)), "utf8")
    .digest("hex");
}

function validateSourceSpan(sourceSpan, sourceText) {
  if (sourceSpan === null) {
    return {
      bindingStatus: BINDING_STATES.MISSING,
      sourceVerification: "NO_SOURCE_SPAN_TO_VERIFY"
    };
  }

  requireObject(sourceSpan, "marker.sourceSpan");
  if (sourceSpan.encoding !== "UTF-16") {
    throw new TypeError("marker.sourceSpan.encoding must be UTF-16");
  }
  if (sourceSpan.offsetUnit !== "UTF16_CODE_UNIT") {
    throw new TypeError("marker.sourceSpan.offsetUnit must be UTF16_CODE_UNIT");
  }
  const start = requireNonNegativeInteger(sourceSpan.start, "marker.sourceSpan.start");
  const end = requireNonNegativeInteger(sourceSpan.end, "marker.sourceSpan.end");
  if (end <= start) throw new RangeError("marker.sourceSpan.end must be greater than start");

  const exactText = requireText(sourceSpan.exactText, "marker.sourceSpan.exactText");
  if (end - start !== exactText.length) {
    throw new RangeError("marker.sourceSpan offsets must equal the exact UTF-16 code-unit length");
  }
  const utf8ByteLength = requireNonNegativeInteger(
    sourceSpan.utf8ByteLength,
    "marker.sourceSpan.utf8ByteLength"
  );
  if (Buffer.byteLength(exactText, "utf8") !== utf8ByteLength) {
    throw new RangeError("marker.sourceSpan.utf8ByteLength does not match exactText");
  }
  const spanSha256 = requireSha256(sourceSpan.sha256, "marker.sourceSpan.sha256");
  if (sha256Utf8(exactText) !== spanSha256) {
    throw new RangeError("marker.sourceSpan.sha256 does not match exactText");
  }

  if (sourceText !== undefined) {
    if (typeof sourceText !== "string") throw new TypeError("sourceText must be a string");
    if (end > sourceText.length || sourceText.slice(start, end) !== exactText) {
      throw new RangeError("marker.sourceSpan does not match the supplied sourceText");
    }
    return {
      bindingStatus: BINDING_STATES.BOUND,
      sourceVerification: "VERIFIED_AGAINST_SUPPLIED_SOURCE_TEXT"
    };
  }

  return {
    bindingStatus: BINDING_STATES.BOUND,
    sourceVerification: "BOUND_RECEIPT_RAW_SOURCE_NOT_EMBEDDED"
  };
}

function preserveCallerClaims(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError("marker.callerClaims must be an array");
  return value.map((claim, index) => ({
    text: requireText(claim, `marker.callerClaims[${index}]`),
    status: "QUOTED_ONLY"
  }));
}

export function validateMarker(marker, { sourceText } = {}) {
  requireObject(marker, "marker");
  const markerId = requireText(marker.markerId, "marker.markerId");
  const sourceId = requireText(marker.sourceId, "marker.sourceId");
  const sourceByteLength = requireNonNegativeInteger(
    marker.sourceByteLength,
    "marker.sourceByteLength"
  );
  if (sourceByteLength === 0) throw new RangeError("marker.sourceByteLength must be greater than zero");
  const medium = requireText(marker.medium, "marker.medium");
  const observedAt = requireInstant(marker.observedAt, "marker.observedAt");
  const sha256 = requireSha256(marker.sha256, "marker.sha256");

  if (!ALLOWED_MEANING_STATES.has(marker.meaningStatus)) {
    throw new TypeError("marker.meaningStatus is not an allowed evidence state");
  }
  if (!ALLOWED_CLAIM_CEILINGS.has(marker.claimCeiling)) {
    throw new TypeError("marker.claimCeiling is not an allowed non-promotion ceiling");
  }

  const spanAssessment = validateSourceSpan(marker.sourceSpan, sourceText);
  if (spanAssessment.bindingStatus === BINDING_STATES.MISSING
      && marker.meaningStatus !== MEANING_STATES.UNKNOWN) {
    throw new RangeError("a missing source span requires meaningStatus UNKNOWN");
  }

  if (sourceText !== undefined) {
    if (Buffer.byteLength(sourceText, "utf8") !== sourceByteLength) {
      throw new RangeError("marker.sourceByteLength does not match the supplied sourceText");
    }
    if (sha256Utf8(sourceText) !== sha256) {
      throw new RangeError("marker.sha256 does not match the supplied sourceText");
    }
  }

  return {
    markerId,
    sourceId,
    sourceByteLength,
    sourceSpan: marker.sourceSpan,
    medium,
    observedAt,
    sha256,
    meaningStatus: marker.meaningStatus,
    claimCeiling: marker.claimCeiling,
    callerClaims: preserveCallerClaims(marker.callerClaims),
    ...spanAssessment
  };
}

export function createMarkerReceipt(marker, options = {}) {
  const validated = validateMarker(marker, options);
  const body = {
    schemaVersion: "public-marker-receipt.v1",
    markerId: validated.markerId,
    sourceId: validated.sourceId,
    sourceByteLength: validated.sourceByteLength,
    sourceSpan: validated.sourceSpan,
    medium: validated.medium,
    observedAt: validated.observedAt,
    sha256: validated.sha256,
    bindingStatus: validated.bindingStatus,
    sourceVerification: validated.sourceVerification,
    meaningStatus: validated.bindingStatus === BINDING_STATES.MISSING
      ? MEANING_STATES.UNKNOWN
      : validated.meaningStatus,
    claimCeiling: validated.claimCeiling,
    callerClaims: validated.callerClaims,
    iosUiTargetStatus: "UNKNOWN",
    externalEffectStatus: "UNKNOWN",
    causationStatus: "UNKNOWN",
    worldStateEffect: "NONE_RECEIPT_ONLY",
    semantics: "MARKER_BINDING_DOES_NOT_PROVE_MEANING_EXTERNAL_EFFECT_OR_CAUSATION"
  };
  return deepFreeze({
    ...body,
    receiptSha256: computeMarkerDigest(body)
  });
}
