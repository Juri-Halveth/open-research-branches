import test from "node:test";
import assert from "node:assert/strict";
import { buildPhotoEvidencePacket, encodeSyntheticAsset, inspectFileBytes, quantizeSyntheticScene } from "../src/photograph-lens.mjs";

test("the same synthetic input has a stable pixel digest", () => {
  const input = { irradiances: [0.2, 0.5, 0.8], exposure: 1, bits: 8 };
  assert.deepEqual(quantizeSyntheticScene(input), quantizeSyntheticScene(input));
});

test("different scene values can collapse to identical quantized pixels", () => {
  const a = quantizeSyntheticScene({ irradiances: [0.5000], exposure: 1, bits: 8 });
  const b = quantizeSyntheticScene({ irradiances: [0.5001], exposure: 1, bits: 8 });
  assert.notEqual(0.5000, 0.5001);
  assert.deepEqual(a.samples, b.samples);
  assert.equal(a.pixelSha256, b.pixelSha256);
});

test("one scene under another exposure may produce other pixels", () => {
  const a = quantizeSyntheticScene({ irradiances: [0.4], exposure: 1, bits: 8 });
  const b = quantizeSyntheticScene({ irradiances: [0.4], exposure: 2, bits: 8 });
  assert.notEqual(a.pixelSha256, b.pixelSha256);
});

test("metadata changes file bytes while synthetic pixels remain fixed", () => {
  const model = quantizeSyntheticScene({ irradiances: [0.2, 0.5], exposure: 1, bits: 8 });
  const a = encodeSyntheticAsset(model, 1);
  const b = encodeSyntheticAsset(model, 2);
  assert.equal(a.pixelSha256, b.pixelSha256);
  assert.notEqual(a.file.sha256, b.file.sha256);
  assert.equal(a.personIdentity, "UNKNOWN");
  assert.equal(a.humanCreator, "UNKNOWN");
  assert.equal(a.publicationRights, "NOT_EVALUATED");
});

test("a digest verifies a supplied byte reference only", () => {
  const bytes = Buffer.from("synthetic sample", "utf8");
  const receipt = inspectFileBytes(bytes);
  assert.equal(inspectFileBytes(bytes, receipt.sha256).comparison, "MATCHED_REFERENCE");
  assert.equal(inspectFileBytes(Buffer.from("other sample"), receipt.sha256).comparison, "MISMATCHED_REFERENCE");
  assert.equal(receipt.claimCeiling, "EXACT_SUPPLIED_BYTES_ONLY");
  assert.equal("personIdentity" in receipt, false);
});

test("the evidence packet does not promote bytes to identity, consent or rights", () => {
  const packet = buildPhotoEvidencePacket(Buffer.from("synthetic sample"));
  assert.equal(packet.file.evidenceState, "OBSERVED_WITHIN_SUPPLIED_BYTES");
  assert.equal(packet.decodedPixels.state, "NOT_DECODED");
  assert.equal(packet.capture.state, "UNKNOWN");
  assert.equal(packet.depictedPerson.state, "UNKNOWN");
  assert.equal(packet.humanCreator.state, "UNKNOWN");
  assert.equal(packet.consent.state, "UNKNOWN");
  assert.equal(packet.publicationRights.state, "NOT_EVALUATED");
  assert.equal(packet.claimCeiling, "BYTE_IDENTITY_ONLY");
});

test("unrecognized input fields and invalid ranges fail closed", () => {
  assert.throws(() => quantizeSyntheticScene({ irradiances: [0.5], exposure: 1, bits: 8, subject: "someone" }));
  assert.throws(() => quantizeSyntheticScene({ irradiances: [NaN], exposure: 1, bits: 8 }));
  assert.throws(() => quantizeSyntheticScene({ irradiances: [0.5], exposure: 0, bits: 8 }));
  assert.throws(() => inspectFileBytes(new Uint8Array(0)));
  assert.throws(() => inspectFileBytes(Buffer.from("x"), "not-a-digest"));
});
