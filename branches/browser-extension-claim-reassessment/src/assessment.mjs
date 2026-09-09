export function validateAssessments(rows) {
  const errors = [];
  if (!Array.isArray(rows) || rows.length !== 19) {
    errors.push("exactly_19_rows_required");
    return errors;
  }

  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    const prefix = `row_${index + 1}`;
    for (const field of [
      "name",
      "extensionId",
      "store",
      "originClass",
      "advertisedUtility",
      "legitimatePotential",
      "reportedFindingState",
      "individualPayloadState",
      "currentSafeArtifactState",
      "cleanRoomRoute"
    ]) {
      if (typeof row[field] !== "string" || row[field].trim() === "") {
        errors.push(`${prefix}:missing_${field}`);
      }
    }
    if (!/^[a-p]{32}$/.test(row.extensionId ?? "")) {
      errors.push(`${prefix}:invalid_extension_id`);
    }
    if (ids.has(row.extensionId)) errors.push(`${prefix}:duplicate_extension_id`);
    ids.add(row.extensionId);
    if (![
      "PURCHASED_FROM_PRIOR_DEVELOPER",
      "REPORTED_THREAT_ACTOR_CREATED"
    ].includes(row.originClass)) {
      errors.push(`${prefix}:invalid_origin_class`);
    }
    if (row.reportedFindingState !== "REPORTED_BY_SOCKET_NOT_REPRODUCED_HERE") {
      errors.push(`${prefix}:finding_state_overclaim`);
    }
    if (row.individualPayloadState !== "NOT_PROVEN_FOR_EVERY_PAYLOAD_ON_THIS_ID") {
      errors.push(`${prefix}:payload_state_overclaim`);
    }
    if (row.currentSafeArtifactState !== "NOT_PROVEN") {
      errors.push(`${prefix}:unsafe_current_version_claim`);
    }
  }

  const purchased = rows.filter((row) => row.originClass === "PURCHASED_FROM_PRIOR_DEVELOPER").length;
  const actorCreated = rows.filter((row) => row.originClass === "REPORTED_THREAT_ACTOR_CREATED").length;
  if (purchased !== 5) errors.push("purchased_count_must_be_5");
  if (actorCreated !== 14) errors.push("actor_created_count_must_be_14");
  return errors;
}

