import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createWaveSeed, inspectWithAster } from "../src/aster-lens.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const digestA = "a".repeat(64);
const digestB = "b".repeat(64);

function frame(previousDigest = digestA, currentDigest = digestB) {
  return {
    source: { ref: "synthetic:source", evidenceState: "OBSERVED", digest: digestA },
    representation: { ref: "synthetic:view", evidenceState: "OBSERVED", digest: digestB },
    previousTrace: { ref: "synthetic:t0", evidenceState: "OBSERVED", digest: previousDigest },
    currentState: { ref: "synthetic:t1", evidenceState: "OBSERVED", digest: currentDigest },
    openQuestions: ["What changed?."]
  };
}

test("ASTER keeps the four addresses distinct", () => {
  const result = inspectWithAster(frame());
  assert.deepEqual(Object.keys(result.addresses), [
    "source",
    "representation",
    "previousTrace",
    "currentState"
  ]);
});

test("different bound digests establish a byte-level difference only", () => {
  const result = inspectWithAster(frame());
  assert.equal(result.traceComparison, "DIFFERENT_DIGEST");
  assert.equal(result.causalDirection, "UNBOUND");
  assert.equal(result.transferMechanism, "UNBOUND");
});

test("equal bound digests establish the same digest", () => {
  assert.equal(inspectWithAster(frame(digestA, digestA)).traceComparison, "SAME_DIGEST");
});

test("missing digests preserve UNKNOWN", () => {
  const input = frame();
  delete input.currentState.digest;
  assert.equal(inspectWithAster(input).traceComparison, "UNKNOWN");
});

test("invalid evidence and malformed digests fail closed", () => {
  const badState = frame();
  badState.source.evidenceState = "TRUE";
  assert.throws(() => inspectWithAster(badState), /unsupported/u);
  const badDigest = frame();
  badDigest.source.digest = "abc";
  assert.throws(() => inspectWithAster(badDigest), /SHA-256/u);
});

test("the founder statement is scoped to LUCINET ASTER", () => {
  const provenance = readJson("provenance.json");
  assert.equal(provenance.subject.namespace, "LUCINET::ASTER");
  assert.equal(provenance.founderStatement.founder, "Juri Janovski");
  assert.ok(provenance.founderStatement.excludedReferents.includes("Astar Network"));
  assert.ok(provenance.founderStatement.excludedReferents.includes("Aster DEX"));
});

test("Antiwellen and Schicksal remain an open named hypothesis and narrative", () => {
  const provenance = readJson("provenance.json");
  assert.equal(provenance.resonanceStatement.state, "USER_NAMED_HYPOTHESIS_AND_NARRATIVE");
  assert.equal(provenance.resonanceStatement.externalTransferEvidence, "UNKNOWN");
  assert.match(provenance.resonanceStatement.reopenTrigger, /measurable prediction/u);
});

test("JURI and RACHEL are the core pair while K remains unresolved", () => {
  const entities = readJson("entities.json");
  assert.deepEqual(entities.corePair, ["JURI", "RACHEL"]);
  const k = entities.entities.find((entity) => entity.id === "K");
  assert.equal(k.identityBehindInitial, "UNKNOWN_AND_NOT_ASSERTED");
});

test("every public project seed has one proof unit and reopen trigger", () => {
  const data = readJson("project-seeds.json");
  assert.equal(data.seeds.length, 5);
  for (const seed of data.seeds) {
    const created = createWaveSeed(seed);
    assert.ok(created.proofUnit);
    assert.ok(created.reopenTrigger);
    assert.equal(created.claimState, "LOCAL_DRAFT_ONLY");
  }
});

test("wave seeds reject an empty public surface", () => {
  assert.throws(
    () => createWaveSeed({ id: "x", publicSurface: "", proofUnit: "p", reopenTrigger: "r" }),
    /publicSurface/u
  );
});

test("the public founder name has an exact file-scoped authorization record", () => {
  const publicIdentities = JSON.parse(
    fs.readFileSync(path.resolve(root, "..", "..", "catalog", "public-identities.json"), "utf8")
  );
  const founder = publicIdentities.identities.find((identity) => identity.exactText === "Juri Janovski");
  assert.equal(founder.authorizationState, "EXPLICIT_USER_AUTHORIZATION_FOR_PUBLIC_FOUNDER_STATEMENT");
  assert.ok(founder.files.includes("branches/aster-provenance-and-secret-garden/README.md"));
});
