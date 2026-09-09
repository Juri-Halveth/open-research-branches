import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  OPEN_OUTCOME,
  REVIEW_OUTCOME,
  assessDecodingProof,
  classifyVisualAnalogy,
  validateChallenge
} from "../src/decoding-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const challenge = JSON.parse(fs.readFileSync(path.join(root, "challenge.json"), "utf8"));
const d = (character) => character.repeat(64);

function completeCandidate() {
  return {
    ciphertext: {
      artifactId: "SYNTHETIC-CIPHER",
      sourceRef: "fixture://cipher",
      bytesSha256: d("a"),
      byteLength: 128
    },
    transcription: {
      textSha256: d("b"),
      segmentationContractId: "SEGMENTATION-1"
    },
    model: {
      cipherFamily: "SYNTHETIC_SUBSTITUTION",
      procedureOrImplementationVersion: "1.0.0",
      procedureOrImplementationDigest: d("c"),
      environmentDigest: d("d"),
      seedPolicy: "FIXED_SEED_7"
    },
    plaintext: {
      outputSha256: d("e"),
      language: "synthetic-latin"
    },
    evaluation: {
      heldOutSetDigest: d("f"),
      goldReferenceDigest: d("0"),
      metric: "exact-symbol-accuracy",
      score: 0.95,
      threshold: 0.9,
      alternativeBaselineIds: ["frequency-only", "random-key"],
      independentReproductionReceiptIds: ["INDEPENDENT-RECEIPT-1"]
    }
  };
}

test("the Rosetta illustration and Borg manuscript remain distinct artifacts", () => {
  validateChallenge(challenge);
  assert.notEqual(challenge.article.articleImageArtifactId, challenge.article.actualDecodedArtifactId);
  assert.equal(challenge.article.separationRule, "ARTICLE_IMAGE_IS_NOT_ARTICLE_DECODED_MANUSCRIPT");
});

test("the current request remains an open decoding hypothesis without a proof packet", () => {
  const result = assessDecodingProof();
  assert.equal(result.state, OPEN_OUTCOME);
  assert.ok(result.missing.includes("EXACT_CIPHERTEXT_REFERENCE_AND_DIGEST"));
  assert.ok(result.missing.includes("HELD_OUT_OR_GOLD_EVALUATION"));
});

test("a partial key cannot silently become a decipherment", () => {
  const candidate = completeCandidate();
  candidate.evaluation.independentReproductionReceiptIds = [];
  const result = assessDecodingProof(candidate);
  assert.equal(result.state, OPEN_OUTCOME);
  assert.ok(result.missing.includes("INDEPENDENT_REPRODUCTION_RECEIPT"));
});

test("a score below the declared threshold stays open", () => {
  const candidate = completeCandidate();
  candidate.evaluation.score = 0.5;
  const result = assessDecodingProof(candidate);
  assert.equal(result.state, OPEN_OUTCOME);
  assert.ok(result.missing.includes("DECLARED_THRESHOLD_NOT_MET"));
});

test("a complete synthetic packet opens expert review without automatic grand claims", () => {
  const result = assessDecodingProof(completeCandidate());
  assert.equal(result.state, REVIEW_OUTCOME);
  assert.ok(result.automaticFindingsExcluded.includes("DIVINE_ARTIFACT"));
  assert.ok(result.automaticFindingsExcluded.includes("PAYMENT"));
});

test("malformed digests are rejected instead of normalized", () => {
  const candidate = completeCandidate();
  candidate.ciphertext.bytesSha256 = "111";
  assert.throws(() => assessDecodingProof(candidate), /SHA-256/u);
});

test("111 and Matrix remain attributed visual analogies", () => {
  for (const expression of ["111", "Matrix", "pipe or tube-like signs"]) {
    const result = classifyVisualAnalogy({ expression, sourceRef: "REQUEST-2026-09-10" });
    assert.equal(result.state, "USER_REPORTED_VISUAL_ANALOGY");
    assert.equal(result.evidenceState, "HYPOTHESIS");
    assert.equal(result.promotionAuthority, false);
  }
});
