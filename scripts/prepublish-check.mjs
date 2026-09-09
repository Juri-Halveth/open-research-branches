import fs from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "catalog", "public-files.txt");
const publicIdentitiesPath = path.join(root, "catalog", "public-identities.json");
const publicFiles = (await fs.readFile(manifestPath, "utf8"))
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean);

const publicIdentityConfig = JSON.parse(await fs.readFile(publicIdentitiesPath, "utf8"));
const publicIdentities = publicIdentityConfig.identities ?? [];
for (const identity of publicIdentities) {
  if (typeof identity.exactText !== "string" || identity.exactText.trim() !== identity.exactText || identity.exactText.length < 3) {
    throw new TypeError("public identity exactText must be a trimmed string of at least three characters");
  }
  if (!identity.authorizationState || !identity.authorizedAt || !Array.isArray(identity.files) || !identity.files.length) {
    throw new TypeError(`public identity ${identity.exactText} requires authorization, date and exact file scopes`);
  }
  for (const relative of identity.files) {
    if (!publicFiles.includes(relative)) {
      throw new TypeError(`public identity scope is not in the manifest: ${relative}`);
    }
  }
}

const binaryExtensions = new Set([".docx", ".pdf", ".pptx", ".xlsx"]);
const findings = [];
const textPatterns = [
  { label: "absolute Windows path", expression: /\b[A-Za-z]:\\(?:Users|Documents|Desktop|AppData)\\/u },
  { label: "local account marker", expression: new RegExp("\\b(?:" + "ja" + "nov|" + "JU" + "RI\\\\)", "iu") },
  { label: "private key marker", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { label: "credential assignment", expression: /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/iu },
  { label: "wallet-style private key", expression: /\b0x[a-f0-9]{64}\b/iu },
  { label: "email address", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu }
];

function readNullTerminated(buffer, start) {
  const end = buffer.indexOf(0, start);
  if (end < 0) throw new TypeError("PNG text chunk is missing a null terminator");
  return { value: buffer.subarray(start, end), next: end + 1 };
}

function extractPngTextMetadata(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < signature.length || !buffer.subarray(0, 8).equals(signature)) {
    throw new TypeError("invalid PNG signature");
  }

  const text = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new TypeError(`truncated PNG chunk: ${type}`);
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === "tEXt") {
      const keyword = readNullTerminated(data, 0);
      text.push(keyword.value.toString("latin1"), data.subarray(keyword.next).toString("latin1"));
    } else if (type === "zTXt") {
      const keyword = readNullTerminated(data, 0);
      if (data[keyword.next] !== 0) throw new TypeError("unsupported PNG zTXt compression method");
      text.push(keyword.value.toString("latin1"), inflateSync(data.subarray(keyword.next + 1)).toString("latin1"));
    } else if (type === "iTXt") {
      const keyword = readNullTerminated(data, 0);
      const compressed = data[keyword.next];
      const compressionMethod = data[keyword.next + 1];
      if (compressed > 1 || compressionMethod !== 0) throw new TypeError("unsupported PNG iTXt encoding");
      const language = readNullTerminated(data, keyword.next + 2);
      const translatedKeyword = readNullTerminated(data, language.next);
      const payload = data.subarray(translatedKeyword.next);
      text.push(
        keyword.value.toString("latin1"),
        language.value.toString("ascii"),
        translatedKeyword.value.toString("utf8"),
        (compressed ? inflateSync(payload) : payload).toString("utf8")
      );
    }

    offset = dataEnd + 4;
    if (type === "IEND") break;
  }
  return text.join("\n");
}

for (const relative of publicFiles) {
  const absolute = path.join(root, ...relative.split("/"));
  const stat = await fs.stat(absolute);
  if (stat.size > 8 * 1024 * 1024) findings.push(`${relative}: file exceeds 8 MiB`);
  if (path.basename(relative) === ".env" || /\.(?:pem|key|pfx|p12)$/iu.test(relative)) {
    findings.push(`${relative}: forbidden secret-bearing extension`);
    continue;
  }
  if (binaryExtensions.has(path.extname(relative).toLowerCase())) {
    findings.push(`${relative}: binary document requires a dedicated public metadata and content scanner`);
    continue;
  }
  const extension = path.extname(relative).toLowerCase();
  let contents;
  if (extension === ".png") {
    try {
      contents = extractPngTextMetadata(await fs.readFile(absolute));
    } catch (error) {
      findings.push(`${relative}: PNG metadata scan failed: ${error.message}`);
      continue;
    }
  } else {
    contents = await fs.readFile(absolute, "utf8");
  }
  for (const identity of publicIdentities) {
    if (identity.files.includes(relative)) {
      contents = contents.split(identity.exactText).join("[AUTHORIZED_PUBLIC_IDENTITY]");
    }
  }
  for (const pattern of textPatterns) {
    if (pattern.expression.test(contents)) findings.push(`${relative}: ${pattern.label}`);
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log(`prepublish scan clean for ${publicFiles.length} manifest files`);
