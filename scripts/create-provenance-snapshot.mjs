#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CUSTOM_LICENSE_PATHS = new Set([
  "PROVENANCE.md",
  "provenance-policy.json",
  "reports/FREE_NEWS_005_HOW_TO_FISH_IDENTITY_AND_CREATION.md",
  "reports/FREE_NEWS_005_RIGHTS_AND_SEMANTICS_PATCH.json",
  "reports/FREE_NEWS_006_JURI_ENERGY_MODEL_PROVENANCE_AUDIT.md",
  "branches/solar-and-thermal-provenance-audit/README.md",
  "branches/solar-and-thermal-provenance-audit/sources.json",
  "branches/solar-and-thermal-provenance-audit/claims.json",
  "branches/solar-and-thermal-provenance-audit/component-matrix.json",
  "branches/solar-and-thermal-provenance-audit/local-source-receipt.json",
  "scripts/create-provenance-snapshot.mjs",
  "scripts/provenance-snapshot.test.mjs"
]);

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

export function classifyLicense(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (CUSTOM_LICENSE_PATHS.has(normalized)) {
    return {
      licenseId: "LicenseRef-Juri-Public-Interest-1.0",
      ruleId: "FILE_SPECIFIC_PUBLIC_INTEREST",
      basisPath: "LICENSE-JURI-PUBLIC-INTEREST.md"
    };
  }
  if (normalized === "LICENSE") {
    return { licenseId: "MIT", ruleId: "LICENSE_TEXT", basisPath: "LICENSE" };
  }
  if (normalized === "LICENSE-CONTENT.md") {
    return { licenseId: "CC-BY-4.0", ruleId: "LICENSE_TEXT", basisPath: normalized };
  }
  if (normalized === "LICENSE-DATA.md") {
    return { licenseId: "CC0-1.0", ruleId: "LICENSE_TEXT", basisPath: normalized };
  }
  if (normalized === "LICENSE-JURI-PUBLIC-INTEREST.md") {
    return { licenseId: "LicenseRef-License-Notice-Copy-Only", ruleId: "LICENSE_TEXT", basisPath: normalized };
  }
  if (normalized.endsWith(".md")) {
    return { licenseId: "CC-BY-4.0", ruleId: "MARKDOWN_PROSE", basisPath: "LICENSE-CONTENT.md" };
  }
  if (
    normalized.endsWith(".json") ||
    normalized.endsWith(".csv") ||
    normalized.endsWith(".cff") ||
    (normalized.startsWith("catalog/") && normalized.endsWith(".txt"))
  ) {
    return { licenseId: "CC0-1.0", ruleId: "REPOSITORY_DATA", basisPath: "LICENSE-DATA.md" };
  }
  if (
    normalized === ".gitattributes" ||
    normalized.endsWith("/.gitignore") ||
    normalized === ".gitignore" ||
    normalized.startsWith(".github/") ||
    normalized.startsWith("scripts/") ||
    normalized.startsWith("branches/")
  ) {
    return { licenseId: "MIT", ruleId: "SOURCE_AND_CONFIGURATION", basisPath: "LICENSE" };
  }
  return { licenseId: "UNKNOWN", ruleId: "NO_MATCH", basisPath: "LICENSES.md" };
}

function runGit(cwd, args, encoding = "utf8") {
  const result = spawnSync("git", args, {
    cwd,
    encoding: encoding === null ? undefined : encoding,
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true
  });
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf8") : result.stderr;
    throw new Error(`git ${args.join(" ")} failed: ${String(stderr).trim()}`);
  }
  return result.stdout;
}

function parseTree(raw) {
  return raw.split("\0").filter(Boolean).map((record) => {
    const tab = record.indexOf("\t");
    if (tab < 0) throw new Error(`invalid git ls-tree record: ${record}`);
    const [mode, type, objectId] = record.slice(0, tab).split(" ");
    return { mode, type, objectId, path: record.slice(tab + 1) };
  }).sort((a, b) => Buffer.compare(Buffer.from(a.path, "utf8"), Buffer.from(b.path, "utf8")));
}

function historyForPath(cwd, commitId, relativePath) {
  const raw = runGit(cwd, [
    "log",
    "--format=%H%x09%cI",
    "--diff-filter=AMR",
    commitId,
    "--",
    relativePath
  ]).trim();
  const lines = raw ? raw.split(/\r?\n/u) : [];
  const parse = (line) => {
    const [commit, committedAt] = line.split("\t");
    return { commit, committedAt };
  };
  return {
    lastChange: lines.length ? parse(lines[0]) : null,
    firstVisibleAtThisPath: lines.length ? parse(lines.at(-1)) : null,
    coverage: "CURRENT_REPOSITORY_PATH_HISTORY_WITHOUT_RENAME_INFERENCE"
  };
}

