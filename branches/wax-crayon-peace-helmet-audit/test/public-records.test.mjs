import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const branch = new URL("../", import.meta.url);

async function json(name) {
  return JSON.parse(await readFile(new URL(name, branch), "utf8"));
}

test("the public concept image matches its declared digest", async () => {
  const evidence = await json("evidence-receipts.json");
  const record = evidence.records.find((item) => item.recordId === "PUBLIC-CONCEPT-ILLUSTRATION-20260909");
  const bytes = await readFile(new URL("assets/wax-crayon-peace-helmet-concept.png", branch));
  const digest = createHash("sha256").update(bytes).digest("hex");

  assert.equal(digest, record.sha256);
  assert.equal(record.evidenceState, "GENERATED_CONCEPT_ONLY");
  assert.equal(record.captionRequired, "Konzeptillustration - kein Beweisfoto");
});

test("the iOS record binds the same exact source span as the executable marker input", async () => {
  const evidence = await json("evidence-receipts.json");
  const markers = await json("marker-receipts.public.json");
  const evidenceRecord = evidence.records.find((item) => item.recordId === "IOS-MARKER-SOURCE-20260909-A");
  const marker = markers.records.find((item) => item.markerId === "IOS-MARKER-20260909-A");

  assert.equal(evidenceRecord.sourceSpan.text, marker.sourceSpan.exactText);
  assert.equal(evidenceRecord.sourceSpan.sha256, marker.sourceSpan.sha256);
  assert.equal(evidenceRecord.sourceSpan.start, marker.sourceSpan.start);
  assert.equal(evidenceRecord.sourceSpan.endExclusive, marker.sourceSpan.end);
  assert.equal(evidenceRecord.meaningStatus, "UNKNOWN");
  assert.equal(evidenceRecord.relationToHelmet, "UNKNOWN");
});

test("finite media coverage cannot become a global absence claim", async () => {
  const evidence = await json("evidence-receipts.json");
  const scan = evidence.records.find((item) => item.recordId === "TARGETED-MEDIA-SCAN-20260909");

  assert.equal(scan.filesInspected, 375);
  assert.equal(scan.physicalWaxCrayonHelmetPhotoFound, false);
  assert.equal(scan.coverageState, "FINITE_SNAPSHOT");
  assert.match(scan.claimCeiling, /WITHIN_DECLARED_COVERAGE/u);
});

test("each claim evidence reference resolves to a local receipt or a registered source", async () => {
  const claims = await json("claims.json");
  const evidence = await json("evidence-receipts.json");
  const sources = await json("sources.json");
  const ids = new Set([
    ...evidence.records.map((item) => item.recordId),
    ...sources.sources.map((item) => item.id),
    sources.sourceSetId
  ]);

  for (const claim of claims.claims) {
    for (const reference of claim.evidence) {
      assert.ok(ids.has(reference), `${claim.claimId} has unknown evidence reference ${reference}`);
    }
  }
});

test("the claim ledger keeps external adoption and automatic payment below the ceiling", async () => {
  const claims = await json("claims.json");
  const adoption = claims.claims.find((item) => item.claimId === "HELM-009");
  const iosEffect = claims.claims.find((item) => item.claimId === "HELM-008");

  assert.equal(adoption.status, "NOT_PROVEN");
  assert.equal(iosEffect.status, "UNKNOWN");
  assert.match(claims.claimCeiling, /OPEN_PHYSICAL_PROVENANCE/u);
});
