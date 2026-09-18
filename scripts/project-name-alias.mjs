// SPDX-License-Identifier: LicenseRef-HALVETH-PIRL-2.0
// In-memory concept naming example. No chain, wallet, balance or signing API.

function checkedText(value, field, limit) {
  if (typeof value !== "string" || !value.length || value.length > limit ||
      value !== value.trim() || /[\u0000-\u001f\u007f]/u.test(value) || !value.isWellFormed()) {
    throw new TypeError(`Invalid ${field}`);
  }
  return value;
}

function checkedId(value, field) {
  checkedText(value, field, 96);
  if (!/^[a-z][a-z0-9._-]*$/u.test(value)) throw new TypeError(`Invalid ${field}`);
  return value;
}

export function createProjectNameRegistry(namespace) {
  checkedId(namespace, "namespace");
  const entries = new Map();
  return Object.freeze({
    define(input) {
      if (!input || Object.getPrototypeOf(input) !== Object.prototype ||
          Reflect.ownKeys(input).length !== 3 ||
          !["name", "symbol", "conceptId"].every(key =>
            Object.hasOwn(input, key) && Object.hasOwn(Object.getOwnPropertyDescriptor(input, key), "value"))) {
        throw new TypeError("Expected exactly name, symbol and conceptId data fields");
      }
      const name = checkedText(input.name, "name", 128);
      const symbol = checkedText(input.symbol, "symbol", 16);
      const conceptId = checkedId(input.conceptId, "conceptId");
      if (entries.has(name)) throw new Error("NAME_ALREADY_DEFINED_IN_THIS_REGISTRY");
      const record = Object.freeze({
        schemaVersion: "1.0.0",
        kind: "USER_DEFINED_CONCEPT_ALIAS",
        namespace,
        name,
        symbol,
        conceptId,
        scope: "THIS_REGISTRY_INSTANCE",
        effect: "PROJECT_NAME_RESOLUTION"
      });
      entries.set(name, record);
      return record;
    },
    resolve(name) {
      checkedText(name, "name", 128);
      return entries.get(name) ?? null;
    }
  });
}

export function buildSolstheimExample() {
  const registry = createProjectNameRegistry("halveth.research.example");
  return registry.define({
    name: "Solstheim",
    symbol: "SOL",
    conceptId: "solstheim-reference"
  });
}
