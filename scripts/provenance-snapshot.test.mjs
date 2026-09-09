import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalize,
  classifyLicense,
  computeFileRoot,
  sha256
} from "./create-provenance-snapshot.mjs";

test("canonicalize is independent of object key insertion order", () => {
  assert.equal(canonicalize({ z: 1, a: { y: 2, b: 3 } }), canonicalize({ a: { b: 3, y: 2 }, z: 1 }));
});

test("file root changes when one byte digest changes", () => {
  const first = [{ path: "a.txt", mode: "100644", type: "blob", objectId: "abc", byteLength: 1, sha256: sha256("a") }];
  const second = [{ ...first[0], sha256: sha256("b") }];
  assert.notEqual(computeFileRoot(first), computeFileRoot(second));
});

test("file-specific rules take precedence over generic path classes", () => {
  assert.equal(
    classifyLicense("reports/FREE_NEWS_005_HOW_TO_FISH_IDENTITY_AND_CREATION.md").licenseId,
    "LicenseRef-Juri-Public-Interest-1.0"
  );
  assert.equal(classifyLicense("reports/FREE_NEWS_004_CONSENT_COCKPIT_234_INACTIVE_VENDORS.md").licenseId, "CC-BY-4.0");
  assert.equal(classifyLicense("scripts/prepublish-check.mjs").licenseId, "MIT");
  assert.equal(classifyLicense("catalog/branches.json").licenseId, "CC0-1.0");
});
