import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAuditStar } from "./build-audit-star.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let cachedRepositoryStar;

function repositoryStar() {
  cachedRepositoryStar ??= buildAuditStar({ cwd: REPOSITORY_ROOT, ref: "HEAD" });
  return cachedRepositoryStar;
}

function git(cwd, args, env = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, ...env }
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function parseTreePaths(raw) {
  return raw.split("\0").filter(Boolean).map((record) => record.slice(record.indexOf("\t") + 1)).sort();
}

function sortedNodeKeys(nodes) {
  return nodes.map((node) => `${node.path}\0${node.nodeKind}\0${node.id}`);
}

function sortedEdgeKeys(edges) {
  return edges.map((edge) => `${edge.relationType}\0${edge.from}\0${edge.to}\0${edge.id}`);
}

function makeFixtureRepository() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "audit-star-"));
  git(directory, ["init", "-b", "main"]);
  git(directory, ["config", "user.name", "Audit Fixture"]);
  const fixtureEmail = ["audit-fixture", "example.invalid"].join("@");
  git(directory, ["config", "user.email", fixtureEmail]);

  fs.mkdirSync(path.join(directory, "catalog"), { recursive: true });
  fs.mkdirSync(path.join(directory, "branches", "old-audit"), { recursive: true });
  fs.mkdirSync(path.join(directory, "reports"), { recursive: true });
  fs.writeFileSync(path.join(directory, "catalog", "branches.json"), JSON.stringify({
    branches: [{ id: "old-audit", path: "branches/old-audit", title: "Old audit" }]
  }));
  fs.writeFileSync(path.join(directory, "branches", "old-audit", "README.md"), "# Old audit\n");
  fs.writeFileSync(path.join(directory, "reports", "OLD.md"), "# Historical report\n");
  git(directory, ["add", "."]);
  git(directory, ["commit", "-m", "historical audit paths"], {
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z"
  });

  fs.rmSync(path.join(directory, "branches", "old-audit"), { recursive: true, force: true });
  fs.rmSync(path.join(directory, "reports", "OLD.md"));
  fs.mkdirSync(path.join(directory, "branches", "current-audit"), { recursive: true });
  fs.writeFileSync(path.join(directory, "catalog", "branches.json"), JSON.stringify({
    branches: [{ id: "current-audit", path: "branches/current-audit", title: "Current audit" }]
  }));
  fs.writeFileSync(
    path.join(directory, "branches", "current-audit", "README.md"),
    "# Current audit\nSee [the target report](../../reports/TARGET.md).\n"
  );
  fs.writeFileSync(path.join(directory, "reports", "TARGET.md"), "# Target report\n");
  fs.writeFileSync(path.join(directory, "reports", "LIVE.md"), "See `TARGET.md`.\n");
  git(directory, ["add", "-A"]);
  git(directory, ["commit", "-m", "current audit paths"], {
    GIT_AUTHOR_DATE: "2026-01-02T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-02T00:00:00Z"
  });
  return directory;
}

test("audit star is sorted and uses unique stable IDs", () => {
  const star = repositoryStar();
  assert.deepEqual(sortedNodeKeys(star.nodes), [...sortedNodeKeys(star.nodes)].sort());
  assert.deepEqual(sortedEdgeKeys(star.edges), [...sortedEdgeKeys(star.edges)].sort());
  const allIds = [...star.nodes, ...star.edges].map((record) => record.id);
  assert.equal(new Set(allIds).size, allIds.length);
});

test("coverage is finite and declares current, historical and cross-reference surfaces", () => {
  const star = repositoryStar();
  assert.equal(star.coverage.state, "FINITE_SNAPSHOT");
  assert.equal(star.coverage.currentCatalogBranches.rule, "ALL_BRANCH_ENTRIES");
  assert.equal(star.coverage.currentReports.rule, "ALL_GIT_OBJECT_PATHS_UNDER_REPORTS");
  assert.match(star.coverage.history.revisionExpression, /rev-list --all/u);
  assert.equal(star.coverage.history.renameInference, "DISABLED_PATH_IDENTITY_ONLY");
  assert.equal(star.coverage.explicitCrossReferences.historicalBlobBodies, "NOT_SCANNED");
  assert.ok(star.coverage.excluded.includes("UNTRACKED_WORKTREE_PATHS"));
  assert.ok(star.coverage.excluded.includes("INFERRED_CAUSAL_AUTHORSHIP_DERIVATION_OR_IDENTITY_RELATIONS"));
});

