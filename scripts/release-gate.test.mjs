import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parsePublicManifest,
  resolveGitSnapshot,
  runPrepublishCheck,
  validatePublicManifest
} from "./release-gate-lib.mjs";

function git(root, ...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
}

function write(root, relative, contents) {
  const absolute = path.join(root, ...relative.split("/"));
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function identity(exactText, files, overrides = {}) {
  return {
    exactText,
    authorizationState: "EXPLICIT_USER_AUTHORIZATION_FOR_TEST_FIXTURE",
    authorizedAt: "2026-09-10",
    files,
    ...overrides
  };
}

function createRepository(context, files = {}, omitted = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-gate-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q");
  git(root, "config", "user.name", "Release Gate Test");
  git(root, "config", "user.email", "release-gate@" + "example.invalid");
  git(root, "config", "core.autocrlf", "false");
  write(root, "catalog/public-identities.json", prettyJson({ schemaVersion: "1.0.0", identities: [] }));
  for (const [relative, contents] of Object.entries(files)) write(root, relative, contents);
  const manifestFiles = [...new Set(["catalog/public-files.txt", "catalog/public-identities.json", ...Object.keys(files)])]
    .filter((relative) => !omitted.includes(relative))
    .sort((left, right) => left.localeCompare(right, "en"));
  write(root, "catalog/public-files.txt", `${manifestFiles.join("\n")}\n`);
  git(root, "add", "--all");
  git(root, "commit", "-q", "-m", "fixture");
  return root;
}

function runFixtureGate(root) {
  const snapshot = resolveGitSnapshot({ root });
  const manifest = validatePublicManifest(snapshot);
  return runPrepublishCheck(snapshot, manifest.publicFiles);
}

test("prepublish reads committed bytes even when the worktree masks a committed secret", (context) => {
  const root = createRepository(context, { "public.md": 'api_' + 'key = "committed-secret-123"\n' });
  write(root, "public.md", "safe worktree replacement\n");
  const snapshot = resolveGitSnapshot({ root });
  const manifest = validatePublicManifest(snapshot);
  assert.throws(
    () => runPrepublishCheck(snapshot, manifest.publicFiles),
    /public\.md: credential assignment/u
  );
});

test("prepublish rejects committed UTF-16LE text", (context) => {
  const root = createRepository(context, { "public.md": Buffer.from("\ufeffpublic text\n", "utf16le") });
  const snapshot = resolveGitSnapshot({ root });
  const manifest = validatePublicManifest(snapshot);
  assert.throws(() => runPrepublishCheck(snapshot, manifest.publicFiles), /UTF-16 text is not supported/u);
});

test("prepublish rejects committed invalid UTF-8 text", (context) => {
  const root = createRepository(context, { "public.md": Buffer.from([0xc3, 0x28]) });
  const snapshot = resolveGitSnapshot({ root });
  const manifest = validatePublicManifest(snapshot);
  assert.throws(() => runPrepublishCheck(snapshot, manifest.publicFiles), /invalid UTF-8 text/u);
});

test("Git verification fails closed outside an exact repository root", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-gate-no-git-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => resolveGitSnapshot({ root }), /Git verification failed/u);
});

test("manifest rejects a committed but unlisted file", (context) => {
  const root = createRepository(context, { "public.md": "public\n", "unlisted.md": "unlisted\n" }, ["unlisted.md"]);
  const snapshot = resolveGitSnapshot({ root });
  assert.throws(() => validatePublicManifest(snapshot), /unexpected: unlisted\.md/u);
});

test("an untracked worktree file is outside the bound tree", (context) => {
  const root = createRepository(context, { "public.md": "public\n" });
  write(root, "untracked-secret.md", 'pass' + 'word = "worktree-only-secret"\n');
  const snapshot = resolveGitSnapshot({ root });
  const manifest = validatePublicManifest(snapshot);
  const receipt = runPrepublishCheck(snapshot, manifest.publicFiles);
  assert.equal(receipt.fileCount, 3);
});

