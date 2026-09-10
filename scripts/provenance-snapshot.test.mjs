import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalize,
  classifyLicense,
  computeFileRoot,
  parseSnapshotBytes,
  parseSnapshotText,
  serializeSnapshot,
  sha256
} from "./create-provenance-snapshot.mjs";

test("canonicalize is independent of object key insertion order", () => {
  assert.equal(canonicalize({ z: 1, a: { y: 2, b: 3 } }), canonicalize({ a: { b: 3, y: 2 }, z: 1 }));
});

test("snapshot parsing binds the exact PRETTY_JSON_V1 input and rejects duplicate keys", () => {
  const snapshot = { schemaVersion: "1.0.0", subject: { commitId: "real-commit" } };
  const serialized = serializeSnapshot(snapshot);
  assert.deepEqual(parseSnapshotText(serialized), snapshot);

  const conflicting = serialized.replace(
    '    "commitId": "real-commit"',
    '    "commitId": "masked-commit",\n    "commitId": "real-commit"'
  );
  assert.throws(
    () => parseSnapshotText(conflicting),
    /does not match PRETTY_JSON_V1 serialization/
  );
});

test("snapshot parsing rejects malformed UTF-8 bytes without replacement decoding", () => {
  const serialized = serializeSnapshot({ marker: "\uFFFD" });
  const bytes = Buffer.from(serialized, "utf8");
  const replacement = Buffer.from([0xef, 0xbf, 0xbd]);
  const offset = bytes.indexOf(replacement);
  assert.notEqual(offset, -1);
  const malformed = Buffer.concat([
    bytes.subarray(0, offset),
    Buffer.from([0xff]),
    bytes.subarray(offset + replacement.length)
  ]);

  assert.deepEqual(parseSnapshotBytes(bytes), { marker: "\uFFFD" });
  assert.throws(() => parseSnapshotBytes(malformed), /not valid UTF-8/);
});

test("file root changes when one byte digest changes", () => {
  const first = [{ path: "a.txt", mode: "100644", type: "blob", objectId: "abc", byteLength: 1, sha256: sha256("a") }];
  const second = [{ ...first[0], sha256: sha256("b") }];
  assert.notEqual(computeFileRoot(first), computeFileRoot(second));
});

