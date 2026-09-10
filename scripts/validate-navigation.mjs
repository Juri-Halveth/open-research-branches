import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPOSITORY = "Juri-Halveth/open-research-branches";
const slash = (value) => value.split(path.sep).join("/");
const unescapeMarkdown = (value) => value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/gu, "$1");
const referenceId = (value) => value.trim().replace(/\s+/gu, " ").toLowerCase();

function withoutFences(text) {
  let fence = null;
  return text.split("\n").map((line) => {
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/u);
    if (!fence && opening) {
      fence = { character: opening[1][0], length: opening[1].length };
      return " ".repeat(line.length);
    }
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/u);
      if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) fence = null;
      return " ".repeat(line.length);
    }
    return line;
  }).join("\n").replace(/<!--[^]*?-->/gu, (value) => value.replace(/[^\n]/gu, " "));
}

function closingBracket(text, start) {
  let depth = 1;
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === "\\") index += 1;
    else if (text[index] === "[") depth += 1;
    else if (text[index] === "]" && --depth === 0) return index;
  }
  return -1;
}

function destinationAt(text, start) {
  let index = start;
  while (/\s/u.test(text[index] ?? "") && index < text.length) index += 1;
  if (text[index] === "<") {
    const end = text.indexOf(">", index + 1);
    return end < 0 ? null : text.slice(index + 1, end);
  }
  const from = index;
  let depth = 0;
  for (; index < text.length; index += 1) {
    if (text[index] === "\\") index += 1;
    else if (text[index] === "(") depth += 1;
    else if (text[index] === ")") {
      if (depth === 0) break;
      depth -= 1;
    } else if (/\s/u.test(text[index]) && depth === 0) break;
  }
  return index === from ? null : text.slice(from, index);
}

