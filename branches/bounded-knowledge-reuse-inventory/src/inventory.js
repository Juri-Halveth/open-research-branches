'use strict';

const SCHEMA_VERSION = '1.0.0';
const CLAIM_CEILING = 'DECLARED_METADATA_GATE_RESULT_ONLY';
const MAX_RECORDS = 1000;
const MAX_TITLE_LENGTH = 120;

const RECORD_KEYS = new Set([
  'id',
  'title',
  'sourceStatus',
  'evidenceState',
  'dataClass',
  'licenseStatus',
  'activeMainProject',
  'disclosureStatus',
  'personalLinkability',
  'containsSecrets',
  'containsOperationalExploitDetail',
  'requestedOutput'
]);

const ENUMS = Object.freeze({
  sourceStatus: new Set([
    'PUBLIC_PRIMARY',
    'PUBLIC_OPEN_LICENSE',
    'OWNER_AUTHORED',
    'UNKNOWN'
  ]),
  evidenceState: new Set([
    'OBSERVED',
    'STRONGLY_SUPPORTED',
    'INFERRED',
    'UNKNOWN',
    'NOT_PROVEN',
    'FALSIFIED'
  ]),
  dataClass: new Set([
    'PUBLIC',
    'EXTERNAL_MINIMIZED',
    'INTERNAL_PSEUDONYMIZED',
    'RESTRICTED_RAW'
  ]),
  licenseStatus: new Set(['CLEAR', 'UNKNOWN', 'RESTRICTED']),
  disclosureStatus: new Set([
    'NONE',
    'ACTIVE_COORDINATION',
    'SUBMITTED_PRIVATE',
    'PUBLICLY_DISCLOSED'
  ]),
  personalLinkability: new Set(['NONE', 'LOW', 'HIGH']),
  requestedOutput: new Set([
    'LINK_ONLY',
    'SANITIZED_DERIVATIVE',
    'SYNTHETIC_FIXTURE'
  ])
});

const UNSAFE_TEXT = /(?:[A-Za-z]:[\\/]|\\\\|\/(?:Users|home)\/|(?:^|[?&])(token|key|secret|session|cookie)=)/i;

