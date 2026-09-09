const STATES = new Set([
  "OBSERVED",
  "USER_ATTESTED",
  "INFERRED",
  "HYPOTHESIS",
  "UNKNOWN"
]);

const ADDRESS_NAMES = [
  "source",
  "representation",
  "previousTrace",
  "currentState"
];

function requireRecord(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
  if (typeof value.ref !== "string" || value.ref.trim() === "") {
    throw new TypeError(`${name}.ref must be a non-empty string`);
  }
  if (!STATES.has(value.evidenceState)) {
    throw new TypeError(`${name}.evidenceState is unsupported`);
  }
  if (value.digest !== undefined && !/^[a-f0-9]{64}$/u.test(value.digest)) {
    throw new TypeError(`${name}.digest must be a lowercase SHA-256 hex string`);
  }
  return Object.freeze({
    ref: value.ref.trim(),
    evidenceState: value.evidenceState,
    ...(value.digest ? { digest: value.digest } : {})
  });
}

export function inspectWithAster(frame) {
  if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
    throw new TypeError("frame must be an object");
  }

  const addresses = Object.fromEntries(
    ADDRESS_NAMES.map((name) => [name, requireRecord(frame[name], name)])
  );

  let traceComparison = "UNKNOWN";
  if (addresses.previousTrace.digest && addresses.currentState.digest) {
    traceComparison = addresses.previousTrace.digest === addresses.currentState.digest
      ? "SAME_DIGEST"
      : "DIFFERENT_DIGEST";
  }

  const openQuestions = Array.isArray(frame.openQuestions)
    ? frame.openQuestions.map((question) => {
        if (typeof question !== "string" || question.trim() === "") {
          throw new TypeError("openQuestions must contain non-empty strings");
        }
        return question.trim();
      })
    : [];

  return Object.freeze({
    schemaVersion: "aster-lens.v1",
    addresses: Object.freeze(addresses),
    traceComparison,
    causalDirection: "UNBOUND",
    transferMechanism: "UNBOUND",
    openQuestions: Object.freeze(openQuestions)
  });
}

export function createWaveSeed(seed) {
  if (!seed || typeof seed !== "object" || Array.isArray(seed)) {
    throw new TypeError("seed must be an object");
  }
  const required = ["id", "publicSurface", "proofUnit", "reopenTrigger"];
  const output = {};
  for (const field of required) {
    if (typeof seed[field] !== "string" || seed[field].trim() === "") {
      throw new TypeError(`${field} must be a non-empty string`);
    }
    output[field] = seed[field].trim();
  }
  return Object.freeze({
    schemaVersion: "one-pebble-wave.v1",
    ...output,
    claimState: "LOCAL_DRAFT_ONLY"
  });
}
