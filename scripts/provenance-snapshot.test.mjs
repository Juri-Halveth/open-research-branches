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

test("every file-specific public-interest path takes precedence over generic classes", () => {
  const customPaths = [
    "PROVENANCE.md",
    "provenance-policy.json",
    "reports/FREE_NEWS_005_HOW_TO_FISH_IDENTITY_AND_CREATION.md",
    "reports/FREE_NEWS_005_RIGHTS_AND_SEMANTICS_PATCH.json",
    "reports/FREE_NEWS_006_JURI_ENERGY_MODEL_PROVENANCE_AUDIT.md",
    "reports/FREE_NEWS_007_RAVE_GROUP_RULE_AND_CANNABIS_SCOPE.md",
    "reports/FREE_NEWS_008_WAX_CRAYON_PEACE_HELMET_AND_IOS_MARKER.md",
    "reports/FREE_NEWS_009_GITHUB_CONTRIBUTION_GRAPH_AND_PRIORITY.md",
    "branches/solar-and-thermal-provenance-audit/README.md",
    "branches/solar-and-thermal-provenance-audit/sources.json",
    "branches/solar-and-thermal-provenance-audit/claims.json",
    "branches/solar-and-thermal-provenance-audit/component-matrix.json",
    "branches/solar-and-thermal-provenance-audit/local-source-receipt.json",
    "branches/wax-crayon-peace-helmet-audit/README.md",
    "branches/wax-crayon-peace-helmet-audit/ARTIFACTS.md",
    "branches/wax-crayon-peace-helmet-audit/claims.json",
    "branches/wax-crayon-peace-helmet-audit/evidence-receipts.json",
    "branches/wax-crayon-peace-helmet-audit/marker-receipts.public.json",
    "branches/wax-crayon-peace-helmet-audit/sources.json",
    "branches/wax-crayon-peace-helmet-audit/assets/wax-crayon-peace-helmet-concept.png",
    "scripts/create-provenance-snapshot.mjs",
    "scripts/provenance-snapshot.test.mjs"
  ];

  for (const relativePath of customPaths) {
    const result = classifyLicense(relativePath);
    assert.equal(result.licenseId, "LicenseRef-Juri-Public-Interest-1.0", relativePath);
    assert.equal(result.ruleId, "FILE_SPECIFIC_PUBLIC_INTEREST", relativePath);
    assert.equal(result.basisPath, "LICENSE-JURI-PUBLIC-INTEREST.md", relativePath);
  }
});

test("representative generic paths retain their repository license classes", () => {
  const expectations = new Map([
    ["reports/FREE_NEWS_004_CONSENT_COCKPIT_234_INACTIVE_VENDORS.md", "CC-BY-4.0"],
    ["branches/solar-and-thermal-provenance-audit/audit-lens.mjs", "MIT"],
    ["scripts/prepublish-check.mjs", "MIT"],
    ["catalog/branches.json", "CC0-1.0"],
    ["LICENSE", "MIT"],
    ["LICENSE-CONTENT.md", "CC-BY-4.0"],
    ["LICENSE-DATA.md", "CC0-1.0"]
  ]);

  for (const [relativePath, expectedLicense] of expectations) {
    assert.equal(classifyLicense(relativePath).licenseId, expectedLicense, relativePath);
  }
});
