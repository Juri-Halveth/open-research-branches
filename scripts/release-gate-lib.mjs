import path from "node:path";
import { spawnSync } from "node:child_process";
import { inflateSync } from "node:zlib";

const MAX_PUBLIC_FILE_BYTES = 8 * 1024 * 1024;
const MANIFEST_PATH = "catalog/public-files.txt";
const PUBLIC_IDENTITIES_PATH = "catalog/public-identities.json";
const PUBLIC_IDENTITIES_SCHEMA_VERSION = "1.0.0";
const PUBLIC_IDENTITIES_SERIALIZATION_VERSION = "PRETTY_JSON_V1";
const FATAL_UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const TEXT_EXTENSIONS = new Set([
  ".cff", ".css", ".csv", ".html", ".js", ".json", ".md", ".mjs", ".py", ".txt", ".yaml", ".yml"
]);
const TEXT_BASENAMES = new Set([".gitattributes", ".gitignore", "LICENSE"]);
const REJECTED_BINARY_EXTENSIONS = new Set([".docx", ".pdf", ".pptx", ".xlsx"]);

const TEXT_PATTERNS = [
  { label: "absolute Windows path", expression: /\b[A-Za-z]:\\(?:Users|Documents|Desktop|AppData)\\/u },
  { label: "local account marker", expression: new RegExp("\\b(?:" + "ja" + "nov|" + "JU" + "RI\\\\)", "iu") },
  { label: "private key marker", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { label: "credential assignment", expression: /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/iu },
  { label: "wallet-style private key", expression: /\b0x[a-f0-9]{64}\b/iu },
  { label: "email address", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu }
];

export class ReleaseGateError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReleaseGateError";
  }
}

function comparePaths(left, right) {
  return left.localeCompare(right, "en");
}

function assertExactObjectKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new ReleaseGateError(`${label}: expected a plain JSON object`);
  }
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new ReleaseGateError(`${label}: object keys must be exactly ${expectedKeys.join(", ")} in this order`);
  }
}

function runGit(root, args, input) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: null,
    input,
    maxBuffer: 512 * 1024 * 1024,
    windowsHide: true
  });
  if (result.error || result.status !== 0) {
    throw new ReleaseGateError(`Git verification failed for: git ${args.join(" ")}`);
  }
  return Buffer.from(result.stdout ?? []);
}

function decodeGitText(bytes, label) {
  try {
    return FATAL_UTF8.decode(bytes);
  } catch {
    throw new ReleaseGateError(`${label}: Git returned non-UTF-8 data`);
  }
}

export function decodePublicText(bytes, label) {
  const buffer = Buffer.from(bytes);
  if (
    buffer.length >= 2 &&
    ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff))
  ) {
    throw new ReleaseGateError(`${label}: UTF-16 text is not supported`);
  }
  if (buffer.includes(0)) {
    throw new ReleaseGateError(`${label}: NUL byte is not allowed in text`);
  }
  try {
    return FATAL_UTF8.decode(buffer);
  } catch {
    throw new ReleaseGateError(`${label}: invalid UTF-8 text`);
  }
}

export function validateManifestPath(relative, label = "manifest path") {
  if (typeof relative !== "string" || !relative.length) {
    throw new ReleaseGateError(`${label}: path must be a non-empty string`);
  }
  if (relative.trim() !== relative) {
    throw new ReleaseGateError(`${label}: surrounding whitespace is not allowed`);
  }
  if (relative.includes("\\")) {
    throw new ReleaseGateError(`${label}: backslashes are not allowed: ${relative}`);
  }
  if (path.posix.isAbsolute(relative) || /^[A-Za-z]:\//u.test(relative)) {
    throw new ReleaseGateError(`${label}: absolute paths are not allowed: ${relative}`);
  }
  const segments = relative.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new ReleaseGateError(`${label}: dot or empty path segments are not allowed: ${relative}`);
  }
  if (path.posix.normalize(relative) !== relative) {
    throw new ReleaseGateError(`${label}: path is not normalized: ${relative}`);
  }
  if (/[\u0000-\u001f\u007f]/u.test(relative)) {
    throw new ReleaseGateError(`${label}: control characters are not allowed`);
  }
  return relative;
}

