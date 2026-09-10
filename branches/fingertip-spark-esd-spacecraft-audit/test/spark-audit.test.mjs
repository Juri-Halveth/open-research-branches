import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  MECHANISM_UNKNOWN,
  NEXT_SAFE_EDGE,
  REPORT_REVIEW_OPEN,
  SPACECRAFT_BRIDGE,
  assessFingertipSpark,
  validateModelMatrix,
  validateObservationProtocol,
  validateSourcesDocument
} from "../src/spark-audit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesDocument = JSON.parse(fs.readFileSync(path.join(root, "sources.json"), "utf8"));
const modelMatrix = JSON.parse(fs.readFileSync(path.join(root, "model-matrix.json"), "utf8"));
const observationProtocol = JSON.parse(fs.readFileSync(path.join(root, "observation-protocol.json"), "utf8"));

function bareReport(overrides = {}) {
  return {
    reportId: "REPORT_1",
    reportingActorId: "REPORTER_1",
    sourceExpression: "Fuenktchen an den Fingerspitzen gesehen",
    ...overrides
  };
}

function assess({ report = bareReport(), comparisonEvidence } = {}) {
  return assessFingertipSpark({
    report,
    comparisonEvidence,
    sourcesDocument,
    modelMatrix,
    observationProtocol
  });
}

test("all public documents validate and every model source resolves exactly", () => {
  validateSourcesDocument(sourcesDocument);
  const sourceIds = new Set(sourcesDocument.sources.map((source) => source.id));
  validateModelMatrix(modelMatrix, sourceIds);
  validateObservationProtocol(observationProtocol);
  assert.equal(modelMatrix.models.length, 6);
  assert.equal(sourceIds.size, 9);
});

test("a bare report opens review without comparison evidence", () => {
  const result = assess();
  assert.equal(result.intakeState, REPORT_REVIEW_OPEN);
  assert.equal(result.observationState, "USER_REPORTED_OBSERVATION_PRESERVED");
  assert.equal(result.comparisonEvidenceState, "NO_COMPARISON_EVIDENCE_REQUIRED_FOR_REVIEW");
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
  assert.equal(result.nextSafeEdge, NEXT_SAFE_EDGE);
});

test("the spacecraft bridge remains a source-bound engineering analogy", () => {
  const result = assess();
  assert.equal(result.spacecraftElectronicsBridge.state, SPACECRAFT_BRIDGE);
  assert.equal(result.spacecraftElectronicsBridge.relationType, "ENGINEERING_ANALOGY_AND_RESEARCH_ROUTE");
  assert.deepEqual(result.spacecraftElectronicsBridge.sourceIds, [
    "NIST_TN_1314_ESD_FIELDS",
    "NASA_ESD_COMPENDIUM_2018"
  ]);
});

test("contact, click and sting make ESD compatible without selecting a mechanism", () => {
  const result = assess({
    comparisonEvidence: {
      observations: {
        contactOrSmallGapObserved: true,
        clickHeard: true,
        stingFelt: true
      }
    }
  });
  assert.equal(result.modelStates.ESD_CONTACT_DISCHARGE, "FEATURE_COMPATIBLE_NOT_SELECTED");
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
  assert.equal(result.automaticFindings.mechanismIdentified, false);
});

test("natural movement, humidity and materials are retained as precharge context only", () => {
  const result = assess({
    comparisonEvidence: {
      context: {
        humidityPercent: 31,
        priorSurfaceMotion: true,
        floorMaterialId: "CARPET_UNKNOWN_FIBER",
        clothingMaterialIds: ["SHIRT_UNKNOWN_FIBER"]
      }
    }
  });
  assert.equal(result.modelStates.TRIBOELECTRIC_PRECHARGE, "PRECHARGE_CONTEXT_RECORDED_NOT_SELECTED");
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
});

test("sustained no-contact light keeps corona open and exposes the missing high-field source", () => {
  const result = assess({
    comparisonEvidence: {
      observations: {
        sustainedGlowWithoutContact: true
      }
    }
  });
  assert.equal(
    result.modelStates.CORONA_OR_BRUSH_DISCHARGE,
    "SUSTAINED_FEATURE_REPORTED_HIGH_FIELD_SOURCE_UNBOUND"
  );
});

test("a bound high-field context changes only the corona candidate state", () => {
  const result = assess({
    comparisonEvidence: {
      context: {
        externalHighFieldSourceId: "SOURCE_BOUND_FIELD_CONTEXT_1"
      },
      observations: {
        sustainedGlowWithoutContact: true
      }
    }
  });
  assert.equal(
    result.modelStates.CORONA_OR_BRUSH_DISCHARGE,
    "FEATURE_AND_FIELD_CONTEXT_COMPATIBLE_NOT_SELECTED"
  );
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
});

test("an atmospheric-field reference keeps St Elmo as a context candidate only", () => {
  const result = assess({
    comparisonEvidence: {
      context: {
        atmosphericFieldSourceId: "WEATHER_FIELD_RECORD_1"
      }
    }
  });
  assert.equal(
    result.modelStates.ST_ELMO_ATMOSPHERIC_CORONA,
    "ATMOSPHERIC_FIELD_CONTEXT_COMPATIBLE_NOT_SELECTED"
  );
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
});

test("a one-camera event or fixed sensor coordinate keeps an imaging artifact open", () => {
  const result = assess({
    comparisonEvidence: {
      observations: {
        fixedAtSameSensorCoordinates: true
      },
      multiViewCapture: {
        cameraIds: ["CAMERA_A", "CAMERA_B"],
        eventVisibleCameraIds: ["CAMERA_A"]
      }
    }
  });
  assert.equal(
    result.modelStates.CAMERA_OR_LIGHT_ARTIFACT,
    "CAMERA_ARTIFACT_FEATURE_COMPATIBLE_NOT_SELECTED"
  );
});