// A finite navigation syntax: inline/reference links, images, autolinks and
// quoted HTML href/src. Code examples and comments are excluded.
export function extractLinks(markdown) {
  const clean = withoutFences(markdown).replace(/(`+)([^]*?)\1/gu, (value) => value.replace(/[^\n]/gu, " "));
  const definitions = new Map();
  const text = clean.replace(/^ {0,3}\[([^\]\n]+)\]:\s*([^\n]*)$/gmu, (whole, id, rest) => {
    const destination = destinationAt(rest, 0);
    if (destination) definitions.set(referenceId(id), destination);
    return " ".repeat(whole.length);
  });
  const links = [];
  function add(destination, offset) {
    links.push({ destination: unescapeMarkdown(destination), line: text.slice(0, offset).split("\n").length });
  }
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "[" || text[start - 1] === "\\") continue;
    const end = closingBracket(text, start);
    if (end < 0) continue;
    const label = text.slice(start + 1, end);
    if (text[end + 1] === "(") {
      const destination = destinationAt(text, end + 2);
      if (destination) add(destination, start);
    } else if (text[end + 1] === "[") {
      const referenceEnd = text.indexOf("]", end + 2);
      if (referenceEnd < 0) continue;
      const id = text.slice(end + 2, referenceEnd) || label;
      const destination = definitions.get(referenceId(id));
      if (destination) add(destination, start);
    } else {
      const destination = definitions.get(referenceId(label));
      if (destination) add(destination, start);
    }
  }
  for (const match of text.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gu)) add(match[2].replace(/&amp;/gu, "&"), match.index);
  for (const match of text.matchAll(/<(https?:\/\/[^\s<>]+)>/gu)) add(match[1], match.index);
  return [...new Map(links.map((link) => [`${link.line}:${link.destination}`, link])).values()];
}

export function headingAnchors(markdown) {
  const text = withoutFences(markdown);
  const anchors = new Set();
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const atx = lines[index].match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);
    const setext = index + 1 < lines.length && /^ {0,3}(?:=+|-+)\s*$/u.test(lines[index + 1]) && lines[index].trim();
    const heading = atx?.[1] ?? (setext ? lines[index].trim() : null);
    if (!heading) continue;
    const plain = unescapeMarkdown(heading)
      .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
      .replace(/<[^>]*>/gu, "")
      .replace(/&amp;/gu, "&");
    const base = plain.toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, "").replace(/\s/gu, "-");
    let anchor = base;
    for (let suffix = 1; anchors.has(anchor); suffix += 1) anchor = `${base}-${suffix}`;
    anchors.add(anchor);
  }
  for (const match of text.matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/gu)) anchors.add(match[2]);
  return anchors;
}

export function resolveDestination(destination, source, root) {
  let value = destination;
  if (/^https?:\/\//iu.test(value)) {
    const url = new URL(value);
    const prefix = `/${REPOSITORY}/`;
    if (url.hostname.toLowerCase() !== "github.com" || !url.pathname.startsWith(prefix)) return { kind: "external" };
    const match = url.pathname.slice(prefix.length).match(/^(?:blob|tree)\/main(?:\/(.*))?$/u);
    if (!match) return { kind: "external" };
    value = `${match[1] ?? ""}${url.hash}`;
    source = path.join(root, "README.md");
  } else if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu.test(value)) {
    return { kind: /^(?:mailto:|tel:)/iu.test(value) ? "contact" : "unsupported" };
  }
  const hashIndex = value.indexOf("#");
  const fragment = hashIndex < 0 ? "" : decodeURIComponent(value.slice(hashIndex + 1));
  const queryless = (hashIndex < 0 ? value : value.slice(0, hashIndex)).split("?")[0];
  const decoded = decodeURIComponent(queryless);
  if (decoded.includes("\\") || path.isAbsolute(decoded)) return { kind: "unsupported" };
  const target = decoded ? path.resolve(path.dirname(source), decoded) : source;
  const relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return { kind: "outside-repository" };
  return { kind: "local", target, relative: slash(relative), fragment };
}

export async function validateNavigation({ root = DEFAULT_ROOT } = {}) {
  root = path.resolve(root);
  const errors = [];
  const warnings = [];
  const pages = ["README.md"];
  const wiki = await fs.readdir(path.join(root, "wiki"), { withFileTypes: true }).catch(() => null);
  if (!wiki) errors.push("wiki/: directory is missing or unreadable");
  else pages.push(...wiki.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => `wiki/${entry.name}`).sort());
  if (!pages.includes("wiki/Projekte.md")) errors.push("wiki/Projekte.md: project index is missing");
  const catalog = JSON.parse(await fs.readFile(path.join(root, "catalog/branches.json"), "utf8"));
  if (!Array.isArray(catalog.branches)) throw new Error("catalog/branches.json: branches must be an array");
  const branchPaths = new Set(catalog.branches.map((branch) => branch.path));
  const reachedBranches = new Set();
  const cache = new Map();
  const counts = { documents: 0, links: 0, localLinks: 0, anchors: 0, externalLinksNotFetched: 0, contactLinks: 0, otherFileFragmentsNotChecked: 0 };
  async function read(target) {
    if (!cache.has(target)) cache.set(target, await fs.readFile(target, "utf8"));
    return cache.get(target);
  }
  for (const page of pages) {
    const source = path.join(root, page);
    let markdown;
    try { markdown = await read(source); }
    catch { errors.push(`${page}: file is missing or unreadable`); continue; }
    counts.documents += 1;
    for (const link of extractLinks(markdown)) {
      counts.links += 1;
      const context = `${page}:${link.line} (${link.destination})`;
      let resolved;
      try { resolved = resolveDestination(link.destination, source, root); }
      catch { errors.push(`${context}: malformed URL or percent encoding`); continue; }
      if (resolved.kind === "external") { counts.externalLinksNotFetched += 1; continue; }
      if (resolved.kind === "contact") { counts.contactLinks += 1; continue; }
      if (resolved.kind !== "local") { errors.push(`${context}: ${resolved.kind}`); continue; }
      counts.localLinks += 1;
      let target = resolved.target;
      const stat = await fs.stat(target).catch(() => null);
      if (!stat) { errors.push(`${context}: target does not exist`); continue; }
      if (page === "wiki/Projekte.md") {
        for (const branchPath of branchPaths) {
          if (resolved.relative === branchPath || resolved.relative === `${branchPath}/README.md`) reachedBranches.add(branchPath);
        }
      }
      if (!resolved.fragment) continue;
      if (stat.isDirectory()) target = path.join(target, "README.md");
      if (!/\.md$/iu.test(target)) {
        if (/^L\d+(?:-L\d+)?$/u.test(resolved.fragment) && stat.isFile()) {
          const bounds = resolved.fragment.match(/\d+/gu).map(Number);
          const length = (await read(target)).split("\n").length;
          if (bounds[0] < 1 || bounds.at(-1) > length || bounds.at(-1) < bounds[0]) errors.push(`${context}: line fragment is outside file`);
          counts.anchors += 1;
        } else {
          counts.otherFileFragmentsNotChecked += 1;
          warnings.push(`${context}: fragment semantics are outside Markdown/line-anchor coverage`);
        }
        continue;
      }
      counts.anchors += 1;
      try {
        if (!headingAnchors(await read(target)).has(resolved.fragment)) errors.push(`${context}: heading or explicit HTML anchor not found`);
      } catch { errors.push(`${context}: Markdown anchor target is unreadable`); }
    }
  }
  for (const branchPath of branchPaths) {
    if (!reachedBranches.has(branchPath)) errors.push(`wiki/Projekte.md: catalog branch has no direct directory/README link: ${branchPath}`);
  }
  return {
    status: errors.length ? "FAIL" : "PASS_WITHIN_DECLARED_COVERAGE",
    coverageSummary: {
      sourceScope: "README.md and direct wiki/*.md files; link targets are read only to check existence and anchors",
      syntax: "inline and reference Markdown links/images, autolinks, quoted HTML href/src; fenced code and comments excluded",
      anchorScope: "ATX/setext heading slugs, repeated-heading suffixes, explicit HTML anchors, source line fragments",
      repositoryUrlScope: `https://github.com/${REPOSITORY}/blob/main/ and /tree/main/`,
      externalNetworkRequests: 0,
      meaning: "Navigation integrity only; no factual, legal, authorship, security or publication validation",
      ...counts,
      catalogBranches: branchPaths.size,
      directlyLinkedCatalogBranches: reachedBranches.size
    },
    errors: [...new Set(errors)].sort(),
    warnings: [...new Set(warnings)].sort()
  };
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  validateNavigation().then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
