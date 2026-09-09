# Security model

## Current capability boundary

The M1 application is a static browser interface with pure local JavaScript.
It has no backend, network client, storage adapter, file access, clipboard
access, shell, process control, provider adapter or background worker.

User-controlled values are written to the interface through `textContent` and
text nodes. They are not parsed as HTML. Reviewers are local heuristics and
their records include `untrusted_output: true`.

## What is tested

- a focus requires a non-empty goal;
- a proposal cannot mutate a focus;
- stale or foreign proposals are rejected;
- control-like wording remains data and preserves the focus;
- missing context remains visible;
- possible direction changes require user confirmation;
- reviewer output is marked untrusted;
- the short decision log excludes raw input and reviewer output.

## What is not established

- complete prompt-injection resistance;
- correctness of inferred intent;
- psychological, medical or legal assessment;
- protection against a compromised browser or operating system;
- safety of future storage, provider or collaboration adapters;
- production readiness.

## Reporting

Before a public repository and contact channel exist, document a suspected issue
locally with synthetic input, affected version, expected result, observed result
and the smallest reproduction. Do not attach secrets or personal data.
