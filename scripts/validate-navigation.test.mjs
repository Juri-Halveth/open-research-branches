import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { extractLinks, headingAnchors, resolveDestination, validateNavigation } from "./validate-navigation.mjs";

test("navigation syntax preserves parentheses and excludes code examples", () => {
  const markdown = '[A](wiki/A_(B).md#test)\n[B](<wiki/Space Name.md>)\n[C][id]\n[id]: wiki/C.md "title"\n`[ignore](missing.md)`\n```md\n[ignore](other.md)\n```\n<a href="wiki/D.md">D</a>';
  assert.deepEqual(extractLinks(markdown).map((link) => link.destination).sort(), ["wiki/A_(B).md#test", "wiki/C.md", "wiki/D.md", "wiki/Space Name.md"].sort());
});

test("anchors retain German letters and disambiguate duplicates", () => {
  const anchors = headingAnchors('# Grüße & Quellen\n## Wieder\n## Wieder\n## Wieder-1\nSetext\n------\n<a id="manual"></a>\n```\n# Fenced\n```');
  for (const anchor of ["grüße--quellen", "wieder", "wieder-1", "wieder-1-1", "setext", "manual"]) assert.ok(anchors.has(anchor), anchor);
  assert.ok(!anchors.has("fenced"));
});

test("same-repository main URLs bind locally, historical versions remain external", () => {
  const root = path.resolve("navigation-fixture");
  const source = path.join(root, "wiki/Start.md");
  assert.equal(resolveDestination("../README.md#start", source, root).relative, "README.md");
  assert.equal(resolveDestination("https://github.com/Juri-Halveth/open-research-branches/blob/main/README.md#start", source, root).relative, "README.md");
  assert.equal(resolveDestination("https://github.com/Juri-Halveth/open-research-branches/blob/v0.15.0/README.md", source, root).kind, "external");
  assert.equal(resolveDestination("../../outside.md", source, root).kind, "outside-repository");
});

test("missing branch navigation and broken anchors fail without fetching external links", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "halveth-navigation-"));
  t.after(async () => {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(root));
    assert.match(relative, /^halveth-navigation-[^\\/]+$/u);
    await fs.rm(root, { recursive: true, force: true });
  });
  await Promise.all(["catalog", "wiki", "branches/one", "branches/two"].map((directory) => fs.mkdir(path.join(root, directory), { recursive: true })));
  await Promise.all([
    fs.writeFile(path.join(root, "catalog/branches.json"), JSON.stringify({ branches: [{ path: "branches/one" }, { path: "branches/two" }] })),
    fs.writeFile(path.join(root, "README.md"), '# Start\n[Wiki](wiki/Projekte.md#projekte)\n[External](https://example.invalid/)'),
    fs.writeFile(path.join(root, "wiki/Projekte.md"), '# Projekte\n[One](../branches/one/README.md#wrong)'),
    fs.writeFile(path.join(root, "branches/one/README.md"), '# One'),
    fs.writeFile(path.join(root, "branches/two/README.md"), '# Two')
  ]);
  const failed = await validateNavigation({ root });
  assert.equal(failed.status, "FAIL");
  assert.equal(failed.errors.length, 2);
  assert.ok(failed.errors.some((error) => error.includes("anchor not found")));
  assert.ok(failed.errors.some((error) => error.includes("branches/two")));
  await fs.writeFile(path.join(root, "wiki/Projekte.md"), '# Projekte\n[One](../branches/one/README.md#one)\n[Two](../branches/two/)');
  const passed = await validateNavigation({ root });
  assert.equal(passed.status, "PASS_WITHIN_DECLARED_COVERAGE");
  assert.equal(passed.coverageSummary.directlyLinkedCatalogBranches, 2);
  assert.equal(passed.coverageSummary.externalLinksNotFetched, 1);
  assert.equal(passed.coverageSummary.externalNetworkRequests, 0);
});
