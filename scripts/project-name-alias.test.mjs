// SPDX-License-Identifier: LicenseRef-HALVETH-PIRL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { createProjectNameRegistry, buildSolstheimExample } from "./project-name-alias.mjs";

test("definition creates a resolvable concept alias with an explicit local scope", () => {
  const registry = createProjectNameRegistry("halveth.research.example");
  assert.equal(registry.resolve("Solstheim"), null);
  const defined = registry.define({ name: "Solstheim", symbol: "SOL", conceptId: "solstheim-reference" });
  assert.deepEqual(defined, buildSolstheimExample());
  assert.equal(registry.resolve("Solstheim"), defined);
  assert.throws(() => { defined.symbol = "CHANGED"; }, TypeError);
  assert.equal(registry.resolve("solstheim"), null, "matching is exact, without silent case conversion");
});

test("absence in one registry does not prove absence or availability in another", () => {
  const first = createProjectNameRegistry("example.first");
  const second = createProjectNameRegistry("example.second");
  second.define({ name: "Solstheim", symbol: "OTHER", conceptId: "separate-concept" });
  assert.equal(first.resolve("Solstheim"), null);
  assert.equal(second.resolve("Solstheim").symbol, "OTHER");
  assert.throws(() => second.define({ name: "Solstheim", symbol: "SOL", conceptId: "replacement" }), /NAME_ALREADY_DEFINED/);
});

test("definitions cannot import balance, authority or entitlement fields", () => {
  for (const field of ["balance", "mintAuthority", "legalEntitlement"]) {
    const registry = createProjectNameRegistry("example.fields");
    assert.throws(() => registry.define({ name: "Solstheim", symbol: "SOL", conceptId: "local-concept", [field]: true }), TypeError);
    assert.equal(registry.resolve("Solstheim"), null);
  }
});

test("malformed and ambiguous definitions are rejected before registration", () => {
  const registry = createProjectNameRegistry("example.input");
  for (const name of ["", " Solstheim", "Solstheim\u0000", "\ud800"]) {
    assert.throws(() => registry.define({ name, symbol: "SOL", conceptId: "local-concept" }), TypeError);
  }
  assert.throws(() => registry.define({ get name() { throw new Error("must not run"); }, symbol: "SOL", conceptId: "local-concept" }), TypeError);
  assert.throws(() => createProjectNameRegistry("arbitrary namespace"), TypeError);
});
