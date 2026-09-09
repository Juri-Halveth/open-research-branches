'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { assessInventory, assessRecord } = require('../src/inventory');

function baseRecord(overrides = {}) {
  return {
    id: 'safe-item',
    title: 'Synthetic public method',
    sourceStatus: 'OWNER_AUTHORED',
    evidenceState: 'OBSERVED',
    dataClass: 'PUBLIC',
    licenseStatus: 'CLEAR',
    activeMainProject: false,
    disclosureStatus: 'NONE',
    personalLinkability: 'NONE',
    containsSecrets: false,
    containsOperationalExploitDetail: false,
    requestedOutput: 'SYNTHETIC_FIXTURE',
    ...overrides
  };
}

test('marks a clear synthetic record as an eligible candidate without authorizing publication', () => {
  const result = assessRecord(baseRecord());
  assert.equal(result.decision, 'ELIGIBLE_CANDIDATE');
  assert.equal(result.publicationAuthorized, false);
  assert.equal(result.claimCeiling, 'DECLARED_METADATA_GATE_RESULT_ONLY');
});

test('rejects declared secrets before every lower-priority decision', () => {
  const result = assessRecord(baseRecord({
    containsSecrets: true,
    activeMainProject: true,
    licenseStatus: 'UNKNOWN'
  }));
  assert.equal(result.decision, 'REJECT_RAW');
  assert.deepEqual(result.reasons, ['DECLARED_SECRETS']);
});

test('holds active, privately submitted, or unresolved-rights records', () => {
  const result = assessRecord(baseRecord({
    activeMainProject: true,
    disclosureStatus: 'SUBMITTED_PRIVATE',
    licenseStatus: 'UNKNOWN'
  }));
  assert.equal(result.decision, 'HOLD');
  assert.deepEqual(result.reasons, [
    'ACTIVE_MAIN_PROJECT',
    'LICENSE_STATUS_UNKNOWN',
    'SUBMITTED_NOT_PUBLIC'
  ]);
});

test('requires a new derivative for operational or highly linkable material', () => {
  const result = assessRecord(baseRecord({
    personalLinkability: 'HIGH',
    containsOperationalExploitDetail: true
  }));
  assert.equal(result.decision, 'DERIVATIVE_ONLY');
  assert.deepEqual(result.reasons, [
    'HIGH_PERSONAL_LINKABILITY',
    'OPERATIONAL_DETAIL_PRESENT'
  ]);
});

test('requires a public derivative for recipient-minimized or weakly linkable material', () => {
  const result = assessRecord(baseRecord({
    dataClass: 'EXTERNAL_MINIMIZED',
    personalLinkability: 'LOW'
  }));
  assert.equal(result.decision, 'DERIVATIVE_ONLY');
  assert.deepEqual(result.reasons, [
    'RECIPIENT_MINIMIZED_SOURCE_REQUIRES_PUBLIC_DERIVATIVE',
    'LOW_PERSONAL_LINKABILITY_REQUIRES_NEW_DERIVATIVE'
  ]);
});

test('allows link-only only for an already-public source', () => {
  const publicResult = assessRecord(baseRecord({
    sourceStatus: 'PUBLIC_OPEN_LICENSE',
    disclosureStatus: 'PUBLICLY_DISCLOSED',
    requestedOutput: 'LINK_ONLY'
  }));
  assert.equal(publicResult.decision, 'LINK_ONLY');

  const privateResult = assessRecord(baseRecord({ requestedOutput: 'LINK_ONLY' }));
  assert.equal(privateResult.decision, 'HOLD');
  assert.deepEqual(privateResult.reasons, ['LINK_TARGET_NOT_PUBLIC']);
});

test('fails closed on raw-content fields and credential-shaped titles', () => {
  assert.throws(
    () => assessRecord({ ...baseRecord(), rawContent: 'not accepted' }),
    /unsupported field/
  );
  assert.throws(
    () => assessRecord(baseRecord({ title: 'token=synthetic-placeholder' })),
    /path, or credential-shaped text/
  );
});

test('assesses the synthetic fixture with stable decision counts', () => {
  const fixturePath = path.join(__dirname, '..', 'fixtures', 'synthetic-inventory.json');
  const input = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const result = assessInventory(input);
  assert.equal(result.assessedCount, 6);
  assert.deepEqual(result.decisionCounts, {
    LINK_ONLY: 1,
    HOLD: 2,
    REJECT_RAW: 1,
    DERIVATIVE_ONLY: 1,
    ELIGIBLE_CANDIDATE: 1
  });
  assert.equal(result.sourceContentReviewed, false);
  assert.equal(result.publicationAuthorized, false);
});

test('rejects duplicate IDs', () => {
  assert.throws(
    () => assessInventory({
      schemaVersion: '1.0.0',
      records: [baseRecord(), baseRecord()]
    }),
    /duplicate record id/
  );
});