function parseTree(bytes) {
  const entries = [];
  let offset = 0;
  while (offset < bytes.length) {
    const end = bytes.indexOf(0, offset);
    if (end < 0) throw new ReleaseGateError("Git tree listing is not NUL-terminated");
    const record = decodeGitText(bytes.subarray(offset, end), "Git tree listing");
    const tab = record.indexOf("\t");
    const header = tab < 0 ? "" : record.slice(0, tab);
    const relative = tab < 0 ? "" : record.slice(tab + 1);
    const match = /^(\d{6}) ([a-z]+) ([0-9a-f]{40,64})$/u.exec(header);
    if (!match) throw new ReleaseGateError("Git tree listing contains a malformed record");
    validateManifestPath(relative, "Git tree path");
    entries.push(Object.freeze({ mode: match[1], type: match[2], objectId: match[3], path: relative }));
    offset = end + 1;
  }
  const names = new Set();
  for (const entry of entries) {
    if (names.has(entry.path)) throw new ReleaseGateError(`Git tree contains a duplicate path: ${entry.path}`);
    names.add(entry.path);
  }
  return Object.freeze(entries);
}

function loadBlobObjects(root, entries) {
  const objectIds = [...new Set(entries.filter((entry) => entry.type === "blob").map((entry) => entry.objectId))];
  if (!objectIds.length) return new Map();
  const output = runGit(root, ["cat-file", "--batch"], Buffer.from(`${objectIds.join("\n")}\n`, "ascii"));
  const blobs = new Map();
  let offset = 0;
  for (const requestedId of objectIds) {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) throw new ReleaseGateError("Git blob batch response is truncated");
    const header = output.toString("ascii", offset, headerEnd);
    const match = /^([0-9a-f]{40,64}) blob (\d+)$/u.exec(header);
    if (!match || match[1] !== requestedId) throw new ReleaseGateError("Git blob batch response is malformed");
    const size = Number(match[2]);
    const dataStart = headerEnd + 1;
    const dataEnd = dataStart + size;
    if (!Number.isSafeInteger(size) || dataEnd >= output.length || output[dataEnd] !== 0x0a) {
      throw new ReleaseGateError("Git blob batch response has an invalid size");
    }
    blobs.set(requestedId, Buffer.from(output.subarray(dataStart, dataEnd)));
    offset = dataEnd + 1;
  }
  if (offset !== output.length) throw new ReleaseGateError("Git blob batch response contains trailing data");
  return blobs;
}

export function resolveGitSnapshot({ root, ref = "HEAD" }) {
  const repositoryRoot = path.resolve(root);
  if (typeof ref !== "string" || !ref.length || ref.trim() !== ref || ref.startsWith("-") || ref.includes("\0")) {
    throw new ReleaseGateError("Git ref must be one non-empty, trimmed revision expression");
  }
  const discoveredRoot = decodeGitText(runGit(repositoryRoot, ["rev-parse", "--show-toplevel"]), "Git repository root").trim();
  if (path.resolve(discoveredRoot) !== repositoryRoot) {
    throw new ReleaseGateError("release gate root must be the exact Git repository root");
  }
  const commitId = decodeGitText(
    runGit(repositoryRoot, ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]),
    "Git commit"
  ).trim();
  if (!/^[0-9a-f]{40,64}$/u.test(commitId)) throw new ReleaseGateError("Git commit resolution returned an invalid object ID");
  const treeId = decodeGitText(
    runGit(repositoryRoot, ["rev-parse", "--verify", "--end-of-options", `${commitId}^{tree}`]),
    "Git tree"
  ).trim();
  if (!/^[0-9a-f]{40,64}$/u.test(treeId)) throw new ReleaseGateError("Git tree resolution returned an invalid object ID");
  const entries = parseTree(runGit(repositoryRoot, ["ls-tree", "-r", "-z", "--full-tree", treeId]));
  const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const blobs = loadBlobObjects(repositoryRoot, entries);

  return Object.freeze({
    requestedRef: ref,
    commitId,
    treeId,
    entries,
    readBlob(relative) {
      validateManifestPath(relative, "requested blob path");
      const entry = entryByPath.get(relative);
      if (!entry || entry.type !== "blob") throw new ReleaseGateError(`Git snapshot has no blob at: ${relative}`);
      const bytes = blobs.get(entry.objectId);
      if (!bytes) throw new ReleaseGateError(`Git snapshot blob could not be loaded: ${relative}`);
      return Buffer.from(bytes);
    }
  });
}