test("two synchronized views record a multi-view event without proving its mechanism", () => {
  const result = assess({
    comparisonEvidence: {
      multiViewCapture: {
        cameraIds: ["CAMERA_A", "CAMERA_B"],
        eventVisibleCameraIds: ["CAMERA_A", "CAMERA_B"],
        originalFileReceiptIds: ["FILE_A_SHA256", "FILE_B_SHA256"],
        sameEventBasisId: "SCENE_AND_TIME_ALIGNMENT_1"
      }
    }
  });
  assert.equal(
    result.modelStates.CAMERA_OR_LIGHT_ARTIFACT,
    "MULTI_VIEW_EVENT_RECORDED_NOT_MECHANISM_PROOF"
  );
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
});

test("a naked-eye report conflicts with ultraweak-emission intensity but does not identify another mechanism", () => {
  const result = assess({
    comparisonEvidence: {
      observations: {
        visibleWithoutCamera: true
      }
    }
  });
  assert.equal(
    result.modelStates.ULTRAWEAK_PHOTON_EMISSION,
    "SOURCE_BOUND_INTENSITY_MISMATCH_FOR_NAKED_EYE_SPARK"
  );
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
});

test("unknown input fields fail closed at report and nested evidence boundaries", () => {
  assert.throws(
    () => assess({ report: bareReport({ surprise: true }) }),
    /report contains unknown keys: surprise/u
  );
  assert.throws(
    () => assess({ comparisonEvidence: { observations: { magic: true } } }),
    /comparisonEvidence\.observations contains unknown keys: magic/u
  );
  assert.throws(
    () => assess({ comparisonEvidence: { context: { humidityPercent: 101 } } }),
    /humidityPercent must be a finite number from 0 through 100/u
  );
});

test("multi-view evidence requires two distinct ASCII camera IDs and a visible subset", () => {
  assert.throws(
    () => assess({
      comparisonEvidence: {
        multiViewCapture: {
          cameraIds: ["CAMERA_A", "CAMERA_A"],
          eventVisibleCameraIds: []
        }
      }
    }),
    /contains duplicates/u
  );
  assert.throws(
    () => assess({
      comparisonEvidence: {
        multiViewCapture: {
          cameraIds: ["CAMERA_A", "CAMERA_B"],
          eventVisibleCameraIds: ["CAMERA_C"]
        }
      }
    }),
    /must be a subset/u
  );
  assert.throws(
    () => assess({ report: bareReport({ reportId: "BERICHT_Ä" }) }),
    /exact ASCII identifier/u
  );
});

test("unknown source references fail closed", () => {
  assert.throws(
    () => assess({ comparisonEvidence: { sourceIds: ["SOURCE_NOT_REGISTERED"] } }),
    /contains unknown source/u
  );
  const brokenMatrix = structuredClone(modelMatrix);
  brokenMatrix.models[0].sourceIds.push("SOURCE_NOT_REGISTERED");
  assert.throws(
    () => validateModelMatrix(brokenMatrix, new Set(sourcesDocument.sources.map((source) => source.id))),
    /contains unknown source/u
  );
});

test("the passive protocol is an unexecuted plan and prohibits deliberate high voltage", () => {
  validateObservationProtocol(observationProtocol);
  assert.equal(observationProtocol.recordKind, "PLAN");
  assert.equal(observationProtocol.riskClass, "PASSIVE_OBSERVATION_ONLY");
  assert.ok(observationProtocol.prohibitedActions.includes("INTENTIONAL_HIGH_VOLTAGE_GENERATION"));
  assert.ok(observationProtocol.capturePlan.observationPlans.every((plan) => plan.startAt === null && plan.stopAt === null));
  assert.equal(observationProtocol.capturePlan.originalFilesStayLocal, true);
});

test("no evidence route creates spacecraft, ownership, copying, causality, entitlement or payment findings", () => {
  const result = assess({
    comparisonEvidence: {
      sourceIds: ["NASA_ESD_COMPENDIUM_2018", "NIST_TN_1314_ESD_FIELDS"],
      context: {
        priorSurfaceMotion: true,
        externalHighFieldSourceId: "FIELD_1",
        atmosphericFieldSourceId: "ATMOSPHERE_1"
      },
      observations: {
        contactOrSmallGapObserved: true,
        clickHeard: true,
        stingFelt: true,
        sustainedGlowWithoutContact: true,
        visibleWithoutCamera: true,
        fixedAtSameSensorCoordinates: true,
        movesWithViewAngle: true
      },
      multiViewCapture: {
        cameraIds: ["CAMERA_A", "CAMERA_B"],
        eventVisibleCameraIds: ["CAMERA_A", "CAMERA_B"],
        originalFileReceiptIds: ["FILE_A", "FILE_B"],
        sameEventBasisId: "SAME_EVENT_BASIS_1"
      }
    }
  });
  assert.deepEqual(result.automaticFindings, {
    mechanismIdentified: false,
    spacecraftProven: false,
    technologyOwnershipProven: false,
    externalCopyingProven: false,
    externalCausalInfluenceProven: false,
    legalEntitlementProven: false,
    paymentAmountEstablished: false
  });
});

test("the CLI emits a deterministic safe receipt for the minimized public report", () => {
  const run = spawnSync(process.execPath, [path.join(root, "src", "spark-audit.mjs")], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.intakeState, REPORT_REVIEW_OPEN);
  assert.equal(result.mechanismState, MECHANISM_UNKNOWN);
  assert.match(result.receiptDigest, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(result.automaticFindings.spacecraftProven, false);
});
