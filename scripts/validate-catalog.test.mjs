import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateCatalog } from "./validate-catalog.mjs";

const validBranch = (id, branchPath = `branches/${id}`) => ({
  id,
  title: id,
  kind: "test-fixture",
  state: "FINITE_SNAPSHOT",
  path: branchPath,
  claimCeiling: "SYNTHETIC_TEST_FIXTURE_ONLY",
  dataClass: "SYNTHETIC_ONLY",
  activeMain: false
});

async function makeFixture(context, branchNames) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "open-research-catalog-"));
  context.after(async () => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "branches"), { recursive: true });
  for (const name of branchNames) {
    const branchRoot = path.join(root, "branches", name);
    await fs.mkdir(branchRoot, { recursive: true });
    await fs.writeFile(path.join(branchRoot, "README.md"), `# ${name}\n`, "utf8");
  }
  return root;
}

test("accepts a complete one-to-one catalog without exposing its root path", async (context) => {
  const root = await makeFixture(context, ["alpha", "beta"]);
  const result = await validateCatalog({
    root,
    catalog: { branches: [validBranch("alpha"), validBranch("beta")] }
  });
  assert.deepEqual(result, { branchCount: 2, errors: [] });
  assert.equal(JSON.stringify(result).includes(root), false);
});

test("rejects an uncataloged branch directory", async (context) => {
  const root = await makeFixture(context, ["alpha", "orphan"]);
  const result = await validateCatalog({ root, catalog: { branches: [validBranch("alpha")] } });
  assert.deepEqual(result.errors, ["uncataloged branch directory: branches/orphan"]);
  assert.equal(result.errors.join("\n").includes(root), false);
});

test("rejects duplicate catalog paths with deterministic relative output", async (context) => {
  const root = await makeFixture(context, ["alpha"]);
  const result = await validateCatalog({
    root,
    catalog: { branches: [validBranch("alpha"), validBranch("beta", "branches/alpha")] }
  });
  assert.deepEqual(result.errors, ["duplicate branch path: branches/alpha"]);
});

test("rejects a non-canonical or escaping catalog path before filesystem access", async (context) => {
  const root = await makeFixture(context, []);
  const result = await validateCatalog({
    root,
    catalog: { branches: [validBranch("escape", "branches/../escape")] }
  });
  assert.deepEqual(result.errors, ["invalid branch path for escape"]);
  assert.equal(result.errors.join("\n").includes(root), false);
});

test("rejects a catalog path without a corresponding branch directory", async (context) => {
  const root = await makeFixture(context, []);
  const result = await validateCatalog({ root, catalog: { branches: [validBranch("missing")] } });
  assert.deepEqual(result.errors, ["catalog path without branch directory: branches/missing"]);
});

test("sorts multiple independent failures deterministically", async (context) => {
  const root = await makeFixture(context, ["alpha", "orphan"]);
  const result = await validateCatalog({
    root,
    catalog: {
      branches: [
        validBranch("alpha"),
        validBranch("duplicate", "branches/alpha"),
        validBranch("missing"),
        validBranch("escape", "branches/../escape")
      ]
    }
  });
  assert.deepEqual(result.errors, [
    "catalog path without branch directory: branches/missing",
    "duplicate branch path: branches/alpha",
    "invalid branch path for escape",
    "uncataloged branch directory: branches/orphan"
  ]);
  assert.equal(result.errors.join("\n").includes(root), false);
});
