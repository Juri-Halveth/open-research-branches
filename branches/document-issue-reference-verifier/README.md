# Synthetic Document-Issue Reference Verifier

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

This small, dependency-free Node.js project demonstrates one narrow design rule:

> A reference that looks structurally related to another reference is not authentication, currentness, ownership, or authorization.

All identifiers in this repository are synthetic. `DOC-ALPHA|2`, `SET-ALPHA`, and
`PRINCIPAL-ALPHA` do not represent a person, authority, real document, account,
country, registry, or external system. Do not put real document numbers or personal
data into the example registry.

## What the model does

The verifier accepts two canonical JSON texts:

1. a bounded synthetic registry;
2. a request to check one reference.

The authenticated principal and the expected registry digest are supplied separately
from those untrusted texts. A successful result requires all of the following:

- the registry digest matches the separately supplied anchor;
- registry and request use exact, closed schemas;
- the request principal matches the external authentication context;
- the requested reference exists, is `CURRENT`, and belongs to that principal.

Every retired, unknown, mismatched, or forged case receives the same small public
failure object. No record, principal, record-set identifier, or lifecycle label is
returned.

## Evidence states

### OBSERVED

- The local implementation parses the synthetic `STEM|1..9` grammar.
- It rejects non-canonical JSON, unexpected fields, duplicate references, inconsistent
  issue coordinates, unsupported states, and multiple current references in one set.
- It binds acceptance to an authentication value supplied outside the request.
- It checks a separately supplied SHA-256 digest before interpreting the registry.
- The included local tests exercise success, retired/unknown/wrong-principal cases,
  bounded enumeration, altered registries, over-broad inputs, and output minimization.

These observations apply only to the included source, example data, and test cases.

### INFERRED

The model illustrates a reusable architecture pattern: keep reference parsing,
authentication, lifecycle state, and authorization as separate checks. That pattern
may help reviewers notice systems that accidentally treat a predictable identifier as
proof of access.

This is a design inference, not evidence about any external product.

### UNKNOWN

- How a real system authenticates a principal.
- What a real reference format means.
- Whether an external registry is complete, current, signed, or trustworthy.
- Whether an adapter preserves the same closed-schema and fail-closed behavior.
- Timing, availability, concurrency, storage, revocation, audit, and recovery behavior
  outside this in-memory model.

### NOT_PROVEN

- No real document, authority, account, registry, service, or vulnerability was tested.
- The code does not validate identity or legal entitlement.
- A passing test suite does not establish production security, standards compliance,
  privacy compliance, or suitability for a specific domain.
- SHA-256 here binds the exact registry text supplied by a caller; it does not prove who
  created that text or whether its contents are true.
- The synthetic `1..9` suffix has no asserted meaning outside this example.

## Run locally

Requires a recent Node.js version with the built-in test runner.

```text
npm test
npm run validate
```

There are no runtime dependencies and no network operations.

## Safe continuation tasks

Contributors can continue this branch without using real identifiers or live systems:

1. Add property-based tests that generate only synthetic references and malformed JSON.
2. Model concurrent registry snapshots and explicit revocation using deterministic local
   fixtures.
3. Add a separate adapter interface for authentication and prove that request fields can
   never supply or replace the authenticated principal.
4. Add a threat model covering enumeration, stale snapshots, duplicate current records,
   registry substitution, timing differences, and log leakage.
5. Compare two local parsers against the same canonical JSON fixtures and record any
   interpretation differences.
6. Add a redaction test that fails if examples contain email addresses, filesystem paths,
   long numeric identifiers, or non-synthetic namespaces.
7. Choose an explicit license only after confirming that every included line and example
   is eligible for that license.

Keep external testing, real personal data, real-world identifiers, and claims about real
systems out of this branch unless a separately documented authorization, privacy, source,
and evidence review exists.
