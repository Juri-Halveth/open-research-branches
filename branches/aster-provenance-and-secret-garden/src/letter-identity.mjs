const OPERATORS = Object.freeze({
  REPLACE_INITIAL_K_WITH_C(value) {
    return value.startsWith("K") ? `C${value.slice(1)}` : value;
  },
  REPLACE_V_WITH_W(value) {
    return value.replace("v", "w");
  },
  INSERT_L_AFTER_FIRST_VOWEL(value) {
    const index = value.search(/[aeiouäöü]/iu);
    return index === -1 ? value : `${value.slice(0, index + 1)}l${value.slice(index + 1)}`;
  }
});

function text(value, name) {
  if (typeof value !== "string" || value === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value;
}

export function transformLetters(source, operatorIds) {
  const original = text(source, "source");
  if (!Array.isArray(operatorIds) || operatorIds.length === 0) {
    throw new TypeError("operatorIds must be a non-empty array");
  }

  let output = original;
  const operations = [];
  for (const operatorId of operatorIds) {
    if (!Object.hasOwn(OPERATORS, operatorId)) {
      throw new TypeError(`unsupported operator: ${operatorId}`);
    }
    const input = output;
    output = OPERATORS[operatorId](input);
    operations.push(Object.freeze({ operatorId, input, output }));
  }

  return Object.freeze({
    schemaVersion: "aster-letter-receipt.v1",
    source: original,
    output,
    operations: Object.freeze(operations),
    stringEquality: original === output,
    referentEquality: "UNKNOWN",
    sourcePreserved: true,
    globalLetterIdentityChanged: false
  });
}

export function compareGraphemes(left, right) {
  const a = text(left, "left");
  const b = text(right, "right");
  return Object.freeze({
    left: a,
    right: b,
    codePointsEqual: a.codePointAt(0) === b.codePointAt(0),
    stringEqual: a === b,
    phoneticRelation: "UNBOUND",
    personIdentityRelation: "UNBOUND"
  });
}
