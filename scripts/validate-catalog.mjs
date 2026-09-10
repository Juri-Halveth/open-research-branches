import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(import.meta.dirname, "..");
const allowedStates = new Set(["PUBLIC_DERIVATIVE", "FINITE_SNAPSHOT", "HOLD_IMPLEMENTATION"]);
const canonicalBranchPath = /^branches\/[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function normalizeBranchPath(value) {
  if (typeof value !== "string" || value !== value.trim() || !canonicalBranchPath.test(value)) {
    return null;
  }
  const normalized = path.posix.normalize(value);
  return normalized === value ? normalized : null;
}

async function listBranchDirectories(root) {
  const branchesRoot = path.join(root, "branches");
  const entries = await fs.readdir(branchesRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `branches/${entry.name}`)
    .sort(compareUtf8);
}

export async function validateCatalog({ root = DEFAULT_ROOT, catalog }) {
  const errors = [];
  const ids = new Set();
  const catalogPaths = new Set();
  let actualBranchPaths;

  try {
    actualBranchPaths = await listBranchDirectories(root);
  } catch {
    return {
      branchCount: 0,
      errors: ["branches directory is missing or unreadable"]
    };
  }

  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return { branchCount: 0, errors: ["catalog must be an object"] };
  }
  if (!Array.isArray(catalog.branches)) {
    return { branchCount: 0, errors: ["catalog branches must be an array"] };
  }

  for (const [index, branch] of catalog.branches.entries()) {
    if (!branch || typeof branch !== "object" || Array.isArray(branch)) {
      errors.push(`invalid branch entry at index ${index}`);
      continue;
    }

    const id = typeof branch.id === "string" && branch.id.trim() ? branch.id : null;
    const displayId = id ?? `<index:${index}>`;
    if (!id || ids.has(id)) errors.push(`duplicate or empty id: ${id ?? "<empty>"}`);
    if (id) ids.add(id);
    if (!allowedStates.has(branch.state)) errors.push(`unsupported state for ${displayId}: ${branch.state}`);
    if (branch.activeMain !== false) errors.push(`activeMain must be false for ${displayId}`);
    if (typeof branch.claimCeiling !== "string" || !branch.claimCeiling.trim()) {
      errors.push(`missing claimCeiling for ${displayId}`);
    }

    const normalizedPath = normalizeBranchPath(branch.path);
    if (!normalizedPath) {
      errors.push(`invalid branch path for ${displayId}`);
      continue;
    }
    if (catalogPaths.has(normalizedPath)) errors.push(`duplicate branch path: ${normalizedPath}`);
    catalogPaths.add(normalizedPath);
  }

  const actualPathSet = new Set(actualBranchPaths);
  for (const branchPath of [...catalogPaths].sort(compareUtf8)) {
    if (!actualPathSet.has(branchPath)) {
      errors.push(`catalog path without branch directory: ${branchPath}`);
      continue;
    }
    const readmePath = path.join(root, ...branchPath.split("/"), "README.md");
    const readmeStat = await fs.stat(readmePath).catch(() => null);
    if (!readmeStat?.isFile()) errors.push(`missing branch README: ${branchPath}/README.md`);
  }

  for (const branchPath of actualBranchPaths) {
    if (!catalogPaths.has(branchPath)) errors.push(`uncataloged branch directory: ${branchPath}`);
  }

  return {
    branchCount: ids.size,
    errors: [...new Set(errors)].sort(compareUtf8)
  };
}

export async function validateCatalogFile({ root = DEFAULT_ROOT } = {}) {
  const catalogPath = path.join(root, "catalog", "branches.json");
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  return validateCatalog({ root, catalog });
}

async function main() {
  const result = await validateCatalogFile();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`catalog valid: ${result.branchCount} branches`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