function firstParentHistory(cwd, commitId) {
  const raw = runGit(cwd, [
    "log",
    "--first-parent",
    "--format=%H%x09%T%x09%cI%x09%P%x09%s",
    commitId
  ]).trim();
  if (!raw) return [];
  return raw.split(/\r?\n/u).map((line) => {
    const [commit, tree, committedAt, parents, ...subjectParts] = line.split("\t");
    return {
      commit,
      tree,
      committedAt,
      parents: parents ? parents.split(" ") : [],
      subject: subjectParts.join("\t")
    };
  });
}

export function computeFileRoot(files) {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.path, "utf8");
    hash.update("\0");
    hash.update(file.mode, "utf8");
    hash.update("\0");
    hash.update(file.type, "utf8");
    hash.update("\0");
    hash.update(file.objectId, "utf8");
    hash.update("\0");
    hash.update(String(file.byteLength), "utf8");
    hash.update("\0");
    hash.update(file.sha256 ?? "", "utf8");
    hash.update("\n");
  }
  return hash.digest("hex");
}

export async function createSnapshot({
  cwd,
  ref = "HEAD",
  requestedRef = ref,
  repositoryUrl = null,
  generatedAt = new Date().toISOString()
}) {
  const repoRoot = runGit(cwd, ["rev-parse", "--show-toplevel"]).trim();
  const refObjectId = runGit(repoRoot, ["rev-parse", ref]).trim();
  const refObjectType = runGit(repoRoot, ["cat-file", "-t", refObjectId]).trim();
  const refObjectBytes = runGit(repoRoot, ["cat-file", refObjectType, refObjectId], null);
  const commitId = runGit(repoRoot, ["rev-parse", `${ref}^{commit}`]).trim();
  const treeId = runGit(repoRoot, ["rev-parse", `${commitId}^{tree}`]).trim();
  const remoteUrl = repositoryUrl ?? runGit(repoRoot, ["remote", "get-url", "origin"]).trim();
  const tree = parseTree(runGit(repoRoot, ["ls-tree", "-r", "-z", "--full-tree", commitId]));
  const files = [];

  for (const item of tree) {
    if (item.type !== "blob") {
      files.push({
        ...item,
        byteLength: null,
        sha256: null,
        license: classifyLicense(item.path),
        history: historyForPath(repoRoot, commitId, item.path),
        contentState: "NON_BLOB_GIT_OBJECT"
      });
      continue;
    }
    const bytes = runGit(repoRoot, ["cat-file", "blob", item.objectId], null);
    files.push({
      ...item,
      byteLength: bytes.length,
      sha256: sha256(bytes),
      license: classifyLicense(item.path),
      history: historyForPath(repoRoot, commitId, item.path),
      contentState: "EXACT_GIT_BLOB_BYTES_HASHED"
    });
  }

  const unknownLicensePaths = files.filter((file) => file.license.licenseId === "UNKNOWN").map((file) => file.path);
  if (unknownLicensePaths.length) {
    throw new Error(`unclassified license paths: ${unknownLicensePaths.join(", ")}`);
  }

  const licenseMap = files.find((file) => file.path === "LICENSES.md");
  const policy = files.find((file) => file.path === "provenance-policy.json");
  const snapshot = {
    schemaVersion: "1.0.0",
    snapshotKind: "CODE_ZEITWAERTSZURUECK_GIT_PROVENANCE_ENVELOPE",
    generatedAt,
    subject: {
      repositoryUrl: remoteUrl,
      requestedRef,
      refObjectId,
      refObjectType,
      refObjectPayloadSha256: sha256(refObjectBytes),
      commitId,
      treeId,
      gitObjectHash: commitId.length === 64 ? "sha256" : "sha1"
    },
    backwardTrace: {
      direction: "CURRENT_COMMIT_TO_FIRST_PARENT_ROOT",
      commits: firstParentHistory(repoRoot, commitId),
      semantics: "QUERY_ORDER_ONLY_NO_RETROACTIVE_CAUSATION_OR_RIGHTS_CHANGE"
    },
    fileSet: {
      source: "git ls-tree -r -z --full-tree <commit>",
      count: files.length,
      canonicalRootAlgorithm: "sha256(path NUL mode NUL type NUL objectId NUL byteLength NUL sha256 LF)",
      sha256Root: computeFileRoot(files),
      files
    },
    boundPolicy: {
      licenseMapPath: licenseMap?.path ?? null,
      licenseMapSha256: licenseMap?.sha256 ?? null,
      provenancePolicyPath: policy?.path ?? null,
      provenancePolicySha256: policy?.sha256 ?? null
    },
    statusSemantics: {
      FLAGGED_MATERIAL: "MARKED_FOR_REVIEW_AND_DECISION_RELEVANT_WITHIN_NAMED_AUDIT_ONLY"
    },
    claimCeiling: "EXACT_BYTES_AND_VISIBLE_GIT_HISTORY_WITHIN_BOUND_REPOSITORY_NOT_EARLIER_CREATION_EXCLUSIVE_IDEA_OWNERSHIP_THIRD_PARTY_RIGHTS_OR_CLAIM_TRUTH"
  };
  snapshot.snapshotDigest = `sha256:${sha256(Buffer.from(canonicalize(snapshot), "utf8"))}`;
  return snapshot;
}