function fail(message) {
  throw new TypeError(message);
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be a plain object`);
  }
}

function assertClosedObject(value, allowedKeys, label) {
  assertPlainObject(value, label);
  const extras = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (extras.length > 0) {
    fail(`${label} contains unsupported field(s): ${extras.join(', ')}`);
  }
}

function assertEnum(value, field) {
  if (!ENUMS[field].has(value)) {
    fail(`${field} has an unsupported value`);
  }
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    fail(`${field} must be boolean`);
  }
}

function assertSafeText(value, field) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_TITLE_LENGTH) {
    fail(`${field} must be a non-empty string of at most ${MAX_TITLE_LENGTH} characters`);
  }
  if (/\p{C}/u.test(value) || UNSAFE_TEXT.test(value)) {
    fail(`${field} contains control, path, or credential-shaped text`);
  }
}

function validateRecord(record, index) {
  const label = `records[${index}]`;
  assertClosedObject(record, RECORD_KEYS, label);

  if (typeof record.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(record.id)) {
    fail(`${label}.id must be a stable lowercase ASCII identifier`);
  }
  assertSafeText(record.title, `${label}.title`);

  for (const field of Object.keys(ENUMS)) {
    assertEnum(record[field], field);
  }

  assertBoolean(record.activeMainProject, `${label}.activeMainProject`);
  assertBoolean(record.containsSecrets, `${label}.containsSecrets`);
  assertBoolean(
    record.containsOperationalExploitDetail,
    `${label}.containsOperationalExploitDetail`
  );

  return record;
}

function assessRecord(record, index = 0) {
  validateRecord(record, index);
  const reasons = [];

  if (record.containsSecrets) reasons.push('DECLARED_SECRETS');
  if (record.dataClass === 'RESTRICTED_RAW') reasons.push('RESTRICTED_RAW_DATA');

  if (reasons.length > 0) {
    return decision(record, 'REJECT_RAW', reasons);
  }

  if (record.activeMainProject) reasons.push('ACTIVE_MAIN_PROJECT');
  if (record.sourceStatus === 'UNKNOWN') reasons.push('SOURCE_STATUS_UNKNOWN');
  if (record.licenseStatus === 'UNKNOWN') reasons.push('LICENSE_STATUS_UNKNOWN');
  if (record.licenseStatus === 'RESTRICTED') reasons.push('LICENSE_RESTRICTED');
  if (record.disclosureStatus === 'ACTIVE_COORDINATION') {
    reasons.push('DISCLOSURE_COORDINATION_ACTIVE');
  }
  if (record.disclosureStatus === 'SUBMITTED_PRIVATE') {
    reasons.push('SUBMITTED_NOT_PUBLIC');
  }
  if (
    record.requestedOutput === 'LINK_ONLY' &&
    !['PUBLIC_PRIMARY', 'PUBLIC_OPEN_LICENSE'].includes(record.sourceStatus)
  ) {
    reasons.push('LINK_TARGET_NOT_PUBLIC');
  }

  if (reasons.length > 0) {
    return decision(record, 'HOLD', reasons);
  }

  if (record.dataClass === 'INTERNAL_PSEUDONYMIZED') {
    reasons.push('PSEUDONYMIZED_SOURCE_REQUIRES_NEW_DERIVATIVE');
  }
  if (record.dataClass === 'EXTERNAL_MINIMIZED') {
    reasons.push('RECIPIENT_MINIMIZED_SOURCE_REQUIRES_PUBLIC_DERIVATIVE');
  }
  if (record.personalLinkability === 'LOW') {
    reasons.push('LOW_PERSONAL_LINKABILITY_REQUIRES_NEW_DERIVATIVE');
  }
  if (record.personalLinkability === 'HIGH') reasons.push('HIGH_PERSONAL_LINKABILITY');
  if (record.containsOperationalExploitDetail) reasons.push('OPERATIONAL_DETAIL_PRESENT');

  if (reasons.length > 0) {
    return decision(record, 'DERIVATIVE_ONLY', reasons);
  }

  if (record.requestedOutput === 'LINK_ONLY') {
    return decision(record, 'LINK_ONLY', ['ALREADY_PUBLIC_LINK_TARGET']);
  }

  return decision(record, 'ELIGIBLE_CANDIDATE', ['DECLARED_METADATA_GATES_CLEAR']);
}

function decision(record, value, reasons) {
  return Object.freeze({
    id: record.id,
    decision: value,
    reasons: Object.freeze([...reasons]),
    evidenceState: record.evidenceState,
    claimCeiling: CLAIM_CEILING,
    publicationAuthorized: false
  });
}

function assessInventory(input) {
  assertClosedObject(input, new Set(['schemaVersion', 'records']), 'inventory');
  if (input.schemaVersion !== SCHEMA_VERSION) {
    fail(`schemaVersion must be ${SCHEMA_VERSION}`);
  }
  if (!Array.isArray(input.records) || input.records.length > MAX_RECORDS) {
    fail(`records must be an array with at most ${MAX_RECORDS} entries`);
  }

  const seen = new Set();
  const records = input.records.map((record, index) => {
    const result = assessRecord(record, index);
    if (seen.has(result.id)) fail(`duplicate record id: ${result.id}`);
    seen.add(result.id);
    return result;
  });

  const decisionCounts = {};
  for (const record of records) {
    decisionCounts[record.decision] = (decisionCounts[record.decision] || 0) + 1;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    assessedCount: records.length,
    decisionCounts,
    records,
    claimCeiling: CLAIM_CEILING,
    sourceContentReviewed: false,
    publicationAuthorized: false
  };
}

module.exports = {
  CLAIM_CEILING,
  SCHEMA_VERSION,
  assessInventory,
  assessRecord
};
