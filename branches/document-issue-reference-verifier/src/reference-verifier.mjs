import { createHash, timingSafeEqual } from "node:crypto";

const MAX_TEXT_BYTES = 1024 * 1024;
const TOKEN_PATTERN = /^[A-Z][A-Z0-9._-]{2,63}$/;
const REFERENCE_PATTERN = /^([A-Z][A-Z0-9._-]{2,63})\|([1-9])$/;

const FAILURE = Object.freeze({
  authorized: false,
  code: "REFERENCE_NOT_ACCEPTED",
});

const SUCCESS = Object.freeze({
  authorized: true,
  code: "REFERENCE_ACCEPTED",
});

export class VerificationBoundaryError extends Error {
  constructor(message) {
    super(message);
    this.name = "VerificationBoundaryError";
  }
}

function assertExactKeys(value, expectedKeys, label) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new VerificationBoundaryError(`${label} has unexpected keys`);
  }
}

function assertJsonValue(value, label = "value") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new VerificationBoundaryError(`${label} must be finite`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${label}[${index}]`));
    return;
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, item] of Object.entries(value)) assertJsonValue(item, `${label}.${key}`);
    return;
  }
  throw new VerificationBoundaryError(`${label} is not plain JSON data`);
}

export function canonicalJson(value) {
  assertJsonValue(value);
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(",")}}`;
}

export function parseCanonicalJsonText(text, label = "input") {
  if (typeof text !== "string") throw new VerificationBoundaryError(`${label} must be text`);
  if (text.startsWith("\uFEFF")) throw new VerificationBoundaryError(`${label} must not contain a BOM`);
  if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
    throw new VerificationBoundaryError(`${label} exceeds the local research limit`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new VerificationBoundaryError(`${label} is not valid JSON`);
  }
  assertJsonValue(parsed, label);
  if (canonicalJson(parsed) !== text) {
    throw new VerificationBoundaryError(`${label} is not canonical JSON`);
  }
  return parsed;
}

export function sha256Text(text) {
  if (typeof text !== "string") throw new VerificationBoundaryError("digest input must be text");
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function assertToken(value, label) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw new VerificationBoundaryError(`${label} is outside the synthetic token grammar`);
  }
}

export function parseReference(reference) {
  if (typeof reference !== "string") {
    throw new VerificationBoundaryError("reference must be text");
  }
  const match = REFERENCE_PATTERN.exec(reference);
  if (!match) {
    throw new VerificationBoundaryError("reference is outside the synthetic model grammar");
  }
  return Object.freeze({ stem: match[1], issue: Number(match[2]) });
}

export function previousIssueReference(reference) {
  const parsed = parseReference(reference);
  if (parsed.issue === 1) return null;
  return `${parsed.stem}|${parsed.issue - 1}`;
}

export function classifyReferencePair(olderReference, newerReference) {
  const older = parseReference(olderReference);
  const newer = parseReference(newerReference);
  if (olderReference === newerReference) return "SAME_REFERENCE";
  if (older.stem === newer.stem && newer.issue === older.issue + 1) {
    return "SUCCESSIVE_ISSUES";
  }
  return "RELATION_NOT_ESTABLISHED";
}

function validateRegistry(registry) {
  assertExactKeys(registry, ["records", "schema"], "registry");
  if (registry.schema !== "synthetic-document-reference-registry/1") {
    throw new VerificationBoundaryError("registry schema is unsupported");
  }
  if (!Array.isArray(registry.records) || registry.records.length === 0 || registry.records.length > 100) {
    throw new VerificationBoundaryError("registry record count is outside the model boundary");
  }

  const references = new Set();
  const currentRecordSets = new Set();
  registry.records.forEach((record, index) => {
    assertExactKeys(
      record,
      ["issue", "principalRef", "recordSetRef", "reference", "state"],
      `record[${index}]`,
    );
    const parsed = parseReference(record.reference);
    if (!Number.isInteger(record.issue) || parsed.issue !== record.issue) {
      throw new VerificationBoundaryError(`record[${index}] issue coordinate mismatch`);
    }
    assertToken(record.principalRef, `record[${index}] principalRef`);
    assertToken(record.recordSetRef, `record[${index}] recordSetRef`);
    if (record.state !== "CURRENT" && record.state !== "RETIRED") {
      throw new VerificationBoundaryError(`record[${index}] state is invalid`);
    }
    if (references.has(record.reference)) {
      throw new VerificationBoundaryError("duplicate reference");
    }
    references.add(record.reference);
    if (record.state === "CURRENT") {
      if (currentRecordSets.has(record.recordSetRef)) {
        throw new VerificationBoundaryError("multiple current references for one record set");
      }
      currentRecordSets.add(record.recordSetRef);
    }
  });
}

function validateRequest(request) {
  assertExactKeys(request, ["principalRef", "purpose", "reference"], "request");
  parseReference(request.reference);
  assertToken(request.principalRef, "request principalRef");
  if (request.purpose !== "VERIFY_OWN_CURRENT_REFERENCE") {
    throw new VerificationBoundaryError("request purpose is unsupported");
  }
}

/**
 * Local synthetic oracle.
 *
 * `requestText` and `registryText` are untrusted canonical JSON. The authenticated
 * principal and expected registry digest must come from a separate trusted adapter.
 * Failure responses intentionally reveal no lifecycle state or identifier.
 */
export function verifyCurrentReference({
  requestText,
  registryText,
  authenticatedPrincipalRef,
  expectedRegistryDigest,
}) {
  if (!/^sha256:[0-9a-f]{64}$/.test(expectedRegistryDigest ?? "")) {
    throw new VerificationBoundaryError("expected registry digest is missing or malformed");
  }
  const actualRegistryDigest = sha256Text(registryText);
  if (!constantTimeEqual(actualRegistryDigest, expectedRegistryDigest)) {
    throw new VerificationBoundaryError("registry anchor mismatch");
  }

  const registry = parseCanonicalJsonText(registryText, "registryText");
  const request = parseCanonicalJsonText(requestText, "requestText");
  validateRegistry(registry);
  validateRequest(request);
  assertToken(authenticatedPrincipalRef, "authenticatedPrincipalRef");

  if (request.principalRef !== authenticatedPrincipalRef) return { ...FAILURE };

  const record = registry.records.find((candidate) => candidate.reference === request.reference);
  if (!record || record.state !== "CURRENT" || record.principalRef !== authenticatedPrincipalRef) {
    return { ...FAILURE };
  }
  return { ...SUCCESS };
}