export async function verifySnapshot({ cwd, snapshotPath }) {
  const absolute = path.resolve(cwd, snapshotPath);
  const stored = JSON.parse(await fs.readFile(absolute, "utf8"));
  const storedDigest = stored.snapshotDigest;
  delete stored.snapshotDigest;
  const computedDigest = `sha256:${sha256(Buffer.from(canonicalize(stored), "utf8"))}`;
  if (storedDigest !== computedDigest) {
    throw new Error(`snapshot digest mismatch: stored ${storedDigest}, computed ${computedDigest}`);
  }
  const rebuilt = await createSnapshot({
    cwd,
    ref: stored.subject.requestedRef,
    requestedRef: stored.subject.requestedRef,
    repositoryUrl: stored.subject.repositoryUrl,
    generatedAt: stored.generatedAt
  });
  if (rebuilt.subject.commitId !== stored.subject.commitId) throw new Error("ref resolves to a different commit");
  if (rebuilt.subject.refObjectId !== stored.subject.refObjectId) throw new Error("ref object id mismatch");
  if (rebuilt.subject.refObjectPayloadSha256 !== stored.subject.refObjectPayloadSha256) throw new Error("ref object payload mismatch");
  if (rebuilt.subject.treeId !== stored.subject.treeId) throw new Error("tree id mismatch");
  if (rebuilt.fileSet.sha256Root !== stored.fileSet.sha256Root) throw new Error("file root mismatch");
  if (rebuilt.snapshotDigest !== storedDigest) throw new Error("rebuilt snapshot mismatch");
  return {
    state: "VERIFIED",
    commitId: stored.subject.commitId,
    treeId: stored.subject.treeId,
    fileCount: stored.fileSet.count,
    fileRoot: stored.fileSet.sha256Root,
    snapshotDigest: storedDigest
  };
}

function parseArguments(argv) {
  const result = {
    ref: "HEAD",
    requestedRef: null,
    generatedAt: null,
    output: null,
    verify: null,
    repositoryUrl: null
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--ref") result.ref = argv[++index];
    else if (token === "--requested-ref") result.requestedRef = argv[++index];
    else if (token === "--generated-at") result.generatedAt = argv[++index];
    else if (token === "--output") result.output = argv[++index];
    else if (token === "--verify") result.verify = argv[++index];
    else if (token === "--repository-url") result.repositoryUrl = argv[++index];
    else throw new Error(`unknown argument: ${token}`);
  }
  return result;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const cwd = process.cwd();
  if (args.verify) {
    console.log(JSON.stringify(await verifySnapshot({ cwd, snapshotPath: args.verify }), null, 2));
    return;
  }
  if (!args.output) throw new Error("--output is required when creating a snapshot");
  const snapshot = await createSnapshot({
    cwd,
    ref: args.ref,
    requestedRef: args.requestedRef ?? args.ref,
    repositoryUrl: args.repositoryUrl,
    generatedAt: args.generatedAt ?? new Date().toISOString()
  });
  const output = path.resolve(cwd, args.output);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    state: "CREATED",
    output,
    commitId: snapshot.subject.commitId,
    treeId: snapshot.subject.treeId,
    fileCount: snapshot.fileSet.count,
    fileRoot: snapshot.fileSet.sha256Root,
    snapshotDigest: snapshot.snapshotDigest
  }, null, 2));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
