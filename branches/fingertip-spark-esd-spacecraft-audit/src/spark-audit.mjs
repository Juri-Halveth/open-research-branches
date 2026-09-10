import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPORT_REVIEW_OPEN = "USER_REPORTED_OBSERVATION_PRESERVED_REVIEW_OPEN";
export const MECHANISM_UNKNOWN = "UNKNOWN";
export const SPACECRAFT_BRIDGE = "SOURCE_BOUND_ESD_RISK_ANALOGY_ONLY";
export const NEXT_SAFE_EDGE = "PASSIVE_TWO_CAMERA_DIFFERENT_ANGLE_CAPTURE_WITH_FIXED_BACKGROUND_AND_LOCAL_ORIGINALS";

export const MODEL_IDS = Object.freeze([
  "ESD_CONTACT_DISCHARGE",
  "TRIBOELECTRIC_PRECHARGE",
  "CORONA_OR_BRUSH_DISCHARGE",
  "ST_ELMO_ATMOSPHERIC_CORONA",
  "CAMERA_OR_LIGHT_ARTIFACT",
  "ULTRAWEAK_PHOTON_EMISSION"
]);

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u;
const EVIDENCE_STATES = new Set([
  "OBSERVED",
  "STRONGLY_SUPPORTED",
  "INFERRED",
  "UNKNOWN",
  "NOT_PROVEN",
  "FALSIFIED"
]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requirePlainObject(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain object`);
  return value;
}

function requireAllowedKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key)).sort();
  if (unknown.length) throw new TypeError(`${label} contains unknown keys: ${unknown.join(", ")}`);
}

function requireText(value, label) {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new TypeError(`${label} must be an exact non-empty trimmed string`);
  }
  return value;
}

function requireId(value, label) {
  const id = requireText(value, label);
  if (!ID_PATTERN.test(id)) throw new TypeError(`${label} must be an exact ASCII identifier`);
  return id;
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean`);
  return value;
}

function requireOptionalBoolean(record, key, label) {
  if (record[key] !== undefined) requireBoolean(record[key], `${label}.${key}`);
}

function requireFiniteNumberInRange(value, min, max, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`${label} must be a finite number from ${min} through ${max}`);
  }
  return value;
}

function requireUniqueIds(value, label, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  if (value.length < min || value.length > max) {
    throw new RangeError(`${label} must contain from ${min} through ${max} entries`);
  }
  const ids = value.map((item, index) => requireId(item, `${label}[${index}]`));
  if (new Set(ids).size !== ids.length) throw new TypeError(`${label} contains duplicates`);
  return ids;
}

function requireUniqueTexts(value, label, { min = 0 } = {}) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  if (value.length < min) throw new RangeError(`${label} must contain at least ${min} entries`);
  const texts = value.map((item, index) => requireText(item, `${label}[${index}]`));
  if (new Set(texts).size !== texts.length) throw new TypeError(`${label} contains duplicates`);
  return texts;
}

function requireDateOrInstant(value, label) {
  const text = requireText(value, label);
  if (!DATE_PATTERN.test(text) && !INSTANT_PATTERN.test(text)) {
    throw new TypeError(`${label} must be an ISO date or timezone-bound instant`);
  }
  const parsed = Date.parse(DATE_PATTERN.test(text) ? `${text}T00:00:00Z` : text);
  if (!Number.isFinite(parsed)) throw new TypeError(`${label} must be a valid date or instant`);
  const [year, month, day] = text.slice(0, 10).split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year
    || calendar.getUTCMonth() !== month - 1
    || calendar.getUTCDate() !== day
  ) {
    throw new TypeError(`${label} must be a valid calendar date`);
  }
  return text;
}

