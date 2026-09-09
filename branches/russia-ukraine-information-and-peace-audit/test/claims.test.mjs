import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const branchRoot = path.resolve(here, "..");
const claims = JSON.parse(fs.readFileSync(path.join(branchRoot, "claims.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(branchRoot, "sources.json"), "utf8"));
const inquiryLoop = JSON.parse(fs.readFileSync(path.join(branchRoot, "was-los-loop.json"), "utf8"));
const sourceGuide = fs.readFileSync(path.join(branchRoot, "SOURCES.md"), "utf8");
const allowed = new Set(["OBSERVED", "STRONGLY_SUPPORTED", "INFERRED", "UNKNOWN", "NOT_PROVEN"]);

test("every claim has a unique id, allowed state, scope and known sources", () => {
  const claimIds = new Set();
  const sourceIds = new Set(sources.sources.map((source) => source.id));

  for (const claim of claims.claims) {
    assert.ok(claim.id && !claimIds.has(claim.id), `duplicate or missing claim id: ${claim.id}`);
    claimIds.add(claim.id);
    assert.ok(allowed.has(claim.status), `unsupported status for ${claim.id}`);
    assert.ok(claim.statement && claim.scope, `claim text or scope missing for ${claim.id}`);
    assert.ok(Array.isArray(claim.sourceIds) && claim.sourceIds.length > 0, `sources missing for ${claim.id}`);
    for (const sourceId of claim.sourceIds) {
      assert.ok(sourceIds.has(sourceId), `unknown source ${sourceId} in ${claim.id}`);
    }
  }
});

test("open and unproven claims expose a concrete reopen trigger", () => {
  const claimsNeedingTrigger = claims.claims.filter((claim) =>
    claim.status === "UNKNOWN" || claim.status === "NOT_PROVEN"
  );
  assert.ok(claimsNeedingTrigger.length > 0);
  for (const claim of claimsNeedingTrigger) {
    assert.ok(claim.reopenTrigger && claim.reopenTrigger.length >= 24, `reopen trigger missing for ${claim.id}`);
  }
});

test("source records use unique ids and public HTTPS URLs", () => {
  const ids = new Set();
  for (const source of sources.sources) {
    assert.ok(source.id && !ids.has(source.id), `duplicate or missing source id: ${source.id}`);
    ids.add(source.id);
    assert.match(source.url, /^https:\/\//u, `non-HTTPS source: ${source.id}`);
    assert.ok(source.publisher && source.type && source.title, `incomplete source: ${source.id}`);
  }
});

test("the readable and machine-readable source registries contain the same canonical ids", () => {
  const machineIds = sources.sources.map((source) => source.id).sort();
  const readableIds = [...sourceGuide.matchAll(/^- \*\*(S\d+) —\*\*/gmu)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(readableIds, machineIds);
});

test("the audit keeps private knowledge and public-role claims separate", () => {
  const privateKnowledge = claims.claims.find((claim) => claim.id === "INF-004");
  const publicRole = claims.claims.find((claim) => claim.id === "ROLE-001");
  const appropriation = claims.claims.find((claim) => claim.id === "ROLE-002");
  assert.equal(privateKnowledge.status, "UNKNOWN");
  assert.equal(publicRole.status, "OBSERVED");
  assert.equal(appropriation.status, "NOT_PROVEN");
});

test("the Was los?. loop binds concrete explanations, a discriminator and a reopen path", () => {
  assert.equal(inquiryLoop.marker, "Was los?.");
  assert.ok(inquiryLoop.requiredFields.includes("candidateExplanations"));
  assert.ok(inquiryLoop.requiredFields.includes("discriminator"));
  assert.ok(inquiryLoop.requiredFields.includes("nextObservationOrReopenTrigger"));
  assert.ok(inquiryLoop.example.candidateExplanations.length >= 2);
  assert.ok(inquiryLoop.example.discriminator.length >= 24);
  assert.ok(inquiryLoop.example.nextObservationOrReopenTrigger.length >= 24);
});