test("manifest rejects absolute, traversal, backslash and non-normalized paths", () => {
  const unsafePaths = [
    "/absolute.md",
    "C:/absolute.md",
    "C:\\absolute.md",
    "../outside.md",
    "a/../outside.md",
    "a\\outside.md",
    "./relative.md",
    "a//double.md",
    "a/",
    " padded.md"
  ];
  for (const unsafe of unsafePaths) {
    assert.throws(() => parsePublicManifest(Buffer.from(`${unsafe}\n`, "utf8")), undefined, unsafe);
  }
});

test("public identity scopes reject conflicting duplicate files keys", (context) => {
  const localMarker = "ja" + "nov";
  const conflicting = `{
  "schemaVersion": "1.0.0",
  "identities": [
    {
      "exactText": "${localMarker}",
      "authorizationState": "EXPLICIT_USER_AUTHORIZATION_FOR_TEST_FIXTURE",
      "authorizedAt": "2026-09-10",
      "files": [
        "catalog/public-identities.json"
      ],
      "files": [
        "catalog/public-identities.json",
        "public.md"
      ]
    }
  ]
}\n`;
  const root = createRepository(context, {
    "catalog/public-identities.json": conflicting,
    "public.md": `${localMarker}\n`
  });

  assert.throws(() => runFixtureGate(root), /does not match PRETTY_JSON_V1 serialization/u);
});

test("public identities require the exact versioned closed schema", (context) => {
  const canonicalEmpty = prettyJson({ schemaVersion: "1.0.0", identities: [] });
  const fixtures = [
    ["alternate serialization", '{"schemaVersion":"1.0.0","identities":[]}\n', /PRETTY_JSON_V1/u],
    ["CRLF serialization", canonicalEmpty.replaceAll("\n", "\r\n"), /PRETTY_JSON_V1/u],
    ["BOM serialization", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(canonicalEmpty)]), /invalid JSON/u],
    ["alternate root key order", prettyJson({ identities: [], schemaVersion: "1.0.0" }), /object keys must be exactly/u],
    ["unsupported version", prettyJson({ schemaVersion: "2.0.0", identities: [] }), /unsupported schemaVersion/u],
    ["unknown root key", prettyJson({ schemaVersion: "1.0.0", identities: [], extra: true }), /object keys must be exactly/u],
    [
      "unknown identity key",
      prettyJson({
        schemaVersion: "1.0.0",
        identities: [{ ...identity("PUBLIC_NAME", ["public.md"]), extra: true }]
      }),
      /object keys must be exactly/u
    ],
    [
      "alternate identity key order",
      prettyJson({
        schemaVersion: "1.0.0",
        identities: [
          {
            files: ["public.md"],
            exactText: "PUBLIC_NAME",
            authorizationState: "EXPLICIT_USER_AUTHORIZATION_FOR_TEST_FIXTURE",
            authorizedAt: "2026-09-10"
          }
        ]
      }),
      /object keys must be exactly/u
    ]
  ];

  for (const [label, identities, expected] of fixtures) {
    const root = createRepository(context, {
      "catalog/public-identities.json": identities,
      "public.md": "public\n"
    });
    assert.throws(() => runFixtureGate(root), expected, label);
  }
});

test("public identities reject duplicate names and noncanonical file scope sets", (context) => {
  const fixtures = [
    [
      "duplicate exactText",
      [identity("PUBLIC_NAME", ["public.md"]), identity("PUBLIC_NAME", ["public.md"])],
      /exactText is duplicated/u
    ],
    [
      "duplicate scope",
      [identity("PUBLIC_NAME", ["public.md", "public.md"])],
      /file scopes must be sorted and unique/u
    ],
    [
      "unsorted scopes",
      [identity("PUBLIC_NAME", ["public.md", "catalog/public-identities.json"])],
      /file scopes must be sorted and unique/u
    ]
  ];

  for (const [label, identities, expected] of fixtures) {
    const root = createRepository(context, {
      "catalog/public-identities.json": prettyJson({ schemaVersion: "1.0.0", identities }),
      "public.md": "public\n"
    });
    assert.throws(() => runFixtureGate(root), expected, label);
  }
});
