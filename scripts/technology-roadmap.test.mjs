// SPDX-License-Identifier: LicenseRef-HALVETH-PIRL-2.0
// File/version permissions follow the prospective rule in ../LICENSES.md.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { renderTechnologyRoadmap } from "./build-technology-roadmap.mjs";

const catalog = { branches: [{ id: "alpha" }, { id: "beta" }] };
function fixture() {
  return {
    schemaVersion: "1.0.0",
    observedAt: "2026-09-19T12:00:00Z",
    date: "2026-09-19",
    reviewBaseCommit: "a".repeat(40),
    scope: "Synthetischer Testumfang.",
    sources: [{ id: "source-a", kind: "PUBLIC_SOURCE", description: "Synthetische Quelle.", links: [{ label: "Beispiel", path: "README.md" }] }],
    items: [{ id: "packet", title: "Austauschpaket", state: "PROPOSED", observed: "Eine Vorlage liegt vor.", nextStep: "Export zeigen.", acceptance: ["Unbekannte bleiben erhalten."], dependsOn: [], sourceIds: ["source-a"] }]
  };
}

test("duplicate item and source IDs are rejected instead of losing a record", () => {
  for (const field of ["items", "sources"]) {
    const roadmap = fixture();
    roadmap[field].push(structuredClone(roadmap[field][0]));
    assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /Duplicate .* ID/u);
  }
});

test("unknown source and dependency references fail instead of becoming empty links", () => {
  for (const field of ["sourceIds", "dependsOn"]) {
    const roadmap = fixture();
    roadmap.items[0][field] = ["missing"];
    assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /Missing .* reference missing/u);
  }
});

test("dependency cycles are rejected while an acyclic prerequisite is rendered", () => {
  const roadmap = fixture();
  roadmap.items.push({ ...structuredClone(roadmap.items[0]), id: "reader", title: "Leser", dependsOn: ["packet"] });
  assert.match(renderTechnologyRoadmap(roadmap, catalog), /\[Austauschpaket\]\(#item-packet\)/u);
  roadmap.items[0].dependsOn = ["reader"];
  assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /Dependency cycle/u);
  roadmap.items[0].dependsOn = ["packet"];
  assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /Dependency cycle/u);
});

test("declared states are preserved and unsupported states cannot become certification", () => {
  const roadmap = fixture();
  for (const state of ["SOURCE_REVIEWED_GAP", "SYNTHETIC_DEMO", "PROPOSED", "PUBLIC_MODULE"]) {
    roadmap.items[0].state = state;
    const output = renderTechnologyRoadmap(roadmap, catalog);
    assert.ok(output.includes(`**Reviewstand:** \`${state}\``));
    assert.match(output, /deklarierte Reviewstände/u);
    assert.match(output, /keine Laufzeit-Zertifizierung/u);
    assert.equal(roadmap.items[0].state, state);
  }
  for (const state of ["PRODUCTION_VERIFIED", "UNKNOWN", null]) {
    roadmap.items[0].state = state;
    assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /Unsupported item state/u);
  }
});

test("branch count comes from catalog data and rendering is deterministic without mutation", () => {
  const roadmap = fixture();
  const before = structuredClone(roadmap);
  const output = renderTechnologyRoadmap(roadmap, catalog);
  assert.match(output, /\*\*2 Forschungs- und Softwareäste\*\*/u);
  assert.match(renderTechnologyRoadmap(roadmap, { branches: [...catalog.branches, { id: "gamma" }] }), /\*\*3 Forschungs- und Softwareäste\*\*/u);
  assert.equal(renderTechnologyRoadmap(roadmap, catalog), output);
  assert.deepEqual(roadmap, before);
  assert.match(output, /\[Beispiel\]\(\.\.\/README\.md\)/u);
});

test("every work item requires at least one nonempty acceptance criterion", () => {
  for (const acceptance of [[], ["  "], null]) {
    const roadmap = fixture();
    roadmap.items[0].acceptance = acceptance;
    assert.throws(() => renderTechnologyRoadmap(roadmap, catalog), /acceptance/u);
  }
});

test("CLI checks existing local sources and detects a stale report without overwriting it", async context => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "technology-roadmap-"));
  context.after(async () => {
    const resolved = await fs.realpath(root);
    const temporaryRoot = await fs.realpath(os.tmpdir());
    assert.equal(path.dirname(resolved), temporaryRoot);
    assert.ok(path.basename(resolved).startsWith("technology-roadmap-"));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, "scripts"));
  await fs.mkdir(path.join(root, "catalog"));
  await fs.copyFile(new URL("./build-technology-roadmap.mjs", import.meta.url), path.join(root, "scripts/build-technology-roadmap.mjs"));
  await fs.writeFile(path.join(root, "catalog/technology-roadmap.json"), JSON.stringify(fixture()));
  await fs.writeFile(path.join(root, "catalog/branches.json"), JSON.stringify(catalog));
  await fs.writeFile(path.join(root, "README.md"), "# Synthetic source\n");
  function run(...args) {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/build-technology-roadmap.mjs"), ...args], { encoding: "utf8", windowsHide: true });
    assert.ifError(result.error);
    return result;
  }
  assert.equal(run().status, 0);
  const report = path.join(root, "reports/TECHNOLOGY_ROADMAP_2026-09-19.md");
  assert.deepEqual(await fs.readFile(report), Buffer.from(renderTechnologyRoadmap(fixture(), catalog), "utf8"));
  assert.equal(run("--check").status, 0);
  await fs.appendFile(report, "Stale tail\n");
  const stale = await fs.readFile(report);
  const check = run("--check");
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /STALE_REPORT/u);
  assert.deepEqual(await fs.readFile(report), stale);
  await fs.rm(path.join(root, "README.md"));
  const missing = run();
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Source link is not an existing file: README.md/u);
  assert.deepEqual(await fs.readFile(report), stale);
});
