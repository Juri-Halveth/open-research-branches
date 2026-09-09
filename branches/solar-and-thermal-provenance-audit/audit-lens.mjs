import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DERIVATION_STATES = Object.freeze({
  NOT_PROVEN: "NOT_PROVEN_NO_ACCESS_AND_DISTINCTIVE_MATCH",
  REVIEW: "REVIEW_REQUIRED_NO_AUTOMATIC_DERIVATION_FINDING"
});

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireUniqueTextArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const normalized = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(normalized).size !== normalized.length) throw new TypeError(`${label} contains duplicates`);
  return normalized;
}

export function validateMatrix(matrix) {
  if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
    throw new TypeError("matrix must be an object");
  }
  if (!Array.isArray(matrix.systems) || matrix.systems.length < 2) {
    throw new TypeError("matrix.systems must contain at least two systems");
  }
  const ids = new Set();
  for (const [index, system] of matrix.systems.entries()) {
    const id = requireText(system.id, `systems[${index}].id`);
    if (ids.has(id)) throw new TypeError(`duplicate system id: ${id}`);
    ids.add(id);
    requireText(system.label, `systems[${index}].label`);
    requireUniqueTextArray(system.sourceIds, `systems[${index}].sourceIds`);
    requireUniqueTextArray(system.exactFeatureIds, `systems[${index}].exactFeatureIds`);
    requireUniqueTextArray(system.broadMotifIds, `systems[${index}].broadMotifIds`);
  }
  return matrix;
}

function systemById(matrix, id) {
  const found = matrix.systems.find((system) => system.id === id);
  if (!found) throw new RangeError(`unknown system id: ${id}`);
  return found;
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).sort();
}

export function compareSystems(matrix, leftId, rightId) {
  validateMatrix(matrix);
  if (leftId === rightId) throw new RangeError("comparison requires two different systems");
  const left = systemById(matrix, leftId);
  const right = systemById(matrix, rightId);
  const exactSharedFeatureIds = intersection(left.exactFeatureIds, right.exactFeatureIds);
  const sharedBroadMotifIds = intersection(left.broadMotifIds, right.broadMotifIds);
  return {
    leftId,
    rightId,
    exactSharedFeatureIds,
    sharedBroadMotifIds,
    overlapState: exactSharedFeatureIds.length
      ? "EXACT_FEATURE_OVERLAP_REQUIRES_FUNCTION_AND_PROVENANCE_REVIEW"
      : sharedBroadMotifIds.length
        ? "BROAD_MOTIF_OVERLAP_ONLY"
        : "NO_REGISTERED_OVERLAP",
    semantics: "OVERLAP_DOES_NOT_ESTABLISH_ACCESS_DERIVATION_COPYING_INVENTORSHIP_OR_PAYMENT"
  };
}

export function assessDerivation({ comparison, accessEvidenceIds = [], distinctiveMatchEvidenceIds = [] }) {
  if (!comparison || typeof comparison !== "object") throw new TypeError("comparison is required");
  const access = requireUniqueTextArray(accessEvidenceIds, "accessEvidenceIds");
  const matches = requireUniqueTextArray(distinctiveMatchEvidenceIds, "distinctiveMatchEvidenceIds");
  if (access.length === 0 || matches.length === 0) {
    return {
      state: DERIVATION_STATES.NOT_PROVEN,
      missing: [
        ...(access.length ? [] : ["SOURCE_BOUND_ACCESS_EVIDENCE"]),
        ...(matches.length ? [] : ["DISTINCTIVE_FUNCTION_LEVEL_MATCH_EVIDENCE"])
      ]
    };
  }
  return {
    state: DERIVATION_STATES.REVIEW,
    accessEvidenceIds: access,
    distinctiveMatchEvidenceIds: matches,
    semantics: "INPUTS_MAKE_REVIEW_POSSIBLE_BUT_DO_NOT_AUTOMATICALLY_PROVE_DERIVATION"
  };
}

export function preserveIdentifier(value) {
  return requireText(value, "identifier");
}

function loadDefaultMatrix() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, "component-matrix.json"), "utf8"));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  const [leftId, rightId] = process.argv.slice(2);
  if (!leftId || !rightId) {
    console.error("usage: node audit-lens.mjs <left-system-id> <right-system-id>");
    process.exit(1);
  }
  try {
    const comparison = compareSystems(loadDefaultMatrix(), leftId, rightId);
    console.log(JSON.stringify({
      comparison,
      derivation: assessDerivation({ comparison })
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
