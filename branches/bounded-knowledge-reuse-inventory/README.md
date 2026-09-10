# Bounded Knowledge Reuse Inventory

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

This branch provides a small, deterministic metadata gate for deciding whether
a knowledge item may proceed to a separate public-release review. It does not
read source documents, inspect repositories, copy files, publish anything, or
grant release authority.

The implementation is intentionally offline and dependency-free. The CLI reads
one JSON value from standard input and writes one JSON assessment to standard
output.

## What the method evaluates

Each input record contains classification metadata only:

- a synthetic or already-public identifier and short title;
- source, evidence, data, licence, disclosure, and linkability states;
- booleans for active-main-project status, secrets, and operational exploit
  detail;
- the requested output form.

The schema deliberately has no fields for raw content, local paths, account
identifiers, wallet addresses, conversations, screenshots, or evidence files.
Unknown fields fail closed.

Decisions are evaluated in this order:

1. `REJECT_RAW` for declared secrets or `RESTRICTED_RAW` data;
2. `HOLD` for active projects, unresolved rights, unknown source status, or
   non-public disclosure states;
3. `DERIVATIVE_ONLY` for material that remains linkable, pseudonymized, or
   operationally sensitive;
4. `LINK_ONLY` for an already-public, clearly licensed source requested as a
   link;
5. `ELIGIBLE_CANDIDATE` for metadata that passes the declared gate.

`ELIGIBLE_CANDIDATE` means only that no blocking condition was declared in the
provided metadata. It is not publication approval and does not prove that the
metadata is true or complete.

## Run

Requires Node.js 20 or newer.

```sh
node src/cli.js < fixtures/synthetic-inventory.json
npm test
```

The fixture is synthetic. It contains no local path, identity, live case,
credential, private report, or source-document excerpt.

## Claim boundaries

**Observed by this code:** schema validity, deterministic gate ordering,
duplicate IDs, and the classification outcome for the supplied metadata.

**Not established:** ownership, authorship, licence validity, absence of
secrets in an uninspected source, privacy safety of an actual document,
completion of coordinated disclosure, or authorization to publish.

**Claim ceiling:** `DECLARED_METADATA_GATE_RESULT_ONLY`.

An empty blocker list does not establish that no blocker exists outside the
declared fields. A caller must keep `publicationAuthorized: false` until an
independent human release decision is recorded elsewhere.

## Public-safety properties

- No network access or subprocess execution.
- No filesystem traversal or source-file input.
- Closed input objects; extra fields are rejected.
- Bounded record count and bounded text length.
- Obvious local-path and credential-shaped text is rejected, while explicitly
  acknowledging that this is not a complete secret scanner.
- Stable reason codes suitable for a later review manifest.

## Continuation tasks

- Publish a versioned JSON Schema matching the runtime validator.
- Add a separately versioned policy profile with a digest and migration rules.
- Add licence/source receipts without adding raw source material.
- Test policy changes against adversarial metadata and Unicode edge cases.
- Design a clean-export manifest only after explicit export authorization.
- Add an independent privacy and rights review receipt before any public use.

## Licence

MIT. See `LICENSE`.
