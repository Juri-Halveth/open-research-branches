// SPDX-License-Identifier: LicenseRef-HALVETH-PIRL-2.0
// File/version permissions follow the prospective rule in ../LICENSES.md.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STATES = new Map([
  ["SOURCE_REVIEWED_GAP", "Lücke aus der Quellenprüfung"],
  ["SYNTHETIC_DEMO", "Synthetische Demonstration"],
  ["PROPOSED", "Vorgeschlagen"],
  ["PUBLIC_MODULE", "Öffentliches Modul"]
]);
const SOURCE_KINDS = new Map([
  ["PUBLIC_SOURCE", "Öffentliche Quelle"],
  ["PRIVATE_REVIEW", "Interne Prüfung mit öffentlicher Kurzbeschreibung"]
]);
const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function text(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be nonempty text`);
  return value;
}

function list(value, label, { nonempty = false } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) {
    throw new TypeError(`${label} must be ${nonempty ? "a nonempty" : "an"} array`);
  }
  return value;
}

function id(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9._-]*$/u.test(value)) {
    throw new TypeError(`${label} must be an ASCII ID`);
  }
  return value;
}

function indexed(records, label) {
  const result = new Map();
  for (const record of list(records, label, { nonempty: true })) {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError(`${label} entry must be an object`);
    id(record.id, `${label}.id`);
    if (result.has(record.id)) throw new Error(`Duplicate ${label} ID: ${record.id}`);
    result.set(record.id, record);
  }
  return result;
}

function localPath(value) {
  text(value, "source link path");
  if (value !== value.trim() || value.includes("\\") || /[:?#<>\u0000-\u001f\u007f]/u.test(value) ||
      value.startsWith("/") || value.split("/").some(part => !part || part === "." || part === "..")) {
    throw new TypeError(`Source link path must be repository-relative: ${value}`);
  }
  return value;
}

function validate(roadmap, catalog) {
  if (!roadmap || roadmap.schemaVersion !== "1.0.0") throw new TypeError("Unsupported roadmap schemaVersion");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(roadmap.date ?? "") ||
      !Number.isFinite(Date.parse(`${roadmap.date}T00:00:00Z`)) ||
      new Date(`${roadmap.date}T00:00:00Z`).toISOString().slice(0, 10) !== roadmap.date) {
    throw new TypeError("Invalid roadmap date");
  }
  if (typeof roadmap.observedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(roadmap.observedAt) ||
      !Number.isFinite(Date.parse(roadmap.observedAt))) throw new TypeError("Invalid observedAt ISO timestamp");
  if (!/^[a-f0-9]{40}$/u.test(roadmap.reviewBaseCommit ?? "")) throw new TypeError("Invalid reviewBaseCommit");
  text(roadmap.scope, "scope");
  list(catalog?.branches, "catalog.branches");
  const sources = indexed(roadmap.sources, "source");
  const items = indexed(roadmap.items, "item");
  for (const source of sources.values()) {
    if (!SOURCE_KINDS.has(source.kind)) throw new TypeError(`Unsupported source kind: ${source.kind}`);
    text(source.description, `source ${source.id} description`);
    for (const link of list(source.links, `source ${source.id} links`)) {
      text(link?.label, `source ${source.id} link label`);
      localPath(link?.path);
    }
  }
  for (const item of items.values()) {
    if (!STATES.has(item.state)) throw new TypeError(`Unsupported item state: ${item.state}`);
    for (const field of ["title", "observed", "nextStep"]) text(item[field], `item ${item.id} ${field}`);
    for (const criterion of list(item.acceptance, `item ${item.id} acceptance`, { nonempty: true })) {
      text(criterion, `item ${item.id} acceptance criterion`);
    }
    for (const sourceId of list(item.sourceIds, `item ${item.id} sourceIds`, { nonempty: true })) {
      if (!sources.has(sourceId)) throw new Error(`Missing source reference ${sourceId} in ${item.id}`);
    }
    for (const dependency of list(item.dependsOn, `item ${item.id} dependsOn`)) {
      if (!items.has(dependency)) throw new Error(`Missing dependency reference ${dependency} in ${item.id}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(itemId) {
    if (visiting.has(itemId)) throw new Error(`Dependency cycle at ${itemId}`);
    if (visited.has(itemId)) return;
    visiting.add(itemId);
    for (const dependency of items.get(itemId).dependsOn) visit(dependency);
    visiting.delete(itemId);
    visited.add(itemId);
  }
  for (const itemId of items.keys()) visit(itemId);
  return { sources, items };
}

