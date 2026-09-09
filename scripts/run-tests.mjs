import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const branchesRoot = path.join(root, "branches");

async function walk(directory) {
  const found = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else if (/\.test\.(?:mjs|js)$/u.test(entry.name)) found.push(full);
  }
  return found;
}

const tests = (await walk(branchesRoot)).sort();
if (!tests.length) {
  console.error("no branch tests found");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: root,
  stdio: "inherit"
});
process.exit(result.status ?? 1);
