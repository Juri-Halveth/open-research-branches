import fs from "node:fs/promises";
import path from "node:path";

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
  let contents = await fs.readFile(absolute, "utf8");
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