// Plain field values are rendered as text; the renderer owns Markdown links.
const md = value => value.replace(/([\\`*_\[\]<>])/gu, "\\$1").replace(/\r?\n/gu, " ");
const linkPath = value => value.split("/").map(part => encodeURIComponent(part).replace(/[!'()*]/gu,
  character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");

export function renderTechnologyRoadmap(roadmap, catalog) {
  const { sources, items } = validate(roadmap, catalog);
  const lines = [
    "# HALVETH · Technologie-Roadmap", "",
    `Stand: **${roadmap.date}** · Beobachtungszeit: \`${roadmap.observedAt}\``, "",
    `Review-Basis: \`${roadmap.reviewBaseCommit}\``, "",
    md(roadmap.scope), "",
    `Der [Projektkatalog](../catalog/branches.json) führt **${catalog.branches.length} Forschungs- und Softwareäste**. Diese Roadmap enthält **${items.size} Arbeitspakete**.`, "",
    "## Was die Zustände bedeuten", "",
    "Die Zustände sind deklarierte Reviewstände. Sie sind keine Laufzeit-Zertifizierung, Rechtsbewertung oder Zusage einer vollständigen Bestandsaufnahme. Dieser endliche Review lässt weitere Quellen und offene Fragen zu.", ""
  ];
  for (const [state, label] of STATES) lines.push(`- \`${state}\`: ${label}.`);
  lines.push("", "## Arbeitspakete", "");
  for (const item of items.values()) {
    lines.push(
      `<a id="item-${item.id}"></a>`, "",
      `### ${md(item.title)}`, "",
      `**ID:** \`${item.id}\` · **Reviewstand:** \`${item.state}\` (${STATES.get(item.state)})`, "",
      `**Ausgangsstand:** ${md(item.observed)}`, "",
      `**Nächster Schritt:** ${md(item.nextStep)}`, "",
      "**Abnahmekriterien:**", "",
      ...item.acceptance.map(criterion => `- ${md(criterion)}`), "",
      `**Abhängigkeiten:** ${item.dependsOn.length ? item.dependsOn.map(dependency => `[${md(items.get(dependency).title)}](#item-${dependency})`).join(", ") : "Keine deklariert."}`, "",
      `**Quellen:** ${item.sourceIds.map(sourceId => `[${sourceId}](#source-${sourceId})`).join(", ")}`, ""
    );
  }
  lines.push("## Quellenbindung", "");
  for (const source of sources.values()) {
    lines.push(
      `<a id="source-${source.id}"></a>`, "",
      `### ${source.id}`, "",
      `**Typ:** \`${source.kind}\` (${SOURCE_KINDS.get(source.kind)})`, "",
      md(source.description), ""
    );
    if (source.links.length) lines.push(...source.links.map(link => `- [${md(link.label)}](../${linkPath(link.path)})`), "");
    else lines.push("Öffentlicher Dateiverweis: nicht angegeben.", "");
  }
  lines.push(
    "## Reproduzierbare Fassung", "",
    "Dieser Bericht wird aus [technology-roadmap.json](../catalog/technology-roadmap.json) und dem [Projektkatalog](../catalog/branches.json) erzeugt. Die Prüfung bindet Datenstruktur, Referenzen und Berichtsfassung; die Quellenbewertung bleibt ein eigener Arbeitsschritt.", "",
    "```sh", "node scripts/build-technology-roadmap.mjs", "node scripts/build-technology-roadmap.mjs --check", "```", "",
    "Für Datei und Fassung gilt die [Lizenzkarte](../LICENSES.md), einschließlich ihrer prospektiven HALVETH-2.0-Regel und der fortgeltenden historischen Freigaben.", ""
  );
  return lines.join("\n");
}

async function main(args) {
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Usage: node scripts/build-technology-roadmap.mjs [--check]");
  }
  const roadmap = JSON.parse(await fs.readFile(path.join(ROOT, "catalog/technology-roadmap.json"), "utf8"));
  const catalog = JSON.parse(await fs.readFile(path.join(ROOT, "catalog/branches.json"), "utf8"));
  const output = Buffer.from(renderTechnologyRoadmap(roadmap, catalog), "utf8");
  for (const source of roadmap.sources) {
    for (const link of source.links) {
      const stat = await fs.stat(path.join(ROOT, link.path)).catch(error => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (!stat?.isFile()) throw new Error(`Source link is not an existing file: ${link.path}`);
    }
  }
  const relative = `reports/TECHNOLOGY_ROADMAP_${roadmap.date}.md`;
  const target = path.join(ROOT, relative);
  if (args[0] === "--check") {
    const actual = await fs.readFile(target).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!actual?.equals(output)) throw new Error(`STALE_REPORT: ${relative}; regenerate with node scripts/build-technology-roadmap.mjs`);
    console.log(`roadmap current: ${relative}`);
  } else {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, output);
    console.log(`roadmap written: ${relative}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
