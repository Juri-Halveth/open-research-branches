import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BINDING_STATES,
  CLAIM_CEILINGS,
  MEANING_STATES,
  computeMarkerDigest,
  createMarkerReceipt,
  sha256Utf8,
  validateMarker
} from "../marker-protocol.mjs";

const publicInputsPath = new URL("../marker-receipts.public.json", import.meta.url);

async function loadPublicInputs() {
  return JSON.parse(await readFile(publicInputsPath, "utf8"));
}

function boundTextMarker({
  markerId = "TEST-MARKER-001",
  sourceText = "prefix: selected text :suffix",
  exactText = "selected text",
  meaningStatus = MEANING_STATES.UNKNOWN,
  claimCeiling = CLAIM_CEILINGS.MARKER_ONLY,
  callerClaims = []
} = {}) {
  const start = sourceText.indexOf(exactText);
  assert.notEqual(start, -1, "test fixture must contain exactText");
  const end = start + exactText.length;
  return {
    marker: {
      markerId,
      sourceId: `${markerId}-SOURCE`,
      sourceByteLength: Buffer.byteLength(sourceText, "utf8"),
      sourceSpan: {
        encoding: "UTF-16",
        offsetUnit: "UTF16_CODE_UNIT",
        start,
        end,
        exactText,
        utf8ByteLength: Buffer.byteLength(exactText, "utf8"),
        sha256: sha256Utf8(exactText)
      },
      medium: "SYNTHETIC_TEST_TEXT",
      observedAt: "2026-09-09T18:55:59.455Z",
      sha256: sha256Utf8(sourceText),
      meaningStatus,
      claimCeiling,
      callerClaims
    },
    sourceText
  };
}

test("public iOS receipt binds the exact reported span without promoting its meaning", async () => {
  const inputs = await loadPublicInputs();
  const marker = inputs.records.find((item) => item.markerId === "IOS-MARKER-20260909-A");
  assert.ok(marker);

  const receipt = createMarkerReceipt(marker);

  assert.equal(receipt.bindingStatus, BINDING_STATES.BOUND);
  assert.equal(receipt.sourceVerification, "BOUND_RECEIPT_RAW_SOURCE_NOT_EMBEDDED");
  assert.equal(receipt.sourceSpan.start, 483);
  assert.equal(receipt.sourceSpan.end, 537);
  assert.equal(receipt.sourceSpan.exactText.length, 54);
  assert.equal(receipt.meaningStatus, MEANING_STATES.UNKNOWN);
  assert.equal(receipt.iosUiTargetStatus, "UNKNOWN");
  assert.equal(receipt.externalEffectStatus, "UNKNOWN");
  assert.equal(receipt.causationStatus, "UNKNOWN");
  assert.equal(receipt.worldStateEffect, "NONE_RECEIPT_ONLY");
});

test("sanitized helmet derivative verifies against the public derivative text", async () => {
  const inputs = await loadPublicInputs();
  const marker = inputs.records.find((item) => item.markerId.startsWith("HELMET-STATEMENT"));
  assert.ok(marker);

  const receipt = createMarkerReceipt(marker, {
    sourceText: marker.sourceSpan.exactText
  });

  assert.equal(receipt.bindingStatus, BINDING_STATES.BOUND);
  assert.equal(receipt.sourceVerification, "VERIFIED_AGAINST_SUPPLIED_SOURCE_TEXT");
  assert.equal(receipt.meaningStatus, MEANING_STATES.USER_REPORTED);
  assert.equal(receipt.claimCeiling, CLAIM_CEILINGS.HELMET_STATEMENT_ONLY);
  assert.equal(receipt.externalEffectStatus, "UNKNOWN");
  assert.equal(receipt.causationStatus, "UNKNOWN");
});

test("UTF-16 offsets remain exact when the source contains a surrogate pair", () => {
  const sourceText = "prefix 🧭 selected suffix";
  const fixture = boundTextMarker({ sourceText, exactText: "selected" });
  const receipt = createMarkerReceipt(fixture.marker, { sourceText });

  assert.equal(
    sourceText.slice(receipt.sourceSpan.start, receipt.sourceSpan.end),
    receipt.sourceSpan.exactText
  );
  assert.equal(receipt.sourceVerification, "VERIFIED_AGAINST_SUPPLIED_SOURCE_TEXT");
});

