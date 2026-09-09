import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "catalog", "public-files.txt");
const rawManifest = await fs.readFile(manifestPath, "utf8");
const expected = rawManifest
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean);

const normalized = [...new Set(expected)].sort((a, b) => a.localeCompare(b, "en"));
if (JSON.stringify(expected) !== JSON.stringify(normalized)) {
  console.error("public manifest must be sorted and contain each path exactly once");
  process.exit(1);
}

for (const relative of expected) {
  const absolute = path.join(root, ...relative.split("/"));
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat?.isFile()) {
    console.error(`manifest path is missing or not a file: ${relative}`);
    process.exit(1);
  }
}

const trackedResult = spawnSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8"
});

if (trackedResult.status === 0) {
  const tracked = trackedResult.stdout
    .split("\0")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en"));
  if (JSON.stringify(tracked) !== JSON.stringify(expected)) {
    const expectedSet = new Set(expected);
    const trackedSet = new Set(tracked);
    const missing = expected.filter((item) => !trackedSet.has(item));
    const unexpected = tracked.filter((item) => !expectedSet.has(item));
    console.error(`public manifest mismatch\nmissing: ${missing.join(", ") || "<none>"}\nunexpected: ${unexpected.join(", ") || "<none>"}`);
    process.exit(1);
  }
  console.log(`public manifest matches ${tracked.length} tracked files`);
} else {
  console.log(`public manifest paths exist: ${expected.length}; Git tracked-set check unavailable`);
}