export function parsePublicManifest(bytes) {
  const text = decodePublicText(bytes, MANIFEST_PATH);
  const lines = text.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();
  if (!lines.length) throw new ReleaseGateError("public manifest must not be empty");
  for (const [index, relative] of lines.entries()) {
    validateManifestPath(relative, `public manifest line ${index + 1}`);
  }
  const normalized = [...new Set(lines)].sort(comparePaths);
  if (JSON.stringify(lines) !== JSON.stringify(normalized)) {
    throw new ReleaseGateError("public manifest must be sorted and contain each path exactly once");
  }
  return Object.freeze(lines);
}

export function validatePublicManifest(snapshot) {
  const publicFiles = parsePublicManifest(snapshot.readBlob(MANIFEST_PATH));
  const unsupported = snapshot.entries.filter((entry) => entry.type !== "blob");
  if (unsupported.length) {
    throw new ReleaseGateError(`public release contains unsupported non-blob tree entries: ${unsupported.map((entry) => entry.path).join(", ")}`);
  }
  const tracked = snapshot.entries.map((entry) => entry.path).sort(comparePaths);
  if (JSON.stringify(tracked) !== JSON.stringify(publicFiles)) {
    const expectedSet = new Set(publicFiles);
    const trackedSet = new Set(tracked);
    const missing = publicFiles.filter((item) => !trackedSet.has(item));
    const unexpected = tracked.filter((item) => !expectedSet.has(item));
    throw new ReleaseGateError(
      `public manifest mismatch\nmissing: ${missing.join(", ") || "<none>"}\nunexpected: ${unexpected.join(", ") || "<none>"}`
    );
  }
  return Object.freeze({ commitId: snapshot.commitId, treeId: snapshot.treeId, fileCount: publicFiles.length, publicFiles });
}

function readNullTerminated(buffer, start) {
  const end = buffer.indexOf(0, start);
  if (end < 0) throw new ReleaseGateError("PNG text chunk is missing a null terminator");
  return { value: buffer.subarray(start, end), next: end + 1 };
}

function extractPngTextMetadata(buffer, relative) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < signature.length || !buffer.subarray(0, 8).equals(signature)) {
    throw new ReleaseGateError("invalid PNG signature");
  }
  const text = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new ReleaseGateError(`truncated PNG chunk: ${type}`);
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === "tEXt") {
      const keyword = readNullTerminated(data, 0);
      text.push(keyword.value.toString("latin1"), data.subarray(keyword.next).toString("latin1"));
    } else if (type === "zTXt") {
      const keyword = readNullTerminated(data, 0);
      if (data[keyword.next] !== 0) throw new ReleaseGateError("unsupported PNG zTXt compression method");
      text.push(keyword.value.toString("latin1"), inflateSync(data.subarray(keyword.next + 1)).toString("latin1"));
    } else if (type === "iTXt") {
      const keyword = readNullTerminated(data, 0);
      const compressed = data[keyword.next];
      const compressionMethod = data[keyword.next + 1];
      if (compressed > 1 || compressionMethod !== 0) throw new ReleaseGateError("unsupported PNG iTXt encoding");
      const language = readNullTerminated(data, keyword.next + 2);
      const translatedKeyword = readNullTerminated(data, language.next);
      const payload = compressed ? inflateSync(data.subarray(translatedKeyword.next)) : data.subarray(translatedKeyword.next);
      text.push(
        keyword.value.toString("latin1"),
        language.value.toString("ascii"),
        decodePublicText(translatedKeyword.value, `${relative} iTXt translated keyword`),
        decodePublicText(payload, `${relative} iTXt payload`)
      );
    }
    offset = dataEnd + 4;
    if (type === "IEND") break;
  }
  return text.join("\n");
}

