// Offline Track-A scorer for the pre-target 18–19 October 2026 tide capture.
// No network access; outcome files must be supplied explicitly after the target.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetStart = Date.UTC(2026, 9, 18, 0, 0, 0);
const stations = Object.freeze([
  ["8410140", "F5CEAD66998F819072CA7A8E6E3F71C8CDCB8123AC137025D21163D9F3517A09"],
  ["8518750", "07EEB6392F0DCDCB6DDD772993ECB88D0843124153E5FD96D9FDDD36965C6F41"],
  ["9414290", "6129FA2A7E69F52873C7DB31BFFAA195A4CC4EB4B6B43D1AEAFAB85050278C8E"],
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

function stamp(index) {
  return new Date(targetStart + index * 3_600_000).toISOString().slice(0, 16).replace("T", " ");
}

function finiteNumber(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  if (String(raw).trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readPredictions(station, expectedHash) {
  const path = join(repo, "data", "noaa-as-of-2026-10-18", `${station}_predictions_20261018_20261019.json`);
  const bytes = readFileSync(path);
  const digest = sha256(bytes);
  if (digest !== expectedHash) throw new Error(`Tide digest mismatch for ${station}`);
  const obj = JSON.parse(bytes.toString("utf8"));
  if (!Array.isArray(obj.predictions) || obj.predictions.length !== 48) {
    throw new Error(`Expected 48 tide predictions for ${station}`);
  }
  const values = obj.predictions.map((point, i) => {
    if (point.t !== stamp(i)) throw new Error(`Tide timestamp mismatch ${station} hour ${i}`);
    const value = finiteNumber(point.v);
    if (value === null) throw new Error(`Invalid tide value ${station} hour ${i}`);
    return value;
  });
  return { digest, values };
}

function readOutcomes(directory, station) {
  const path = join(directory, `${station}_hourly_height_20261018_20261019.json`);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return { status: "MISSING_OUTCOME_FILE", digest: null, points: new Map(), rejected: [] };
    throw error;
  }
  const digest = sha256(bytes);
  const obj = JSON.parse(bytes.toString("utf8"));
  if (!Array.isArray(obj.data)) {
    return { status: "NO_HOURLY_DATA", digest, points: new Map(), rejected: [] };
  }
  const points = new Map();
  const rejected = [];
  const seen = new Set();
  const expectedTimes = new Set(Array.from({ length: 48 }, (_, i) => stamp(i)));
  for (const [row, point] of obj.data.entries()) {
    const time = point?.t;
    if (typeof time !== "string") {
      rejected.push({ row, reason: "INVALID_TIME" });
      continue;
    }
    if (!expectedTimes.has(time)) {
      rejected.push({ row, reason: "OUT_OF_SCOPE_TIME" });
      continue;
    }
    if (seen.has(time)) {
      points.delete(time);
      rejected.push({ row, reason: "DUPLICATE_TIME", time });
      continue;
    }
    seen.add(time);
    points.set(time, point);
  }
  return { status: "DATA_PRESENT", digest, points, rejected };
}

function score(values, outcomes) {
  const errors = [];
  const exclusions = [...outcomes.rejected];
  for (let hour = 0; hour < 48; hour++) {
    const point = outcomes.points.get(stamp(hour));
    if (!point) {
      exclusions.push({ hour, reason: "MISSING_MEASURED_HOUR" });
      continue;
    }
    if (point.f !== "0,0") {
      exclusions.push({ hour, reason: "QUALITY_FLAG", flag: point.f ?? null });
      continue;
    }
    const actual = finiteNumber(point.v);
    if (actual === null) {
      exclusions.push({ hour, reason: "INVALID_MEASURED_VALUE" });
      continue;
    }
    errors.push(values[hour] - actual);
  }
  const n = errors.length;
  return {
    scoredPairs: n,
    excludedTargetHours: 48 - n,
    exclusions,
    maeMeters: n ? errors.reduce((sum, e) => sum + Math.abs(e), 0) / n : null,
    rmseMeters: n ? Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n) : null,
    sumAbsoluteError: errors.reduce((sum, e) => sum + Math.abs(e), 0),
    sumSquaredError: errors.reduce((sum, e) => sum + e * e, 0),
  };
}

if (process.argv.length === 3 && process.argv[2] === "--self-test") {
  const points = new Map(Array.from({ length: 48 }, (_, hour) =>
    [stamp(hour), { t: stamp(hour), v: "0.1", f: "0,0" }]));
  points.delete(stamp(0));
  points.get(stamp(1)).f = "1,0";
  const test = score(Array(48).fill(0), { points, rejected: [] });
  if (test.scoredPairs !== 46 || test.excludedTargetHours !== 2 ||
      Math.abs(test.maeMeters - 0.1) > 1e-12 ||
      Math.abs(test.rmseMeters - 0.1) > 1e-12) {
    throw new Error("Synthetic arithmetic smoke test failed");
  }
  process.stdout.write("PASS synthetic Track-A arithmetic and missing/flag exclusions\n");
  process.exit(0);
}
if (process.argv.length !== 3) {
  throw new Error("Usage: node scripts/evaluate-noaa-as-of-tide.mjs <outcome-json-directory> | --self-test");
}
const outcomeDirectory = resolve(process.argv[2]);
const rows = [];
for (const [station, expectedHash] of stations) {
  const tide = readPredictions(station, expectedHash);
  const outcomes = readOutcomes(outcomeDirectory, station);
  const result = score(tide.values, outcomes);
  rows.push({ station, tideSha256: tide.digest, outcomeSha256: outcomes.digest,
              outcomeStatus: outcomes.status, ...result });
}
const n = rows.reduce((sum, row) => sum + row.scoredPairs, 0);
const absolute = rows.reduce((sum, row) => sum + row.sumAbsoluteError, 0);
const squared = rows.reduce((sum, row) => sum + row.sumSquaredError, 0);
const output = {
  schema: "halveth.noaa-as-of-tide-track-a.v1",
  targetUtc: "2026-10-18T00:00:00Z/2026-10-19T23:00:00Z",
  sourceProtocolCommit: "e210ba090eae59ad78a530977da67b40763fa791",
  claimCeiling: "Track A tide-only comparison for supplied hourly_height bytes; no live R1/M1/M2 performance or NOAA source independence.",
  rows,
  pool: { plannedPairs: 144, scoredPairs: n, excludedTargetHours: 144 - n,
          maeMeters: n ? absolute / n : null,
          rmseMeters: n ? Math.sqrt(squared / n) : null },
};
process.stdout.write(JSON.stringify(output, null, 2) + "\n");
