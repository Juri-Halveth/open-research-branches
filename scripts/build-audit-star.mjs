#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const INDEX_NODE_ID = "audit-star:index";
const OUTPUT_PATH = "catalog/audit-star.json";
const MAX_GIT_BUFFER = 128 * 1024 * 1024;

function runGit(cwd, args, { allowFailure = false, encoding = "utf8" } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding,
    maxBuffer: MAX_GIT_BUFFER,
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : result.stderr;
    throw new Error(`git ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return result.status === 0 ? result.stdout : null;
}
function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(String(left), "utf8"), Buffer.from(String(right), "utf8"));
}

function compareMany(...selectors) {
  return (left, right) => {
    for (const selector of selectors) {
      const result = compareUtf8(selector(left), selector(right));
      if (result !== 0) return result;
    }
    return 0;
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableId(prefix, ...parts) {
  return `${prefix}:${sha256(parts.join("\0")).slice(0, 20)}`;
}

function normalizeRepositoryPath(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  const normalized = path.posix.normalize(value.replaceAll("\\", "/").replace(/^\.\//u, ""));
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:/u.test(normalized)
  ) {
    throw new Error(`${label} is outside the repository: ${value}`);
  }
  return normalized.replace(/\/$/u, "");
}

function parseTree(raw) {
  if (!raw) return [];
  return raw.split("\0").filter(Boolean).map((record) => {
    const tab = record.indexOf("\t");
    if (tab < 0) throw new Error(`unexpected git ls-tree record: ${record}`);
    const [mode, type, objectId] = record.slice(0, tab).split(" ");
    return {
      mode,
      type,
      objectId,
      path: normalizeRepositoryPath(record.slice(tab + 1), "git tree path")
    };
  }).sort(compareMany((entry) => entry.path, (entry) => entry.objectId));
}

function listTree(cwd, commitId, pathspec = null) {
  const args = ["ls-tree", "-r", "-z", "--full-tree", commitId];
  if (pathspec) args.push("--", pathspec);
  return parseTree(runGit(cwd, args));
}

function readBlobAtPath(cwd, commitId, relativePath, { allowMissing = false } = {}) {
  return runGit(cwd, ["show", `${commitId}:${relativePath}`], {
    allowFailure: allowMissing,
    encoding: null
  });
}

function parseCatalog(bytes, sourceLabel) {
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`cannot parse ${sourceLabel}: ${error.message}`);
  }
  if (!parsed || !Array.isArray(parsed.branches)) {
    throw new Error(`${sourceLabel} must contain a branches array`);
  }
  const seenPaths = new Set();
  const entries = parsed.branches.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`${sourceLabel} branch ${index} must be an object`);
    }
    const branchPath = normalizeRepositoryPath(entry.path, `${sourceLabel} branch ${index} path`);
    if (!branchPath.startsWith("branches/")) {
      throw new Error(`${sourceLabel} branch ${index} is outside branches/: ${branchPath}`);
    }
    if (seenPaths.has(branchPath)) throw new Error(`${sourceLabel} repeats branch path ${branchPath}`);
    seenPaths.add(branchPath);
    return {
      path: branchPath,
      catalogId: typeof entry.id === "string" ? entry.id : null,
      title: typeof entry.title === "string" ? entry.title : null,
      kind: typeof entry.kind === "string" ? entry.kind : null,
      state: typeof entry.state === "string" ? entry.state : null,
      claimCeiling: typeof entry.claimCeiling === "string" ? entry.claimCeiling : null,
      dataClass: typeof entry.dataClass === "string" ? entry.dataClass : null
    };
  });
  return entries.sort(compareMany((entry) => entry.path, (entry) => entry.catalogId ?? ""));
}

function commitMetadata(cwd, commitId) {
  const raw = runGit(cwd, ["show", "-s", "--format=%H%x00%T%x00%cI", commitId]).trimEnd();
  const [resolvedCommitId, treeId, committedAt] = raw.split("\0");
  if (!resolvedCommitId || !treeId || !committedAt) {
    throw new Error(`cannot read metadata for commit ${commitId}`);
  }
  return { commitId: resolvedCommitId, treeId, committedAt };
}

function addObservation(index, key, observation) {
  const existing = index.get(key) ?? [];
  existing.push(observation);
  index.set(key, existing);
}

function summarizeObservations(observations) {
  const unique = new Map();
  for (const observation of observations) {
    const key = `${observation.commitId}\0${observation.catalogId ?? ""}`;
    if (!unique.has(key)) unique.set(key, observation);
  }
  const ordered = [...unique.values()].sort(compareMany(
    (entry) => entry.committedAt,
    (entry) => entry.commitId,
    (entry) => entry.catalogId ?? ""
  ));
  const catalogIds = [...new Set(ordered.map((entry) => entry.catalogId).filter(Boolean))].sort(compareUtf8);
  return {
    observedCommitCount: new Set(ordered.map((entry) => entry.commitId)).size,
    earliestByCommitterTimestamp: ordered.length
      ? { commitId: ordered[0].commitId, committedAt: ordered[0].committedAt }
      : null,
    latestByCommitterTimestamp: ordered.length
      ? { commitId: ordered.at(-1).commitId, committedAt: ordered.at(-1).committedAt }
      : null,
    catalogIds,
    orderingSemantics: "COMMITTER_TIMESTAMP_THEN_COMMIT_ID_ONLY_NO_CAUSAL_OR_AUTHORSHIP_ORDER"
  };
}

function currentObjectForPath(cwd, commitId, relativePath) {
  const objectId = runGit(cwd, ["rev-parse", `${commitId}:${relativePath}`], { allowFailure: true });
  if (objectId === null) return null;
  const trimmed = objectId.trim();
  const objectType = runGit(cwd, ["cat-file", "-t", trimmed]).trim();
  return { objectId: trimmed, objectType };
}

function isTextBlob(bytes) {
  if (!bytes || bytes.includes(0)) return false;
  const text = bytes.toString("utf8");
  return !text.includes("\uFFFD");
}

function collectJsonStrings(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, result);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonStrings(item, result);
  }
  return result;
}

function candidateLiterals(text, sourcePath, targetPaths) {
  const candidates = [];
  const add = (literal, index, syntax) => {
    if (typeof literal !== "string") return;
    const trimmed = literal.trim().replace(/^<|>$/gu, "");
    if (trimmed) candidates.push({ literal: trimmed, index: Math.max(0, index), syntax });
  };

  const patterns = [
    { syntax: "MARKDOWN_LINK", regex: /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*)?\)/gu },
    { syntax: "MARKDOWN_REFERENCE", regex: /^\s*\[[^\]]+\]:\s*(\S+)/gmu },
    { syntax: "INLINE_CODE", regex: /`([^`\r\n]+)`/gu }
  ];
  for (const { syntax, regex } of patterns) {
    for (const match of text.matchAll(regex)) add(match[1], match.index ?? 0, syntax);
  }

  if (sourcePath.endsWith(".json")) {
    try {
      for (const literal of collectJsonStrings(JSON.parse(text))) {
        add(literal, text.indexOf(JSON.stringify(literal)), "JSON_STRING");
      }
    } catch {
      // Invalid JSON remains covered by the exact-path scan below.
    }
  }

  for (const targetPath of targetPaths) {
    let offset = text.indexOf(targetPath);
    while (offset >= 0) {
      add(targetPath, offset, "EXACT_REPOSITORY_PATH");
      offset = text.indexOf(targetPath, offset + targetPath.length);
    }
  }

  const unique = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.literal}\0${candidate.index}\0${candidate.syntax}`;
    if (!unique.has(key)) unique.set(key, candidate);
  }
  return [...unique.values()].sort(compareMany(
    (entry) => String(entry.index).padStart(12, "0"),
    (entry) => entry.literal,
    (entry) => entry.syntax
  ));
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (text.charCodeAt(position) === 10) line += 1;
  }
  return line;
}

function resolveLiteral(literal, sourcePath, targetByPath) {
  let value = literal.trim();
  if (!value || value.startsWith("#") || /^[a-z][a-z0-9+.-]*:/iu.test(value)) return null;
  value = value.split("#", 1)[0].split("?", 1)[0];
  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  value = value.replaceAll("\\", "/");
  let resolved;
  if (value.startsWith("/")) resolved = path.posix.normalize(value.slice(1));
  else if (targetByPath.has(value.replace(/^\.\//u, "").replace(/\/$/u, ""))) {
    resolved = value.replace(/^\.\//u, "");
  } else {
    resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), value));
  }
  resolved = resolved.replace(/\/$/u, "");
  if (resolved === ".." || resolved.startsWith("../")) return null;
  return targetByPath.get(resolved) ?? null;
}

function buildExplicitReferenceEdges({ cwd, commitId, tree, nodes }) {
  const contentNodes = nodes.filter((node) => node.id !== INDEX_NODE_ID);
  const targetByPath = new Map(contentNodes.map((node) => [node.path, node]));
  const targetPaths = [...targetByPath.keys()].sort(compareUtf8);
  const currentNodes = contentNodes.filter((node) => node.currentAtRef === true);
  const sourceOwnership = [];

  for (const node of currentNodes) {
    if (node.nodeKind === "REPORT_PATH") {
      const entry = tree.find((item) => item.path === node.path && item.type === "blob");
      if (entry) sourceOwnership.push({ owner: node, entry });
      continue;
    }
    const prefix = `${node.path}/`;
    for (const entry of tree) {
      if (entry.type === "blob" && entry.path.startsWith(prefix)) {
        sourceOwnership.push({ owner: node, entry });
      }
    }
  }
  sourceOwnership.sort(compareMany((item) => item.owner.id, (item) => item.entry.path));

  const byPair = new Map();
  for (const { owner, entry } of sourceOwnership) {
    const bytes = readBlobAtPath(cwd, commitId, entry.path);
    if (!isTextBlob(bytes)) continue;
    const text = bytes.toString("utf8");
    for (const candidate of candidateLiterals(text, entry.path, targetPaths)) {
      const target = resolveLiteral(candidate.literal, entry.path, targetByPath);
      if (!target || target.id === owner.id) continue;
      const pairKey = `${owner.id}\0${target.id}`;
      const evidence = {
        sourcePath: entry.path,
        sourceBlobId: entry.objectId,
        line: lineNumberAt(text, candidate.index),
        literal: candidate.literal,
        syntax: candidate.syntax,
        resolution: "EXACT_REPOSITORY_PATH"
      };
      const pair = byPair.get(pairKey) ?? { from: owner.id, to: target.id, evidence: [] };
      const evidenceKey = JSON.stringify(evidence);
      if (!pair.evidence.some((item) => JSON.stringify(item) === evidenceKey)) pair.evidence.push(evidence);
      byPair.set(pairKey, pair);
    }
  }

  return [...byPair.values()].map((pair) => {
    pair.evidence.sort(compareMany(
      (entry) => entry.sourcePath,
      (entry) => String(entry.line).padStart(12, "0"),
      (entry) => entry.literal,
      (entry) => entry.syntax
    ));
    return {
      id: stableId("edge-reference", pair.from, pair.to),
      relationType: "EXPLICITLY_REFERENCES",
      from: pair.from,
      to: pair.to,
      evidence: pair.evidence,
      semantics: "TEXTUAL_PATH_REFERENCE_ONLY_NO_CAUSALITY_AUTHORSHIP_DERIVATION_OR_IDENTITY"
    };
  });
}

export function buildAuditStar({ cwd = process.cwd(), ref = "HEAD" } = {}) {
  const repositoryRoot = runGit(cwd, ["rev-parse", "--show-toplevel"]).trim();
  const commitId = runGit(repositoryRoot, ["rev-parse", `${ref}^{commit}`]).trim();
  const currentCommit = commitMetadata(repositoryRoot, commitId);
  const currentTree = listTree(repositoryRoot, commitId);
  const currentTreeByPath = new Map(currentTree.map((entry) => [entry.path, entry]));
  const catalogBytes = readBlobAtPath(repositoryRoot, commitId, "catalog/branches.json");
  const currentCatalog = parseCatalog(catalogBytes, `catalog/branches.json@${commitId}`);
  const currentCatalogByPath = new Map(currentCatalog.map((entry) => [entry.path, entry]));
  const currentReports = currentTree.filter((entry) => entry.path.startsWith("reports/"));
  const currentReportByPath = new Map(currentReports.map((entry) => [entry.path, entry]));

  const reachableCommits = [...new Set(
    runGit(repositoryRoot, ["rev-list", "--all"]).split(/\r?\n/u).filter(Boolean)
  )].sort(compareUtf8);
  const metadataByCommit = new Map();
  const branchHistory = new Map();
  const reportHistory = new Map();

  for (const historicalCommitId of reachableCommits) {
    const metadata = commitMetadata(repositoryRoot, historicalCommitId);
    metadataByCommit.set(historicalCommitId, metadata);
    const historicalCatalogBytes = readBlobAtPath(
      repositoryRoot,
      historicalCommitId,
      "catalog/branches.json",
      { allowMissing: true }
    );
    if (historicalCatalogBytes) {
      for (const entry of parseCatalog(historicalCatalogBytes, `catalog/branches.json@${historicalCommitId}`)) {
        addObservation(branchHistory, entry.path, {
          commitId: historicalCommitId,
          committedAt: metadata.committedAt,
          catalogId: entry.catalogId
        });
      }
    }
    for (const entry of listTree(repositoryRoot, historicalCommitId, "reports")) {
      addObservation(reportHistory, entry.path, {
        commitId: historicalCommitId,
        committedAt: metadata.committedAt,
        catalogId: null
      });
    }
  }

  // HEAD can be a detached or otherwise unreferenced commit and therefore absent from --all.
  if (!metadataByCommit.has(commitId)) {
    reachableCommits.push(commitId);
    reachableCommits.sort(compareUtf8);
    metadataByCommit.set(commitId, currentCommit);
    for (const entry of currentCatalog) {
      addObservation(branchHistory, entry.path, {
        commitId,
        committedAt: currentCommit.committedAt,
        catalogId: entry.catalogId
      });
    }
    for (const entry of currentReports) {
      addObservation(reportHistory, entry.path, {
        commitId,
        committedAt: currentCommit.committedAt,
        catalogId: null
      });
    }
  }

  const nodes = [{
    id: INDEX_NODE_ID,
    nodeKind: "AUDIT_STAR_INDEX",
    path: OUTPUT_PATH,
    lifecycle: "GENERATED_INDEX",
    currentAtRef: null,
    pathState: "OUTPUT_PATH_NOT_USED_AS_INPUT_EVIDENCE"
  }];

  for (const branchPath of [...branchHistory.keys()].sort(compareUtf8)) {
    const currentEntry = currentCatalogByPath.get(branchPath) ?? null;
    const currentObject = currentObjectForPath(repositoryRoot, commitId, branchPath);
    nodes.push({
      id: stableId("branch", branchPath),
      nodeKind: "CATALOG_BRANCH",
      path: branchPath,
      lifecycle: currentEntry ? "CURRENT_AT_REF" : "HISTORICAL_ONLY",
      currentAtRef: Boolean(currentEntry),
      currentClassification: currentEntry ? "CURRENT_CATALOG_ENTRY" : "HISTORICAL_CATALOG_ENTRY",
      treePresenceAtRef: Boolean(currentObject),
      ...(currentEntry ? {
        catalogEntry: {
          sourcePath: "catalog/branches.json",
          sourceCommitId: commitId,
          catalogId: currentEntry.catalogId,
          title: currentEntry.title,
          kind: currentEntry.kind,
          state: currentEntry.state,
          claimCeiling: currentEntry.claimCeiling,
          dataClass: currentEntry.dataClass
        },
        ...(currentObject ? { currentObject } : {})
      } : {}),
      history: summarizeObservations(branchHistory.get(branchPath))
    });
  }

  for (const reportPath of [...reportHistory.keys()].sort(compareUtf8)) {
    const currentEntry = currentReportByPath.get(reportPath) ?? null;
    nodes.push({
      id: stableId("report", reportPath),
      nodeKind: "REPORT_PATH",
      reportRole: path.posix.basename(reportPath).toLowerCase() === "readme.md"
        ? "REPORT_DIRECTORY_INDEX"
        : "REPORT_ARTIFACT",
      path: reportPath,
      lifecycle: currentEntry ? "CURRENT_AT_REF" : "HISTORICAL_ONLY",
      currentAtRef: Boolean(currentEntry),
      currentClassification: currentEntry ? "CURRENT_GIT_TREE_PATH" : "HISTORICAL_GIT_TREE_PATH",
      ...(currentEntry ? {
        currentObject: {
          commitId,
          mode: currentEntry.mode,
          objectType: currentEntry.type,
          objectId: currentEntry.objectId
        }
      } : {}),
      history: summarizeObservations(reportHistory.get(reportPath))
    });
  }

  nodes.sort(compareMany((node) => node.path, (node) => node.nodeKind, (node) => node.id));

  const edges = nodes.filter((node) => node.id !== INDEX_NODE_ID).map((node) => ({
    id: stableId("edge-indexes", INDEX_NODE_ID, node.id),
    relationType: "INDEXES",
    from: INDEX_NODE_ID,
    to: node.id,
    evidence: [{
      source: node.nodeKind === "CATALOG_BRANCH"
        ? "CATALOG_ENTRY_HISTORY"
        : "REPORT_GIT_TREE_HISTORY",
      coverageRef: commitId
    }],
    semantics: "CATALOG_MEMBERSHIP_ONLY_NO_CAUSALITY_AUTHORSHIP_DERIVATION_OR_IDENTITY"
  }));
  edges.push(...buildExplicitReferenceEdges({
    cwd: repositoryRoot,
    commitId,
    tree: currentTree,
    nodes
  }));
  edges.sort(compareMany(
    (edge) => edge.relationType,
    (edge) => edge.from,
    (edge) => edge.to,
    (edge) => edge.id
  ));

  const branchNodes = nodes.filter((node) => node.nodeKind === "CATALOG_BRANCH");
  const reportNodes = nodes.filter((node) => node.nodeKind === "REPORT_PATH");
  const explicitReferenceEdges = edges.filter((edge) => edge.relationType === "EXPLICITLY_REFERENCES");
  return {
    schemaVersion: "1.0.0",
    catalogKind: "AUDIT_REPORT_PATH_STAR",
    indexNodeId: INDEX_NODE_ID,
    source: {
      requestedRef: ref,
      commitId,
      treeId: currentCommit.treeId,
      committedAt: currentCommit.committedAt,
      timeSemantics: "GIT_COMMITTER_TIMESTAMP_NOT_INDEPENDENT_CREATION_OR_PUBLICATION_TIME"
    },
    coverage: {
      state: "FINITE_SNAPSHOT",
      currentCatalogBranches: {
        source: `catalog/branches.json@${commitId}`,
        rule: "ALL_BRANCH_ENTRIES",
        count: currentCatalog.length
      },
      currentReports: {
        source: `git ls-tree -r --full-tree ${commitId} -- reports`,
        rule: "ALL_GIT_OBJECT_PATHS_UNDER_REPORTS",
        count: currentReports.length
      },
      history: {
        revisionExpression: "git rev-list --all PLUS_BOUND_CURRENT_COMMIT_IF_UNREFERENCED",
        reachableCommitCount: reachableCommits.length,
        branchRule: "ALL_PARSEABLE_CATALOG_BRANCH_ENTRIES_IN_REACHABLE_COMMITS",
        reportRule: "ALL_GIT_OBJECT_PATHS_UNDER_REPORTS_IN_REACHABLE_COMMITS",
        renameInference: "DISABLED_PATH_IDENTITY_ONLY"
      },
      explicitCrossReferences: {
        source: "CURRENT_REF_TEXT_BLOBS_OWNED_BY_CURRENT_NODES",
        acceptedEvidence: [
          "EXACT_REPOSITORY_PATH",
          "MARKDOWN_LINK",
          "MARKDOWN_REFERENCE",
          "INLINE_CODE",
          "JSON_STRING"
        ],
        binaryBlobs: "EXCLUDED",
        historicalBlobBodies: "NOT_SCANNED"
      },
      excluded: [
        "UNTRACKED_WORKTREE_PATHS",
        "UNREACHABLE_GIT_OBJECTS",
        "EXTERNAL_REPOSITORIES",
        "REMOTE_PUBLICATION_STATUS",
        "RENAMES_NOT_EXPLICITLY_RECORDED_AS_PATHS",
        "INFERRED_CAUSAL_AUTHORSHIP_DERIVATION_OR_IDENTITY_RELATIONS"
      ],
      counts: {
        nodes: nodes.length,
        currentCatalogBranches: branchNodes.filter((node) => node.currentAtRef).length,
        historicalOnlyCatalogBranches: branchNodes.filter((node) => !node.currentAtRef).length,
        currentReports: reportNodes.filter((node) => node.currentAtRef).length,
        historicalOnlyReports: reportNodes.filter((node) => !node.currentAtRef).length,
        indexEdges: edges.filter((edge) => edge.relationType === "INDEXES").length,
        explicitReferenceEdges: explicitReferenceEdges.length
      }
    },
    relationDefinitions: {
      INDEXES: {
        direction: "AUDIT_STAR_INDEX_TO_PATH_NODE",
        meaning: "PATH_INCLUDED_BY_DECLARED_CATALOG_OR_GIT_HISTORY_RULE",
        causality: "NOT_DERIVED",
        authorship: "NOT_DERIVED"
      },
      EXPLICITLY_REFERENCES: {
        direction: "SOURCE_NODE_TO_LITERAL_TARGET_NODE",
        meaning: "EXACT_TEXTUAL_PATH_REFERENCE_IN_A_BOUND_CURRENT_GIT_BLOB",
        causality: "NOT_DERIVED",
        authorship: "NOT_DERIVED"
      }
    },
    nodes,
    edges,
    claimCeiling: "BOUND_GIT_PATH_INVENTORY_AND_EXPLICIT_TEXT_REFERENCES_ONLY_NOT_AUTHORSHIP_CAUSALITY_DERIVATION_IDENTITY_REMOTE_PUBLICATION_OR_CLAIM_TRUTH"
  };
}

function parseArguments(argv) {
  const parsed = { ref: "HEAD", output: OUTPUT_PATH, stdout: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--ref") parsed.ref = argv[++index];
    else if (token === "--output") parsed.output = argv[++index];
    else if (token === "--stdout") parsed.stdout = true;
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!parsed.ref) throw new Error("--ref requires a value");
  if (!parsed.output) throw new Error("--output requires a value");
  return parsed;
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const star = buildAuditStar({ cwd: process.cwd(), ref: args.ref });
  const serialized = `${JSON.stringify(star, null, 2)}\n`;
  if (args.stdout) {
    process.stdout.write(serialized);
    return;
  }
  const output = path.resolve(process.cwd(), args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, serialized, "utf8");
  console.log(JSON.stringify({
    state: "CREATED",
    output,
    commitId: star.source.commitId,
    nodeCount: star.nodes.length,
    edgeCount: star.edges.length,
    coverage: star.coverage.counts
  }, null, 2));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
