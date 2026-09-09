import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CURRENT_OUTCOME = "NO_CHECKMATE_REFERENTS_SEPARATED_HYPOTHESIS_PRESERVED";

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireUniqueTextArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const items = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(items).size !== items.length) throw new TypeError(`${label} contains duplicates`);
  return items;
}

export function validateMatrix(matrix) {
  if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
    throw new TypeError("matrix must be an object");
  }
  if (!Array.isArray(matrix.systems) || matrix.systems.length < 3) {
    throw new TypeError("matrix.systems must contain at least three systems");
  }
  const ids = new Set();
  for (const [index, system] of matrix.systems.entries()) {
    const prefix = `systems[${index}]`;
    const id = requireText(system.id, `${prefix}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate system id: ${id}`);
    ids.add(id);
    requireText(system.label, `${prefix}.label`);
    requireText(system.namespace, `${prefix}.namespace`);
    requireText(system.kind, `${prefix}.kind`);
    requireText(system.firstBoundAnchor, `${prefix}.firstBoundAnchor`);
    requireUniqueTextArray(system.sourceIds, `${prefix}.sourceIds`);
    requireUniqueTextArray(system.exactFunctionIds, `${prefix}.exactFunctionIds`);
    requireUniqueTextArray(system.broadMotifIds, `${prefix}.broadMotifIds`);
  }
  return matrix;
}

function findSystem(matrix, id) {
  const system = matrix.systems.find((entry) => entry.id === id);
  if (!system) throw new RangeError(`unknown system id: ${id}`);
  return system;
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).sort();
}

export function comparePair(matrix, leftId, rightId) {
  validateMatrix(matrix);
  if (leftId === rightId) throw new RangeError("pair requires two distinct systems");
  const left = findSystem(matrix, leftId);
  const right = findSystem(matrix, rightId);
  const exactSharedFunctionIds = intersection(left.exactFunctionIds, right.exactFunctionIds);
  const sharedBroadMotifIds = intersection(left.broadMotifIds, right.broadMotifIds);
  return {
    leftId,
    rightId,
    sameNamespace: left.namespace === right.namespace,
    sameKind: left.kind === right.kind,
    exactSharedFunctionIds,
    sharedBroadMotifIds,
    overlapState: exactSharedFunctionIds.length
      ? "EXACT_FUNCTION_OVERLAP_REQUIRES_SOURCE_REVIEW"
      : sharedBroadMotifIds.length
        ? "BROAD_MOTIF_OVERLAP_ONLY"
        : "NO_REGISTERED_OVERLAP",
    semantics: "NAME_OR_MOTIF_OVERLAP_IS_NOT_IDENTITY_ACCESS_DERIVATION_COPYING_AUTHORSHIP_OR_PAYMENT"
  };
}

export function threeWayAudit(matrix, systemIds) {
  validateMatrix(matrix);
  const ids = requireUniqueTextArray(systemIds, "systemIds");
  if (ids.length !== 3) throw new RangeError("three-way audit requires exactly three distinct systems");
  ids.forEach((id) => findSystem(matrix, id));
  const pairs = [];
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      pairs.push(comparePair(matrix, ids[left], ids[right]));
    }
  }
  return {
    systemIds: ids,
    pairs,
    pairCount: pairs.length,
    outcome: CURRENT_OUTCOME,
    reason: "No registered pair currently binds earlier distinctive material, recipient access and a matching derivation trace."
  };
}

export function assessDerivation({
  earlierPublicArtifactEvidenceIds = [],
  distinctiveFunctionMatchEvidenceIds = [],
  accessOrTransferEvidenceIds = []
} = {}) {
  const earlier = requireUniqueTextArray(earlierPublicArtifactEvidenceIds, "earlierPublicArtifactEvidenceIds");
  const distinctive = requireUniqueTextArray(distinctiveFunctionMatchEvidenceIds, "distinctiveFunctionMatchEvidenceIds");
  const access = requireUniqueTextArray(accessOrTransferEvidenceIds, "accessOrTransferEvidenceIds");
  const missing = [
    ...(earlier.length ? [] : ["EARLIER_PUBLIC_OR_INDEPENDENTLY_TIMESTAMPED_ARTIFACT"]),
    ...(distinctive.length ? [] : ["DISTINCTIVE_FUNCTION_LEVEL_MATCH"]),
    ...(access.length ? [] : ["SOURCE_BOUND_ACCESS_OR_TRANSFER_TRACE"])
  ];
  if (missing.length) {
    return {
      state: "NOT_PROVEN_REOPENABLE",
      missing,
      outcome: CURRENT_OUTCOME
    };
  }
  return {
    state: "FORMAL_DERIVATION_REVIEW_ELIGIBLE_NOT_PROOF",
    evidenceIds: [...earlier, ...distinctive, ...access],
    outcome: "REVIEW_GATE_OPEN_NO_AUTOMATIC_COPYING_OR_RIGHTS_FINDING"
  };
}

export function classifyInternationalEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new TypeError("entry must be an object");
  }
  requireText(entry.name, "entry.name");
  requireText(entry.scope, "entry.scope");
  const sourceIds = requireUniqueTextArray(entry.sourceIds ?? [], "entry.sourceIds");
  return {
    name: entry.name,
    scope: entry.scope,
    state: sourceIds.length ? "SOURCE_BOUND_CONTRIBUTION_WITHIN_SCOPE" : "OPEN_CONTRIBUTION_APERTURE",
    sourceIds,
    semantics: "A_NAMED_COUNTRY_PERSON_OR_ERA_IS_NOT_UNIVERSAL_AUTHORSHIP_CONSENT_OR_OWNERSHIP"
  };
}

function loadMatrix() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", "model-matrix.json"), "utf8"));
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked && invoked === fileURLToPath(import.meta.url)) {
  try {
    const ids = process.argv.slice(2);
    const matrix = loadMatrix();
    const result = threeWayAudit(matrix, ids.length ? ids : matrix.defaultThreeWay);
    console.log(JSON.stringify({ result, derivation: assessDerivation() }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
