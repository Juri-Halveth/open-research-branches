import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveGitSnapshot, validatePublicManifest } from "./release-gate-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");

export function runPublicManifestCli(ref = process.env.RELEASE_GIT_REF ?? "HEAD") {
  const snapshot = resolveGitSnapshot({ root, ref });
  const receipt = validatePublicManifest(snapshot);
  console.log(`public manifest matches ${receipt.fileCount} files at commit ${receipt.commitId} tree ${receipt.treeId}`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runPublicManifestCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
