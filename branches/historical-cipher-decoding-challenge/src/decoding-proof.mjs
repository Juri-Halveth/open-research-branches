import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const OPEN_OUTCOME = "OPEN_DECODING_HYPOTHESIS";
export const REVIEW_OUTCOME = "REPRODUCIBLE_CANDIDATE_REQUIRES_EXPERT_REVIEW";

const SHA256 = /^[a-f0-9]{64}$/u;

function nonEmptyText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function digest(value, label) {
  const normalized = nonEmptyText(value, label).replace(/^sha256:/u, "");
  if (!SHA256.test(normalized)) throw new TypeError(`${label} must be a lowercase SHA-256 digest`);
  return normalized;
}

function uniqueTexts(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const result = value.map((item, index) => nonEmptyText(item, `${label}[${index}]`));
  if (new Set(result).size !== result.length) throw new TypeError(`${label} contains duplicates`);
  return result;
}

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

export function validateChallenge(challenge) {
  if (!challenge || typeof challenge !== "object" || Array.isArray(challenge)) {
    throw new TypeError("challenge must be an object");
  }
  nonEmptyText(challenge.challengeId, "challenge.challengeId");
  nonEmptyText(challenge.state, "challenge.state");
  if (challenge.article.articleImageArtifactId === challenge.article.actualDecodedArtifactId) {
    throw new TypeError("article image and decoded artifact must remain distinct");
  }
  if (challenge.article.separationRule !== "ARTICLE_IMAGE_IS_NOT_ARTICLE_DECODED_MANUSCRIPT") {
    throw new TypeError("article image separation rule is missing");
  }
  const analogy = challenge.userOriginHypothesis;
  if (analogy.state !== "USER_REPORTED_VISUAL_ANALOGY" || analogy.interpretationState !== "HYPOTHESIS") {
    throw new TypeError("visual analogy must remain a user-reported hypothesis");
  }
  uniqueTexts(analogy.expressions, "challenge.userOriginHypothesis.expressions");
  return challenge;
}

export function assessDecodingProof(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }
  const missing = [];
  const evidenceIds = [];

  if (!input.ciphertext) missing.push("EXACT_CIPHERTEXT_REFERENCE_AND_DIGEST");
  else {
    nonEmptyText(input.ciphertext.artifactId, "ciphertext.artifactId");
    nonEmptyText(input.ciphertext.sourceRef, "ciphertext.sourceRef");
    digest(input.ciphertext.bytesSha256, "ciphertext.bytesSha256");
    if (!Number.isSafeInteger(input.ciphertext.byteLength) || input.ciphertext.byteLength <= 0) {
      throw new TypeError("ciphertext.byteLength must be a positive safe integer");
    }
    evidenceIds.push(`ciphertext:${input.ciphertext.bytesSha256.replace(/^sha256:/u, "")}`);
  }

  if (!input.transcription) missing.push("TRANSCRIPTION_AND_SEGMENTATION_CONTRACT");
  else {
    digest(input.transcription.textSha256, "transcription.textSha256");
    nonEmptyText(input.transcription.segmentationContractId, "transcription.segmentationContractId");
  }

  if (!input.model) missing.push("CIPHER_FAMILY_AND_VERSIONED_PROCEDURE");
  else {
    nonEmptyText(input.model.cipherFamily, "model.cipherFamily");
    nonEmptyText(input.model.procedureOrImplementationVersion, "model.procedureOrImplementationVersion");
    digest(input.model.procedureOrImplementationDigest, "model.procedureOrImplementationDigest");
    digest(input.model.environmentDigest, "model.environmentDigest");
    nonEmptyText(input.model.seedPolicy, "model.seedPolicy");
  }

  if (!input.plaintext) missing.push("PLAINTEXT_DIGEST_AND_LANGUAGE");
  else {
    digest(input.plaintext.outputSha256, "plaintext.outputSha256");
    nonEmptyText(input.plaintext.language, "plaintext.language");
  }

  if (!input.evaluation) missing.push("HELD_OUT_OR_GOLD_EVALUATION");
  else {
    const evaluation = input.evaluation;
    if (!present(evaluation.heldOutSetDigest) && !present(evaluation.goldReferenceDigest)) {
      missing.push("HELD_OUT_OR_INDEPENDENT_GOLD_REFERENCE");
    }
    if (present(evaluation.heldOutSetDigest)) digest(evaluation.heldOutSetDigest, "evaluation.heldOutSetDigest");
    if (present(evaluation.goldReferenceDigest)) digest(evaluation.goldReferenceDigest, "evaluation.goldReferenceDigest");
    nonEmptyText(evaluation.metric, "evaluation.metric");
    if (!Number.isFinite(evaluation.score) || !Number.isFinite(evaluation.threshold)) {
      throw new TypeError("evaluation score and threshold must be finite numbers");
    }
    const alternatives = uniqueTexts(evaluation.alternativeBaselineIds ?? [], "evaluation.alternativeBaselineIds");
    if (alternatives.length === 0) missing.push("ALTERNATIVE_BASELINE");
    const reproductions = uniqueTexts(
      evaluation.independentReproductionReceiptIds ?? [],
      "evaluation.independentReproductionReceiptIds"
    );
    if (reproductions.length === 0) missing.push("INDEPENDENT_REPRODUCTION_RECEIPT");
    if (evaluation.score < evaluation.threshold) missing.push("DECLARED_THRESHOLD_NOT_MET");
  }

  if (missing.length) {
    return {
      state: OPEN_OUTCOME,
      missing: [...new Set(missing)],
      evidenceIds,
      semantics: "VISUAL_RESONANCE_OR_A_PARTIAL_MAPPING_IS_NOT_A_REPRODUCIBLE_DECIPHERMENT"
    };
  }

  return {
    state: REVIEW_OUTCOME,
    evidenceIds,
    semantics: "FORMAL_GATE_PASSED_WITH_CALLER_BOUND_EVIDENCE_EXPERT_REVIEW_STILL_REQUIRED",
    automaticFindingsExcluded: [
      "DIVINE_ARTIFACT",
      "EXTERNAL_CAUSALITY",
      "AUTHORSHIP_OR_PRIORITY",
      "LEGAL_ENTITLEMENT",
      "PAYMENT"
    ]
  };
}

export function classifyVisualAnalogy({ expression, sourceRef }) {
  return {
    expression: nonEmptyText(expression, "expression"),
    sourceRef: nonEmptyText(sourceRef, "sourceRef"),
    state: "USER_REPORTED_VISUAL_ANALOGY",
    evidenceState: "HYPOTHESIS",
    promotionAuthority: false
  };
}

function loadChallenge() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", "challenge.json"), "utf8"));
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked && invoked === fileURLToPath(import.meta.url)) {
  try {
    const challenge = validateChallenge(loadChallenge());
    console.log(JSON.stringify({
      challengeId: challenge.challengeId,
      articleImage: challenge.article.articleImageArtifactId,
      decodedArtifact: challenge.article.actualDecodedArtifactId,
      assessment: assessDecodingProof()
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
