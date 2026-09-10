import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveGitSnapshot, runPrepublishCheck, validatePublicManifest } from "./release-gate-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");

export function runPrepublishCli(ref = process.env.RELEASE_GIT_REF ?? "HEAD") {
  const snapshot = resolveGitSnapshot({ root, ref });
  const manifestReceipt = validatePublicManifest(snapshot);
  const receipt = runPrepublishCheck(snapshot, manifestReceipt.publicFiles);
  console.log(`prepublish scan clean for ${receipt.fileCount} files at commit ${receipt.commitId} tree ${receipt.treeId}`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runPrepublishCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
