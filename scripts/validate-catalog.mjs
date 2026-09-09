import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "catalog", "branches.json");
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));

const ids = new Set();
const allowedStates = new Set(["PUBLIC_DERIVATIVE", "FINITE_SNAPSHOT", "HOLD_IMPLEMENTATION"]);
const errors = [];

for (const branch of catalog.branches ?? []) {
  if (!branch.id || ids.has(branch.id)) errors.push(`duplicate or empty id: ${branch.id ?? "<empty>"}`);
  ids.add(branch.id);
  if (!allowedStates.has(branch.state)) errors.push(`unsupported state for ${branch.id}: ${branch.state}`);
  if (branch.activeMain !== false) errors.push(`activeMain must be false for ${branch.id}`);
  if (!branch.claimCeiling) errors.push(`missing claimCeiling for ${branch.id}`);
  const branchPath = path.join(root, branch.path ?? "");
  try {
    const stat = await fs.stat(branchPath);
    if (!stat.isDirectory()) errors.push(`not a directory: ${branch.path}`);
    await fs.access(path.join(branchPath, "README.md"));
  } catch {
    errors.push(`missing branch or README: ${branch.path}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`catalog valid: ${ids.size} branches`);

