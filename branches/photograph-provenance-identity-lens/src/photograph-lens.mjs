import { createHash } from "node:crypto";

const MAX_BYTES = 16 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/u;

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const found = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (found.length !== expected.length || found.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} must have exactly: ${expected.join(", ")}`);
  }
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function checkedBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    throw new TypeError(`bytes must be a nonempty Uint8Array of at most ${MAX_BYTES} bytes`);
  }
  return bytes;
}

/** Inspect only the exact supplied bytes. No filesystem, image decoder or network access. */
export function inspectFileBytes(bytes, expectedSha256 = null) {
  const input = checkedBytes(bytes);
  if (expectedSha256 !== null && (typeof expectedSha256 !== "string" || !SHA256.test(expectedSha256))) {
    throw new TypeError("expectedSha256 must be a lowercase SHA-256 hex digest or null");
  }
  const sha256 = digest(input);
  return {
    type: "FILE_BYTE_RECEIPT",
    byteLength: input.byteLength,
    sha256,
    comparison: expectedSha256 === null ? "NO_REFERENCE" :
      sha256 === expectedSha256 ? "MATCHED_REFERENCE" : "MISMATCHED_REFERENCE",
    evidenceState: "OBSERVED_WITHIN_SUPPLIED_BYTES",
    claimCeiling: "EXACT_SUPPLIED_BYTES_ONLY"
  };
}

/** A typed address for an asset, deliberately without invented identity facts. */
export function buildPhotoEvidencePacket(bytes, expectedSha256 = null) {
  return {
    schemaVersion: "0.1.0",
    file: inspectFileBytes(bytes, expectedSha256),
    decodedPixels: { state: "NOT_DECODED", decoder: null, pixelSha256: null },
    capture: { state: "UNKNOWN", eventRef: null, clockRef: null },
    humanCreator: { state: "UNKNOWN", evidenceRef: null },
    depictedPerson: { state: "UNKNOWN", evidenceRef: null },
    consent: { state: "UNKNOWN", scopeRef: null },
    publicationRights: { state: "NOT_EVALUATED", jurisdictionRef: null },
    dataClass: "UNCLASSIFIED_INPUT",
    claimCeiling: "BYTE_IDENTITY_ONLY"
  };
}

/**
 * A deterministic one-channel teaching model, not a calibrated camera.
 * Input values are normalized irradiance samples, not people or real images.
 */
export function quantizeSyntheticScene(input) {
  exactKeys(input, ["irradiances", "exposure", "bits"], "input");
  const { irradiances, exposure, bits } = input;
  if (!Array.isArray(irradiances) || irradiances.length < 1 || irradiances.length > 256 ||
      irradiances.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new TypeError("irradiances must contain 1..256 finite values in [0,1]");
  }
  if (typeof exposure !== "number" || !Number.isFinite(exposure) || exposure <= 0 || exposure > 8) {
    throw new TypeError("exposure must be finite and in (0,8]");
  }
  if (!Number.isInteger(bits) || bits < 1 || bits > 8) {
    throw new TypeError("bits must be an integer in [1,8]");
  }
  const levels = (2 ** bits) - 1;
  const samples = irradiances.map((value) => Math.round(Math.min(1, value * exposure) * levels));
  const pixelBytes = Uint8Array.from([bits, ...samples]);
  return {
    operator: "CLAMP_AND_ROUND_NORMALIZED_LIGHT_V1",
    inputScope: "SUPPLIED_SYNTHETIC_VALUES_ONLY",
    exposure,
    bits,
    samples,
    pixelSha256: digest(pixelBytes),
    evidenceState: "OBSERVED_IN_LOCAL_DETERMINISTIC_MODEL",
    informationLoss: ["QUANTIZATION", "SATURATION_IF_SIGNAL_EXCEEDS_ONE"],
    claimCeiling: "SYNTHETIC_ONE_CHANNEL_MODEL_ONLY"
  };
}

/** Metadata can change the asset bytes without changing its synthetic pixels. */
export function encodeSyntheticAsset(model, revision) {
  if (!model || model.operator !== "CLAMP_AND_ROUND_NORMALIZED_LIGHT_V1" ||
      !Array.isArray(model.samples) || model.samples.length < 1 || model.samples.length > 256 ||
      !Number.isInteger(model.bits) || model.bits < 1 || model.bits > 8 ||
      model.samples.some((value) => !Number.isInteger(value) || value < 0 || value > (2 ** model.bits) - 1)) {
    throw new TypeError("model must be a quantizeSyntheticScene result");
  }
  if (!Number.isInteger(revision) || revision < 1 || revision > 255) {
    throw new TypeError("revision must be an integer in [1,255]");
  }
  const pixels = Uint8Array.from([model.bits, ...model.samples]);
  if (digest(pixels) !== model.pixelSha256) throw new TypeError("model pixel digest mismatch");
  const fileBytes = Buffer.from(JSON.stringify({ format: "HALVETH_SYNTHETIC_V1", bits: model.bits, samples: model.samples, revision }), "utf8");
  return {
    file: inspectFileBytes(fileBytes),
    pixelSha256: model.pixelSha256,
    metadataState: "SYNTHETIC_REVISION_ONLY",
    personIdentity: "UNKNOWN",
    humanCreator: "UNKNOWN",
    captureEvent: "NOT_APPLICABLE_SYNTHETIC_MODEL",
    publicationRights: "NOT_EVALUATED",
    bytes: fileBytes
  };
}
