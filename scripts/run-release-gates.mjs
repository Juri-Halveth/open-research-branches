import path from "node:path";
import { resolveGitSnapshot, runPrepublishCheck, validatePublicManifest } from "./release-gate-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const ref = process.env.RELEASE_GIT_REF ?? "HEAD";

try {
  const snapshot = resolveGitSnapshot({ root, ref });
  const manifestReceipt = validatePublicManifest(snapshot);
  const scanReceipt = runPrepublishCheck(snapshot, manifestReceipt.publicFiles);
  if (manifestReceipt.commitId !== scanReceipt.commitId || manifestReceipt.treeId !== scanReceipt.treeId) {
    throw new Error("release gates did not use the same Git snapshot");
  }
  console.log(`release gates clean for ${scanReceipt.fileCount} files at commit ${scanReceipt.commitId} tree ${scanReceipt.treeId}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