function requirePublicUrl(value, label) {
  const text = requireText(value, label);
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new TypeError(`${label} must be an absolute URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError(`${label} must use http or https`);
  }
  return text;
}

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("receipt contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new TypeError("receipt contains a non-JSON value");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function frozenReceipt(payload) {
  const body = { receiptVersion: "1.0.0", ...payload };
  const receiptDigest = `sha256:${createHash("sha256").update(canonicalJson(body), "utf8").digest("hex")}`;
  return deepFreeze({ ...body, receiptDigest });
}

function validateReport(report) {
  requirePlainObject(report, "report");
  requireAllowedKeys(
    report,
    new Set(["reportId", "reportingActorId", "sourceExpression", "eventTime", "recordedAt"]),
    "report"
  );
  requireId(report.reportId, "report.reportId");
  requireId(report.reportingActorId, "report.reportingActorId");
  requireText(report.sourceExpression, "report.sourceExpression");
  if (report.eventTime !== undefined) requireDateOrInstant(report.eventTime, "report.eventTime");
  if (report.recordedAt !== undefined) requireDateOrInstant(report.recordedAt, "report.recordedAt");
  return { ...report };
}

function validateContext(context) {
  requirePlainObject(context, "comparisonEvidence.context");
  requireAllowedKeys(
    context,
    new Set([
      "humidityPercent",
      "priorSurfaceMotion",
      "floorMaterialId",
      "clothingMaterialIds",
      "externalHighFieldSourceId",
      "atmosphericFieldSourceId"
    ]),
    "comparisonEvidence.context"
  );
  if (context.humidityPercent !== undefined) {
    requireFiniteNumberInRange(context.humidityPercent, 0, 100, "comparisonEvidence.context.humidityPercent");
  }
  requireOptionalBoolean(context, "priorSurfaceMotion", "comparisonEvidence.context");
  if (context.floorMaterialId !== undefined) requireId(context.floorMaterialId, "comparisonEvidence.context.floorMaterialId");
  if (context.clothingMaterialIds !== undefined) {
    requireUniqueIds(context.clothingMaterialIds, "comparisonEvidence.context.clothingMaterialIds");
  }
  if (context.externalHighFieldSourceId !== undefined) {
    requireId(context.externalHighFieldSourceId, "comparisonEvidence.context.externalHighFieldSourceId");
  }
  if (context.atmosphericFieldSourceId !== undefined) {
    requireId(context.atmosphericFieldSourceId, "comparisonEvidence.context.atmosphericFieldSourceId");
  }
  return { ...context };
}

function validateObservations(observations) {
  requirePlainObject(observations, "comparisonEvidence.observations");
  requireAllowedKeys(
    observations,
    new Set([
      "contactOrSmallGapObserved",
      "clickHeard",
      "stingFelt",
      "sustainedGlowWithoutContact",
      "visibleWithoutCamera",
      "fixedAtSameSensorCoordinates",
      "movesWithViewAngle"
    ]),
    "comparisonEvidence.observations"
  );
  for (const key of Object.keys(observations)) {
    requireBoolean(observations[key], `comparisonEvidence.observations.${key}`);
  }
  return { ...observations };
}

function validateMultiViewCapture(capture) {
  requirePlainObject(capture, "comparisonEvidence.multiViewCapture");
  requireAllowedKeys(
    capture,
    new Set(["cameraIds", "eventVisibleCameraIds", "originalFileReceiptIds", "sameEventBasisId"]),
    "comparisonEvidence.multiViewCapture"
  );
  const cameraIds = requireUniqueIds(capture.cameraIds, "comparisonEvidence.multiViewCapture.cameraIds", { min: 2, max: 2 });
  const eventVisibleCameraIds = requireUniqueIds(
    capture.eventVisibleCameraIds,
    "comparisonEvidence.multiViewCapture.eventVisibleCameraIds",
    { max: 2 }
  );
  for (const cameraId of eventVisibleCameraIds) {
    if (!cameraIds.includes(cameraId)) {
      throw new TypeError("comparisonEvidence.multiViewCapture.eventVisibleCameraIds must be a subset of cameraIds");
    }
  }
  if (capture.originalFileReceiptIds !== undefined) {
    requireUniqueIds(capture.originalFileReceiptIds, "comparisonEvidence.multiViewCapture.originalFileReceiptIds", { max: 2 });
  }
  if (capture.sameEventBasisId !== undefined) {
    requireId(capture.sameEventBasisId, "comparisonEvidence.multiViewCapture.sameEventBasisId");
  }
  return {
    ...capture,
    cameraIds,
    eventVisibleCameraIds
  };
}

function validateComparisonEvidence(comparisonEvidence) {
  if (comparisonEvidence === undefined) return {};
  requirePlainObject(comparisonEvidence, "comparisonEvidence");
  requireAllowedKeys(
    comparisonEvidence,
    new Set(["context", "observations", "multiViewCapture", "sourceIds"]),
    "comparisonEvidence"
  );
  const result = {};
  if (comparisonEvidence.context !== undefined) result.context = validateContext(comparisonEvidence.context);
  if (comparisonEvidence.observations !== undefined) result.observations = validateObservations(comparisonEvidence.observations);
  if (comparisonEvidence.multiViewCapture !== undefined) {
    result.multiViewCapture = validateMultiViewCapture(comparisonEvidence.multiViewCapture);
  }
  if (comparisonEvidence.sourceIds !== undefined) {
    result.sourceIds = requireUniqueIds(comparisonEvidence.sourceIds, "comparisonEvidence.sourceIds");
  }
  return result;
}

export function validateSourcesDocument(document) {
  requirePlainObject(document, "sourcesDocument");
  requireAllowedKeys(
    document,
    new Set(["schemaVersion", "accessedAt", "collectionState", "sources", "claimCeiling"]),
    "sourcesDocument"
  );
  if (document.schemaVersion !== "fingertip-spark-sources.v1") {
    throw new TypeError("sourcesDocument.schemaVersion must be fingertip-spark-sources.v1");
  }
  requireDateOrInstant(document.accessedAt, "sourcesDocument.accessedAt");
  requireText(document.collectionState, "sourcesDocument.collectionState");
  requireText(document.claimCeiling, "sourcesDocument.claimCeiling");
  if (!Array.isArray(document.sources) || document.sources.length === 0) {
    throw new TypeError("sourcesDocument.sources must be a non-empty array");
  }
  const ids = new Set();
  for (const [index, source] of document.sources.entries()) {
    const label = `sourcesDocument.sources[${index}]`;
    requirePlainObject(source, label);
    requireAllowedKeys(
      source,
      new Set(["id", "title", "publisher", "sourceType", "url", "publishedAt", "claimBound", "evidenceState"]),
      label
    );
    const id = requireId(source.id, `${label}.id`);
    if (ids.has(id)) throw new TypeError(`duplicate source id: ${id}`);
    ids.add(id);
    requireText(source.title, `${label}.title`);
    requireText(source.publisher, `${label}.publisher`);
    requireId(source.sourceType, `${label}.sourceType`);
    requirePublicUrl(source.url, `${label}.url`);
    if (source.publishedAt !== undefined) requireDateOrInstant(source.publishedAt, `${label}.publishedAt`);
    requireText(source.claimBound, `${label}.claimBound`);
    if (!EVIDENCE_STATES.has(source.evidenceState)) throw new TypeError(`${label}.evidenceState is not allowed`);
  }
  return document;
}

export function validateModelMatrix(document, sourceIds) {
  requirePlainObject(document, "modelMatrix");
  requireAllowedKeys(
    document,
    new Set(["schemaVersion", "asOf", "sourceExpressionState", "mechanismState", "models", "claimCeiling"]),
    "modelMatrix"
  );
  if (document.schemaVersion !== "fingertip-spark-model-matrix.v1") {
    throw new TypeError("modelMatrix.schemaVersion must be fingertip-spark-model-matrix.v1");
  }
  requireDateOrInstant(document.asOf, "modelMatrix.asOf");
  if (document.sourceExpressionState !== "USER_REPORTED_OBSERVATION") {
    throw new TypeError("modelMatrix.sourceExpressionState must preserve USER_REPORTED_OBSERVATION");
  }
  if (document.mechanismState !== MECHANISM_UNKNOWN) {
    throw new TypeError("modelMatrix.mechanismState must remain UNKNOWN");
  }
  requireText(document.claimCeiling, "modelMatrix.claimCeiling");
  if (!Array.isArray(document.models)) throw new TypeError("modelMatrix.models must be an array");
  const seen = new Set();
  for (const [index, model] of document.models.entries()) {
    const label = `modelMatrix.models[${index}]`;
    requirePlainObject(model, label);
    requireAllowedKeys(
      model,
      new Set([
        "id", "label", "role", "sourceIds", "predictedObservableIds", "distinguishingObservationIds",
        "safetyBoundary", "relationToReport", "evidenceState"
      ]),
      label
    );
    const id = requireId(model.id, `${label}.id`);
    if (!MODEL_IDS.includes(id)) throw new TypeError(`${label}.id is not in the closed model registry`);
    if (seen.has(id)) throw new TypeError(`duplicate model id: ${id}`);
    seen.add(id);
    requireText(model.label, `${label}.label`);
    requireId(model.role, `${label}.role`);
    const refs = requireUniqueIds(model.sourceIds, `${label}.sourceIds`, { min: 1 });
    for (const sourceId of refs) {
      if (!sourceIds.has(sourceId)) throw new TypeError(`${label}.sourceIds contains unknown source: ${sourceId}`);
    }
    requireUniqueIds(model.predictedObservableIds, `${label}.predictedObservableIds`, { min: 1 });
    requireUniqueIds(model.distinguishingObservationIds, `${label}.distinguishingObservationIds`, { min: 1 });
    requireId(model.safetyBoundary, `${label}.safetyBoundary`);
    if (model.relationToReport !== MECHANISM_UNKNOWN) {
      throw new TypeError(`${label}.relationToReport must remain UNKNOWN`);
    }
    if (!EVIDENCE_STATES.has(model.evidenceState)) throw new TypeError(`${label}.evidenceState is not allowed`);
  }
  if (seen.size !== MODEL_IDS.length || MODEL_IDS.some((id) => !seen.has(id))) {
    throw new TypeError("modelMatrix.models must contain every registered model exactly once");
  }
  return document;
}

export function validateObservationProtocol(document) {
  requirePlainObject(document, "observationProtocol");
  requireAllowedKeys(
    document,
    new Set([
      "schemaVersion", "protocolId", "recordKind", "state", "scope", "authoritySource", "riskClass",
      "capturePlan", "contextFields", "coverage", "stopConditions", "prohibitedActions", "claimCeiling"
    ]),
    "observationProtocol"
  );
  if (document.schemaVersion !== "fingertip-spark-passive-observation-plan.v1") {
    throw new TypeError("observationProtocol.schemaVersion must be fingertip-spark-passive-observation-plan.v1");
  }
  requireId(document.protocolId, "observationProtocol.protocolId");
  if (document.recordKind !== "PLAN") throw new TypeError("observationProtocol.recordKind must be PLAN");
  requireId(document.state, "observationProtocol.state");
  requireText(document.scope, "observationProtocol.scope");
  requireText(document.authoritySource, "observationProtocol.authoritySource");
  if (document.riskClass !== "PASSIVE_OBSERVATION_ONLY") {
    throw new TypeError("observationProtocol.riskClass must be PASSIVE_OBSERVATION_ONLY");
  }
  requirePlainObject(document.capturePlan, "observationProtocol.capturePlan");
  requireAllowedKeys(
    document.capturePlan,
    new Set([
      "eventRootId", "observationPlans", "sameEventRule", "fixedBackgroundRequired",
      "originalFilesStayLocal", "publicDerivative"
    ]),
    "observationProtocol.capturePlan"
  );
  requireId(document.capturePlan.eventRootId, "observationProtocol.capturePlan.eventRootId");
  if (!Array.isArray(document.capturePlan.observationPlans) || document.capturePlan.observationPlans.length !== 3) {
    throw new TypeError("observationProtocol.capturePlan.observationPlans must contain exactly three planned views");
  }
  const observationIds = new Set();
  for (const [index, plan] of document.capturePlan.observationPlans.entries()) {
    const label = `observationProtocol.capturePlan.observationPlans[${index}]`;
    requirePlainObject(plan, label);
    requireAllowedKeys(plan, new Set(["observationId", "kind", "position", "startAt", "stopAt"]), label);
    const id = requireId(plan.observationId, `${label}.observationId`);
    if (observationIds.has(id)) throw new TypeError(`duplicate observation id: ${id}`);
    observationIds.add(id);
    if (plan.kind !== "VIDEO" && plan.kind !== "AUDIO") throw new TypeError(`${label}.kind is not allowed`);
    requireId(plan.position, `${label}.position`);
    if (plan.startAt !== null || plan.stopAt !== null) {
      throw new TypeError(`${label} is a PLAN and must keep startAt and stopAt null`);
    }
  }
  requireId(document.capturePlan.sameEventRule, "observationProtocol.capturePlan.sameEventRule");
  if (document.capturePlan.fixedBackgroundRequired !== true) {
    throw new TypeError("observationProtocol.capturePlan.fixedBackgroundRequired must be true");
  }
  if (document.capturePlan.originalFilesStayLocal !== true) {
    throw new TypeError("observationProtocol.capturePlan.originalFilesStayLocal must be true");
  }
  requireId(document.capturePlan.publicDerivative, "observationProtocol.capturePlan.publicDerivative");
  requireUniqueIds(document.contextFields, "observationProtocol.contextFields", { min: 1 });
  requirePlainObject(document.coverage, "observationProtocol.coverage");
  requireAllowedKeys(
    document.coverage,
    new Set(["temporal", "object", "layer", "privilege", "sensor", "captureReliability", "noEventClaimCeiling"]),
    "observationProtocol.coverage"
  );
  for (const [key, value] of Object.entries(document.coverage)) requireId(value, `observationProtocol.coverage.${key}`);
  const stopConditions = requireUniqueIds(document.stopConditions, "observationProtocol.stopConditions", { min: 1 });
  const prohibitedActions = requireUniqueIds(document.prohibitedActions, "observationProtocol.prohibitedActions", { min: 1 });
  if (!prohibitedActions.includes("INTENTIONAL_HIGH_VOLTAGE_GENERATION")) {
    throw new TypeError("observationProtocol must prohibit intentional high-voltage generation");
  }
  if (!stopConditions.includes("ANY_REQUEST_TO_CREATE_OR_APPROACH_HIGH_VOLTAGE")) {
    throw new TypeError("observationProtocol must stop at a high-voltage request");
  }
  requireId(document.claimCeiling, "observationProtocol.claimCeiling");
  return document;
}

function stateForModels(evidence) {
  const context = evidence.context ?? {};
  const observations = evidence.observations ?? {};
  const capture = evidence.multiViewCapture;
  const models = Object.fromEntries(MODEL_IDS.map((id) => [id, "OPEN_NO_COMPARISON_EVIDENCE"]));

  if (
    observations.contactOrSmallGapObserved === true
    || observations.clickHeard === true
    || observations.stingFelt === true
  ) {
    models.ESD_CONTACT_DISCHARGE = "FEATURE_COMPATIBLE_NOT_SELECTED";
  }

  if (
    context.priorSurfaceMotion === true
    || context.humidityPercent !== undefined
    || context.floorMaterialId !== undefined
    || (context.clothingMaterialIds?.length ?? 0) > 0
  ) {
    models.TRIBOELECTRIC_PRECHARGE = "PRECHARGE_CONTEXT_RECORDED_NOT_SELECTED";
  }

  if (observations.sustainedGlowWithoutContact === true) {
    models.CORONA_OR_BRUSH_DISCHARGE = context.externalHighFieldSourceId
      ? "FEATURE_AND_FIELD_CONTEXT_COMPATIBLE_NOT_SELECTED"
      : "SUSTAINED_FEATURE_REPORTED_HIGH_FIELD_SOURCE_UNBOUND";
  } else {
    models.CORONA_OR_BRUSH_DISCHARGE = "HIGH_FIELD_REQUIRED_NOT_BOUND";
  }

  models.ST_ELMO_ATMOSPHERIC_CORONA = context.atmosphericFieldSourceId
    ? "ATMOSPHERIC_FIELD_CONTEXT_COMPATIBLE_NOT_SELECTED"
    : "ATMOSPHERIC_FIELD_CONTEXT_UNBOUND";

  const oneCameraOnly = capture?.eventVisibleCameraIds?.length === 1;
  const bothCamerasWithBasis = capture?.eventVisibleCameraIds?.length === 2 && capture.sameEventBasisId !== undefined;
  if (bothCamerasWithBasis) {
    models.CAMERA_OR_LIGHT_ARTIFACT = "MULTI_VIEW_EVENT_RECORDED_NOT_MECHANISM_PROOF";
  } else if (
    oneCameraOnly
    || observations.fixedAtSameSensorCoordinates === true
    || observations.movesWithViewAngle === true
  ) {
    models.CAMERA_OR_LIGHT_ARTIFACT = "CAMERA_ARTIFACT_FEATURE_COMPATIBLE_NOT_SELECTED";
  }

  models.ULTRAWEAK_PHOTON_EMISSION = observations.visibleWithoutCamera === true
    ? "SOURCE_BOUND_INTENSITY_MISMATCH_FOR_NAKED_EYE_SPARK"
    : "INSTRUMENT_ONLY_CANDIDATE_NOT_TESTED";

  return models;
}

export function assessFingertipSpark({
  report,
  comparisonEvidence,
  sourcesDocument,
  modelMatrix,
  observationProtocol
}) {
  const checkedReport = validateReport(report);
  const checkedEvidence = validateComparisonEvidence(comparisonEvidence);
  validateSourcesDocument(sourcesDocument);
  const sourceIds = new Set(sourcesDocument.sources.map((source) => source.id));
  validateModelMatrix(modelMatrix, sourceIds);
  validateObservationProtocol(observationProtocol);
  for (const sourceId of checkedEvidence.sourceIds ?? []) {
    if (!sourceIds.has(sourceId)) throw new TypeError(`comparisonEvidence.sourceIds contains unknown source: ${sourceId}`);
  }

  return frozenReceipt({
    receiptType: "FINGERTIP_SPARK_SOURCE_BOUND_AUDIT",
    report: checkedReport,
    intakeState: REPORT_REVIEW_OPEN,
    observationState: "USER_REPORTED_OBSERVATION_PRESERVED",
    comparisonEvidenceState: Object.keys(checkedEvidence).length
      ? "OPTIONAL_COMPARISON_EVIDENCE_RECORDED"
      : "NO_COMPARISON_EVIDENCE_REQUIRED_FOR_REVIEW",
    mechanismState: MECHANISM_UNKNOWN,
    modelStates: stateForModels(checkedEvidence),
    spacecraftElectronicsBridge: {
      state: SPACECRAFT_BRIDGE,
      sourceIds: ["NIST_TN_1314_ESD_FIELDS", "NASA_ESD_COMPENDIUM_2018"],
      relationType: "ENGINEERING_ANALOGY_AND_RESEARCH_ROUTE",
      model: "CHARGE_GENERATION_TO_ENDPOINT_FIELD_TO_THRESHOLD_EVENT_TO_LIGHT_SOUND_OR_EM_DISTURBANCE_TO_EQUALIZATION_TO_PROTECTION_AND_MEASUREMENT"
    },
    nextSafeEdge: NEXT_SAFE_EDGE,
    protocolId: observationProtocol.protocolId,
    automaticFindings: {
      mechanismIdentified: false,
      spacecraftProven: false,
      technologyOwnershipProven: false,
      externalCopyingProven: false,
      externalCausalInfluenceProven: false,
      legalEntitlementProven: false,
      paymentAmountEstablished: false
    },
    claimCeiling: "USER_REPORTED_OBSERVATION_PRESERVED_COMPETING_MODELS_AND_ESD_SPACECRAFT_ELECTRONICS_BRIDGE_SOURCE_BOUND_MECHANISM_UNKNOWN"
  });
}

function loadJson(fileName) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.resolve(here, "..", fileName), "utf8"));
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked && invoked === fileURLToPath(import.meta.url)) {
  try {
    const result = assessFingertipSpark({
      report: {
        reportId: "PUBLIC_REPORT_2026_09_10",
        reportingActorId: "PUBLIC_REPORTER",
        sourceExpression: "Fuenktchen wie Thor an meinen Fingern"
      },
      sourcesDocument: loadJson("sources.json"),
      modelMatrix: loadJson("model-matrix.json"),
      observationProtocol: loadJson("observation-protocol.json")
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
