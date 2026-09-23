import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { extractReferences, resolveLocalReference, scan } from "./check-reference-network.mjs";

test("a Markdown backlink resolves only when the target is tracked", () => {
  const refs = extractReferences("notes/one.md", "[go](../notes/two.md)\n[web](https://example.org/x)");
  const tracked = new Set(["notes/one.md", "notes/two.md"]);
  assert.equal(resolveLocalReference(refs[0], tracked).target, "notes/two.md");
  assert.equal(resolveLocalReference(refs[0], tracked).status, "RESOLVED");
  assert.equal(resolveLocalReference(refs[1], tracked).status, "OUTSIDE_LOCAL_GRAPH");
});

test("missing, escaped and malformed references do not become valid graph edges", () => {
  const tracked = new Set(["notes/one.md"]);
  assert.equal(resolveLocalReference({ source: "notes/one.md", raw: "two.md", kind: "MARKDOWN_LINK" }, tracked).status, "MISSING_WITHIN_TRACKED_TREE");
  assert.equal(resolveLocalReference({ source: "notes/one.md", raw: "../../secret.txt", kind: "MARKDOWN_LINK" }, tracked).status, "OUTSIDE_LOCAL_GRAPH");
  assert.equal(resolveLocalReference({ source: "notes/one.md", raw: "%GG", kind: "MARKDOWN_LINK" }, tracked).status, "INVALID_ENCODING");
});

test("relative module imports resolve against tracked source paths", () => {
  const refs = extractReferences("src/main.mjs", 'import { run } from "./check-reference-network.mjs";');
  assert.equal(refs.length, 1);
  assert.equal(resolveLocalReference(refs[0], new Set(["src/check-reference-network.mjs"])).status, "RESOLVED");
  assert.equal(resolveLocalReference({ source: "src/main.mjs", raw: "node:fs", kind: "MODULE_IMPORT" }, new Set(["src/main.mjs"])).status, "OUTSIDE_LOCAL_GRAPH");
});

test("a tracked directory link is counted without inventing an index file", () => {
  const result = resolveLocalReference({ source: "README.md", raw: "reports/", kind: "MARKDOWN_LINK" }, new Set(["README.md", "reports/one.md"]));
  assert.equal(result.status, "RESOLVED_DIRECTORY");
  assert.equal(result.target, "reports");
});

test("tracked public text has no missing relative destination in the lexical audit", () => {
  const snapshot = scan(fileURLToPath(new URL("..", import.meta.url)));
  assert.equal(snapshot.counts.unreadableTextCandidates, 0);
  assert.equal(snapshot.counts.localMissing, 0);
});
