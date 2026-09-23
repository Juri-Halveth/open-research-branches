#!/usr/bin/env node

// A lexical inventory of links and imports in tracked public text files.
// It never follows URLs, executes source files, or reads untracked material.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEXT_EXTENSIONS = new Set([".md", ".html", ".htm", ".mjs", ".js", ".cjs", ".ts", ".tsx", ".py", ".json", ".css", ".txt", ".yml", ".yaml"]);
const CODE_EXTENSIONS = ["", ".mjs", ".js", ".json", ".ts", ".tsx", "/index.mjs", "/index.js"];

export function extractReferences(source, content) {
  const found = [];
  const rules = [];
  if (source.endsWith(".md")) rules.push(["MARKDOWN_LINK", /!?\[[^\]\r\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/gu]);
  if (/\.(?:html?|md)$/u.test(source)) rules.push(["HTML_ATTRIBUTE", /\b(?:href|src)=["']([^"']+)["']/gu]);
  if (/\.(?:mjs|js|cjs|ts|tsx)$/u.test(source)) {
    rules.push(["MODULE_IMPORT", /\b(?:import|export)\s+(?:[^;\r\n]*?\s+from\s+)?["']([^"']+)["']/gu]);
    rules.push(["MODULE_IMPORT", /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu]);
  }
  for (const [kind, pattern] of rules) {
    for (const match of content.matchAll(pattern)) {
      const raw = match[1].replace(/^<|>$/gu, "");
      const line = content.slice(0, match.index).split("\n").length;
      found.push({ source, line, kind, raw });
    }
  }
  return found.sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind) || a.raw.localeCompare(b.raw));
}

export function resolveLocalReference(reference, tracked) {
  const { source, raw, kind } = reference;
  if (/^(?:https?:|mailto:|data:|javascript:|tel:|#|\/)/iu.test(raw)) return { ...reference, status: "OUTSIDE_LOCAL_GRAPH" };
  if (kind === "MODULE_IMPORT" && !/^\.\.?\//u.test(raw)) return { ...reference, status: "OUTSIDE_LOCAL_GRAPH" };
  let bare;
  try { bare = decodeURIComponent(raw.split(/[?#]/u, 1)[0]); }
  catch { return { ...reference, status: "INVALID_ENCODING" }; }
  if (!bare || bare.includes("\\") || bare.includes("\0")) return { ...reference, status: "OUTSIDE_LOCAL_GRAPH" };
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(source), bare));
  if (target === ".." || target.startsWith("../") || path.posix.isAbsolute(target)) return { ...reference, status: "OUTSIDE_LOCAL_GRAPH" };
  const candidates = kind === "MODULE_IMPORT" ? CODE_EXTENSIONS.map((suffix) => target + suffix) : [target, `${target}/README.md`, `${target}/index.html`];
  const resolved = candidates.find((candidate) => tracked.has(candidate));
  if (!resolved && kind !== "MODULE_IMPORT") {
    const directory = target.replace(/\/$/u, "");
    if ([...tracked].some((candidate) => candidate.startsWith(`${directory}/`))) return { ...reference, target: directory, status: "RESOLVED_DIRECTORY" };
  }
  return { ...reference, target: resolved ?? target, status: resolved ? "RESOLVED" : "MISSING_WITHIN_TRACKED_TREE" };
}

function git(root, args) {
  const run = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (run.error || run.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${run.error?.message ?? run.stderr?.trim()}`);
  return run.stdout;
}

export function scan(root) {
  const commit = git(root, ["rev-parse", "HEAD"]).trim();
  const files = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean).map((value) => value.replaceAll("\\", "/")).sort();
  const tracked = new Set(files);
  const textFiles = [];
  const unreadable = [];
  const edges = [];
  for (const source of files) {
    if (!TEXT_EXTENSIONS.has(path.posix.extname(source).toLowerCase())) continue;
    let content;
    try { content = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(path.join(root, ...source.split("/")))); }
    catch { unreadable.push(source); continue; }
    textFiles.push(source);
    for (const reference of extractReferences(source, content)) edges.push(resolveLocalReference(reference, tracked));
  }
  edges.sort((a, b) => a.source.localeCompare(b.source) || a.line - b.line || a.target?.localeCompare(b.target ?? "") || a.raw.localeCompare(b.raw));
  const resolved = edges.filter((edge) => edge.status === "RESOLVED" || edge.status === "RESOLVED_DIRECTORY");
  const pairs = new Set(resolved.map((edge) => `${edge.source}\0${edge.target}`));
  const reciprocalPairs = [...pairs].filter((pair) => { const [a, b] = pair.split("\0"); return a < b && pairs.has(`${b}\0${a}`); }).length;
  return {
    schema: "HALVETH_LEXICAL_REFERENCE_NETWORK_V1",
    commit,
    coverage: "git-tracked files at HEAD; UTF-8 text extensions only; Markdown/HTML links and JavaScript module imports; no URL fetch, semantic inference, private files, Git history or branch comparison",
    counts: {
      trackedFiles: files.length,
      textFilesRead: textFiles.length,
      unreadableTextCandidates: unreadable.length,
      filesWithExtractedReferences: new Set(edges.map((edge) => edge.source)).size,
      extractedReferences: edges.length,
      localResolved: resolved.length,
      localResolvedDirectory: edges.filter((edge) => edge.status === "RESOLVED_DIRECTORY").length,
      localMissing: edges.filter((edge) => edge.status === "MISSING_WITHIN_TRACKED_TREE").length,
      outsideLocalGraph: edges.filter((edge) => edge.status === "OUTSIDE_LOCAL_GRAPH").length,
      invalidEncoding: edges.filter((edge) => edge.status === "INVALID_ENCODING").length,
      reciprocalPairs
    },
    unreadable,
    missing: edges.filter((edge) => edge.status === "MISSING_WITHIN_TRACKED_TREE"),
    evidenceCeiling: "LEXICAL_REFERENCES_WITHIN_DECLARED_TRACKED_TEXT_COVERAGE_ONLY_NO_SEMANTIC_OR_SECURITY_PROOF"
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const result = scan(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
