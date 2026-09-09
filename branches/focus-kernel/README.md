# Focus Kernel Research

Focus Kernel Research is a small, local-first reference implementation for one
question: how can software keep a user-confirmed goal visible while still
showing missing context, disagreement and uncertainty?

The project is deliberately narrow. It demonstrates a focus record, nine
analysis layers, three bounded reviewer roles and a transparent arbitration
result. Reviewers return data; they cannot silently change the confirmed goal.

## Current status

`M1_FINITE_SNAPSHOT`

Implemented and tested:

- create and explicitly confirm a focus record;
- propose a focus change without applying it;
- apply a change only through a separate confirmation function;
- keep literal input, confirmed context and heuristic interpretation separate;
- mark reviewer output as untrusted data;
- report missing context, possible conflict and control-like text;
- retain only short decision summaries in the in-memory log.

Not implemented:

- persistence across reloads;
- import or export;
- external model or provider adapters;
- background execution, shell access, network access or autonomous actions;
- a complete prompt-injection, safety or truth-detection system.

The heuristics are examples, not factual or psychological assessments.

## Run locally

The application has no runtime dependencies and no build step. Because browsers
normally restrict JavaScript module imports from `file://`, serve the directory
locally:

```powershell
py -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

Run the logic tests with Node.js 20 or newer:

```powershell
npm test
```

## Privacy and effects

- All state lives only in the current page session.
- The application performs no network request.
- It writes no cookie, `localStorage`, `sessionStorage` or IndexedDB record.
- It has no file, clipboard, shell or process capability.
- Inputs are rendered with DOM `textContent`, not interpreted as HTML.

Closing or reloading the page discards the current focus and decision log.

## Files

- `core.js` — pure focus, analysis, reviewer and arbitration logic.
- `app.js` — DOM adapter with session-only state.
- `index.html` and `styles.css` — accessible local interface.
- `tests/core.test.mjs` — deterministic behavioral checks.
- `OPEN_M2_TASKS.md` — independent continuation tasks and acceptance criteria.
- `CONTRIBUTING.md` — bounded contribution workflow.
- `SECURITY.md` — security model and reporting boundary.

## Continuation

M2 is intentionally open. Contributors can take one bounded task from
`OPEN_M2_TASKS.md`; no task grants permission to add cloud sync, telemetry or an
automatic focus change.

## Publication and license state

This directory is a sanitized public derivative. It contains no third-party
assets, local machine paths, account identifiers or source evidence. Its code
uses the repository's MIT license; its newly written prose uses CC BY 4.0.