test("every file-specific public-interest path takes precedence over generic classes", () => {
  const customPaths = [
    "reports/FREE_NEWS_020_STEAM_COINS_WALLET_AND_LEAK_AUDIT.md",
    "branches/steam-coins-wallet-and-leak-audit/README.md",
    "branches/steam-coins-wallet-and-leak-audit/sources.json",
    "branches/steam-coins-wallet-and-leak-audit/claims.json",
    "branches/steam-coins-wallet-and-leak-audit/comparison.json",
    "branches/steam-coins-wallet-and-leak-audit/public-observation.json",
    "branches/steam-coins-wallet-and-leak-audit/reconstruction-cycle.json",
    "PROVENANCE.md",
    "provenance-policy.json",
    "reports/FREE_NEWS_005_HOW_TO_FISH_IDENTITY_AND_CREATION.md",
    "reports/FREE_NEWS_005_RIGHTS_AND_SEMANTICS_PATCH.json",
    "reports/FREE_NEWS_006_JURI_ENERGY_MODEL_PROVENANCE_AUDIT.md",
    "reports/FREE_NEWS_007_RAVE_GROUP_RULE_AND_CANNABIS_SCOPE.md",
    "reports/FREE_NEWS_008_WAX_CRAYON_PEACE_HELMET_AND_IOS_MARKER.md",
    "reports/FREE_NEWS_009_GITHUB_CONTRIBUTION_GRAPH_AND_PRIORITY.md",
    "reports/FREE_NEWS_010_MADE_IN_GERMANY_QUANTUM_INTERNET_ASTER_ASTAR_ASTRA.md",
    "reports/FREE_NEWS_011_HISTORICAL_CIPHER_111_DECODING_CHALLENGE.md",
    "reports/FREE_NEWS_012_ALICE_MEDIA_REFERENT_AND_AGENCY_AUDIT.md",
    "reports/FREE_NEWS_013_RECIPROCAL_EVIDENCE_AND_INFORMATION_ASYMMETRY.md",
    "reports/FREE_NEWS_014_FINGERTIP_SPARK_ESD_AND_SPACECRAFT_BRIDGE.md",
    "reports/FREE_NEWS_015_PRIORITY_EVIDENCE_AND_REGRESS_ROUTES.md",
    "reports/FREE_NEWS_016_PUBLIC_GITHUB_PROJECT_CONSTELLATION.md",
    "reports/FREE_NEWS_017_CE_BARCODES_HTTPS_500_AND_SNAPSHOT_MARKERS.md",
    "reports/FREE_NEWS_017_MARKER_MATRIX.json",
    "reports/FREE_NEWS_018_PUBLIC_AUTHORITY_ENTRY_LISTENING_ROOM.md",
    "reports/FREE_NEWS_019_XXXLUTZ_PORTA_TAKEOVER_AND_EMPLOYEE_PARTICIPATION.md",
    "catalog/public-project-snapshot.json",
    "catalog/AUDIT_STAR.md",
    "catalog/audit-star.json",
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
    "branches/quantum-internet-aster-mirror-audit/README.md",
    "branches/quantum-internet-aster-mirror-audit/TECHNICAL_AUDIT.md",
    "branches/quantum-internet-aster-mirror-audit/PROVENANCE_AUDIT.md",
    "branches/quantum-internet-aster-mirror-audit/sources.json",
    "branches/quantum-internet-aster-mirror-audit/model-matrix.json",
    "branches/quantum-internet-aster-mirror-audit/international-aperture.json",
    "branches/quantum-internet-aster-mirror-audit/origin-hypotheses.json",
    "branches/quantum-internet-aster-mirror-audit/reconstruction-cycle.json",
    "branches/historical-cipher-decoding-challenge/README.md",
    "branches/historical-cipher-decoding-challenge/sources.json",
    "branches/historical-cipher-decoding-challenge/challenge.json",
    "branches/historical-cipher-decoding-challenge/reconstruction-cycle.json",
    "branches/alice-media-referent-and-agency-audit/README.md",
    "branches/alice-media-referent-and-agency-audit/sources.json",
    "branches/alice-media-referent-and-agency-audit/candidate-works.json",
    "branches/alice-media-referent-and-agency-audit/local-anchors.json",
    "branches/alice-media-referent-and-agency-audit/reconstruction-cycle.json",
    "branches/alice-media-referent-and-agency-audit/reciprocal-evidence-contract.json",
    "branches/alice-media-referent-and-agency-audit/reciprocal-navigation-frame.json",
    "branches/alice-media-referent-and-agency-audit/reciprocal-navigation-receipt.json",
    "branches/fingertip-spark-esd-spacecraft-audit/README.md",
    "branches/fingertip-spark-esd-spacecraft-audit/sources.json",
    "branches/fingertip-spark-esd-spacecraft-audit/model-matrix.json",
    "branches/fingertip-spark-esd-spacecraft-audit/observation-protocol.json",
    "branches/fingertip-spark-esd-spacecraft-audit/reconstruction-cycle.json",
    "branches/priority-evidence-and-regress-audit/README.md",
    "branches/priority-evidence-and-regress-audit/sources.json",
    "branches/priority-evidence-and-regress-audit/route-contract.json",
    "branches/priority-evidence-and-regress-audit/navigation-frame.json",
    "branches/priority-evidence-and-regress-audit/navigation-receipt.json",
    "branches/priority-evidence-and-regress-audit/reconstruction-cycle.json",
    "branches/public-authority-entry-listening-room/README.md",
    "branches/public-authority-entry-listening-room/room-contract.json",
    "branches/public-authority-entry-listening-room/budget-policy.example.json",
    "branches/public-authority-entry-listening-room/sources.json",
    "branches/public-authority-entry-listening-room/reconstruction-cycle.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/README.md",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/ARTIFACTS.md",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/sources.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/timeline.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/claims.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/participation-contract.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/public-reference-roles.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/current-audit-input.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/navigation-frame.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/navigation-receipt.json",
    "branches/xxxlutz-porta-takeover-and-employee-participation-audit/reconstruction-cycle.json",
    "scripts/build-audit-star.mjs",
    "scripts/audit-star.test.mjs",
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
    ["assets/research-room.png", "CC-BY-4.0"],
    ["assets/unclassified-image.png", "UNKNOWN"],
    ["reports/FREE_NEWS_004_CONSENT_COCKPIT_234_INACTIVE_VENDORS.md", "CC-BY-4.0"],
    ["branches/solar-and-thermal-provenance-audit/audit-lens.mjs", "MIT"],
    ["branches/quantum-internet-aster-mirror-audit/src/mirror-audit.mjs", "MIT"],
    ["branches/quantum-internet-aster-mirror-audit/test/mirror-audit.test.mjs", "MIT"],
    ["branches/alice-media-referent-and-agency-audit/src/media-audit.mjs", "MIT"],
    ["branches/alice-media-referent-and-agency-audit/test/media-audit.test.mjs", "MIT"],
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