test("a missing source span remains SOURCE_SPAN_MISSING and UNKNOWN", () => {
  const sourceText = "report";
  const marker = {
    markerId: "MISSING-SPAN-001",
    sourceId: "PUBLIC-REPORT-INITIAL-STATE",
    sourceByteLength: Buffer.byteLength(sourceText, "utf8"),
    sourceSpan: null,
    medium: "PUBLIC_REPORT",
    observedAt: "2026-09-09T18:00:00Z",
    sha256: sha256Utf8(sourceText),
    meaningStatus: MEANING_STATES.UNKNOWN,
    claimCeiling: CLAIM_CEILINGS.MARKER_ONLY,
    callerClaims: ["the marker changed an external system"]
  };

  const receipt = createMarkerReceipt(marker, { sourceText });

  assert.equal(receipt.bindingStatus, BINDING_STATES.MISSING);
  assert.equal(receipt.sourceVerification, "NO_SOURCE_SPAN_TO_VERIFY");
  assert.equal(receipt.meaningStatus, MEANING_STATES.UNKNOWN);
  assert.equal(receipt.externalEffectStatus, "UNKNOWN");
  assert.equal(receipt.causationStatus, "UNKNOWN");
  assert.deepEqual(receipt.callerClaims, [{
    text: "the marker changed an external system",
    status: "QUOTED_ONLY"
  }]);
});

test("a missing source span cannot carry a promoted meaning status", () => {
  const sourceText = "report";
  const marker = {
    markerId: "MISSING-SPAN-INVALID-001",
    sourceId: "PUBLIC-REPORT-INITIAL-STATE",
    sourceByteLength: Buffer.byteLength(sourceText, "utf8"),
    sourceSpan: null,
    medium: "PUBLIC_REPORT",
    observedAt: "2026-09-09T18:00:00Z",
    sha256: sha256Utf8(sourceText),
    meaningStatus: MEANING_STATES.USER_REPORTED,
    claimCeiling: CLAIM_CEILINGS.MARKER_ONLY
  };

  assert.throws(
    () => createMarkerReceipt(marker, { sourceText }),
    /missing source span requires meaningStatus UNKNOWN/u
  );
});

test("caller claims are preserved as QUOTED_ONLY and never change effect or causation", () => {
  const fixture = boundTextMarker({
    callerClaims: [
      "this proves an iOS implementation",
      "this caused an outside event"
    ]
  });
  const receipt = createMarkerReceipt(fixture.marker, { sourceText: fixture.sourceText });

  assert.deepEqual(receipt.callerClaims.map((item) => item.status), ["QUOTED_ONLY", "QUOTED_ONLY"]);
  assert.equal(receipt.externalEffectStatus, "UNKNOWN");
  assert.equal(receipt.causationStatus, "UNKNOWN");
  assert.equal(receipt.worldStateEffect, "NONE_RECEIPT_ONLY");
});

test("source text verification rejects an offset or digest mismatch", () => {
  const fixture = boundTextMarker();
  const wrongOffset = structuredClone(fixture.marker);
  wrongOffset.sourceSpan.start += 1;
  wrongOffset.sourceSpan.end += 1;
  assert.throws(
    () => validateMarker(wrongOffset, { sourceText: fixture.sourceText }),
    /does not match the supplied sourceText/u
  );

  const wrongDigest = structuredClone(fixture.marker);
  wrongDigest.sha256 = "0".repeat(64);
  assert.throws(
    () => validateMarker(wrongDigest, { sourceText: fixture.sourceText }),
    /sha256 does not match/u
  );
});

test("unrecognized claim ceilings are rejected instead of silently promoted", () => {
  const fixture = boundTextMarker();
  fixture.marker.claimCeiling = "WORLD_EFFECT_PROVEN";
  assert.throws(
    () => createMarkerReceipt(fixture.marker, { sourceText: fixture.sourceText }),
    /not an allowed non-promotion ceiling/u
  );
});

test("receipt digests are stable and receipts are immutable", () => {
  const fixture = boundTextMarker();
  const left = createMarkerReceipt(fixture.marker, { sourceText: fixture.sourceText });
  const right = createMarkerReceipt(structuredClone(fixture.marker), {
    sourceText: fixture.sourceText
  });

  assert.equal(left.receiptSha256, right.receiptSha256);
  const { receiptSha256, ...body } = left;
  assert.equal(receiptSha256, computeMarkerDigest(body));
  assert.equal(Object.isFrozen(left), true);
  assert.equal(Object.isFrozen(left.sourceSpan), true);
  assert.throws(() => {
    left.externalEffectStatus = "PROVEN";
  }, TypeError);
});