test("every current catalog branch and report path at HEAD is indexed", () => {
  const commitId = git(REPOSITORY_ROOT, ["rev-parse", "HEAD^{commit}"]).trim();
  const catalog = JSON.parse(git(REPOSITORY_ROOT, ["show", `${commitId}:catalog/branches.json`]));
  const expectedBranches = catalog.branches.map((entry) => entry.path).sort();
  const expectedReports = parseTreePaths(git(REPOSITORY_ROOT, [
    "ls-tree", "-r", "-z", "--full-tree", commitId, "--", "reports"
  ]));
  const star = repositoryStar();
  const actualBranches = star.nodes
    .filter((node) => node.nodeKind === "CATALOG_BRANCH" && node.currentAtRef)
    .map((node) => node.path)
    .sort();
  const actualReports = star.nodes
    .filter((node) => node.nodeKind === "REPORT_PATH" && node.currentAtRef)
    .map((node) => node.path)
    .sort();
  assert.deepEqual(actualBranches, expectedBranches);
  assert.deepEqual(actualReports, expectedReports);
  assert.equal(star.edges.filter((edge) => edge.relationType === "INDEXES").length, star.nodes.length - 1);
});

test("relations never derive causality, authorship, identity or artifact truth", () => {
  const star = repositoryStar();
  assert.match(star.claimCeiling, /NOT_AUTHORSHIP_CAUSALITY_DERIVATION_IDENTITY/u);
  assert.deepEqual(Object.keys(star.relationDefinitions).sort(), ["EXPLICITLY_REFERENCES", "INDEXES"]);
  for (const [relationType, definition] of Object.entries(star.relationDefinitions)) {
    assert.equal(definition.causality, "NOT_DERIVED", relationType);
    assert.equal(definition.authorship, "NOT_DERIVED", relationType);
  }
  for (const edge of star.edges) {
    assert.ok(["EXPLICITLY_REFERENCES", "INDEXES"].includes(edge.relationType));
    assert.match(edge.semantics, /NO_CAUSALITY_AUTHORSHIP_DERIVATION_OR_IDENTITY/u);
  }
});

test("deleted paths remain historical and cross-links require literal evidence", (context) => {
  const fixture = makeFixtureRepository();
  context.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const star = buildAuditStar({ cwd: fixture, ref: "HEAD" });
  assert.deepEqual(buildAuditStar({ cwd: fixture, ref: "HEAD" }), star);

  for (const historicalPath of ["branches/old-audit", "reports/OLD.md"]) {
    const node = star.nodes.find((candidate) => candidate.path === historicalPath);
    assert.ok(node, historicalPath);
    assert.equal(node.currentAtRef, false, historicalPath);
    assert.equal(node.lifecycle, "HISTORICAL_ONLY", historicalPath);
    assert.equal(Object.hasOwn(node, "currentObject"), false, historicalPath);
  }

  const currentBranch = star.nodes.find((node) => node.path === "branches/current-audit");
  const target = star.nodes.find((node) => node.path === "reports/TARGET.md");
  const live = star.nodes.find((node) => node.path === "reports/LIVE.md");
  const references = star.edges.filter((edge) => edge.relationType === "EXPLICITLY_REFERENCES");
  assert.ok(references.some((edge) => edge.from === currentBranch.id && edge.to === target.id));
  assert.ok(references.some((edge) => edge.from === live.id && edge.to === target.id));
  assert.equal(references.some((edge) => edge.from === target.id), false);
  for (const edge of references) {
    assert.ok(edge.evidence.length > 0);
    assert.ok(edge.evidence.every((item) => item.sourceBlobId && item.literal));
  }
});