function readPublicIdentities(snapshot, publicFiles) {
  const text = decodePublicText(snapshot.readBlob(PUBLIC_IDENTITIES_PATH), PUBLIC_IDENTITIES_PATH);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ReleaseGateError(`${PUBLIC_IDENTITIES_PATH}: invalid JSON`);
  }
  if (`${JSON.stringify(parsed, null, 2)}\n` !== text) {
    throw new ReleaseGateError(
      `${PUBLIC_IDENTITIES_PATH}: input does not match ${PUBLIC_IDENTITIES_SERIALIZATION_VERSION} serialization`
    );
  }
  assertExactObjectKeys(parsed, ["schemaVersion", "identities"], PUBLIC_IDENTITIES_PATH);
  if (parsed.schemaVersion !== PUBLIC_IDENTITIES_SCHEMA_VERSION) {
    throw new ReleaseGateError(`${PUBLIC_IDENTITIES_PATH}: unsupported schemaVersion`);
  }
  if (!Array.isArray(parsed.identities)) {
    throw new ReleaseGateError(`${PUBLIC_IDENTITIES_PATH}: identities must be an array`);
  }
  const exactTexts = new Set();
  for (const [index, identity] of parsed.identities.entries()) {
    const label = `${PUBLIC_IDENTITIES_PATH} identity ${index}`;
    assertExactObjectKeys(identity, ["exactText", "authorizationState", "authorizedAt", "files"], label);
    if (typeof identity.exactText !== "string" || identity.exactText.trim() !== identity.exactText || identity.exactText.length < 3) {
      throw new ReleaseGateError("public identity exactText must be a trimmed string of at least three characters");
    }
    if (exactTexts.has(identity.exactText)) {
      throw new ReleaseGateError(`public identity exactText is duplicated: ${identity.exactText}`);
    }
    exactTexts.add(identity.exactText);
    if (
      typeof identity.authorizationState !== "string" ||
      identity.authorizationState.trim() !== identity.authorizationState ||
      identity.authorizationState.length === 0 ||
      typeof identity.authorizedAt !== "string" ||
      identity.authorizedAt.trim() !== identity.authorizedAt ||
      identity.authorizedAt.length === 0 ||
      !Array.isArray(identity.files) ||
      !identity.files.length
    ) {
      throw new ReleaseGateError(`public identity ${identity.exactText} requires authorization, date and exact file scopes`);
    }
    for (const relative of identity.files) {
      validateManifestPath(relative, `public identity scope for ${identity.exactText}`);
      if (!publicFiles.includes(relative)) throw new ReleaseGateError(`public identity scope is not in the manifest: ${relative}`);
    }
    const sortedUniqueFiles = [...new Set(identity.files)].sort(comparePaths);
    if (JSON.stringify(identity.files) !== JSON.stringify(sortedUniqueFiles)) {
      throw new ReleaseGateError(`public identity ${identity.exactText} file scopes must be sorted and unique`);
    }
  }
  return parsed.identities;
}

export function runPrepublishCheck(snapshot, publicFiles) {
  const manifestFiles = publicFiles ?? validatePublicManifest(snapshot).publicFiles;
  const publicIdentities = readPublicIdentities(snapshot, manifestFiles);
  const findings = [];
  for (const relative of manifestFiles) {
    const bytes = snapshot.readBlob(relative);
    if (bytes.length > MAX_PUBLIC_FILE_BYTES) findings.push(`${relative}: file exceeds 8 MiB`);
    const basename = path.posix.basename(relative);
    const extension = path.posix.extname(relative).toLowerCase();
    if (basename === ".env" || /\.(?:pem|key|pfx|p12)$/iu.test(relative)) {
      findings.push(`${relative}: forbidden secret-bearing extension`);
      continue;
    }
    if (REJECTED_BINARY_EXTENSIONS.has(extension)) {
      findings.push(`${relative}: binary document requires a dedicated public metadata and content scanner`);
      continue;
    }
    let contents;
    try {
      if (extension === ".png") {
        contents = extractPngTextMetadata(bytes, relative);
      } else if (TEXT_EXTENSIONS.has(extension) || TEXT_BASENAMES.has(basename)) {
        contents = decodePublicText(bytes, relative);
      } else {
        findings.push(`${relative}: unsupported public file format`);
        continue;
      }
    } catch (error) {
      findings.push(`${relative}: content scan failed: ${error.message}`);
      continue;
    }
    for (const identity of publicIdentities) {
      if (identity.files.includes(relative)) contents = contents.split(identity.exactText).join("[AUTHORIZED_PUBLIC_IDENTITY]");
    }
    for (const pattern of TEXT_PATTERNS) {
      if (pattern.expression.test(contents)) findings.push(`${relative}: ${pattern.label}`);
    }
  }
  if (findings.length) throw new ReleaseGateError(findings.join("\n"));
  return Object.freeze({ commitId: snapshot.commitId, treeId: snapshot.treeId, fileCount: manifestFiles.length });
}
