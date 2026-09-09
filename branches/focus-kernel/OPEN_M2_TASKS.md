# Open M2 continuation tasks

M2 is split into independent, bounded tasks. A contribution should implement
one task at a time and keep the M1 invariants intact.

## M2-A — opt-in local focus persistence

Add a versioned persistence adapter for the confirmed focus record.

Acceptance criteria:

- storage is opt-in and disabled by default;
- use one documented, namespaced browser-storage key;
- validate a closed schema before accepting stored data;
- reject unknown schema versions and invalid records without partial recovery;
- loading a record does not create a new confirmation or change its goal;
- clearing storage is visible and removes only the project-owned key;
- raw review inputs and reviewer outputs are never persisted;
- tests cover save, load, invalid JSON, wrong schema, stale version and clear.

## M2-B — explicit JSON export and import

Add user-triggered export and import for a focus record and its change history.

Acceptance criteria:

- export occurs only after a visible user action;
- the file contains a documented schema version and no hidden fields;
- import parses data as untrusted input and validates size, type and shape;
- import previews the candidate and requires a separate confirmation before it
  becomes the active focus;
- no field from imported JSON becomes HTML, code or an instruction;
- tests cover exact roundtrip and fail-closed rejection cases.

## M2-C — source and decision references

Add small typed references without copying source material into the focus.

Acceptance criteria:

- a reference contains type, label, optional URI, observation time and coverage;
- unknown time or coverage remains explicit;
- adding a reference cannot change the confirmed goal;
- decision summaries cite reference IDs rather than embedding raw source text;
- tests cover missing fields, duplicate IDs and dangling references.

## M2-D — improve conflict discrimination

Replace the simple word-overlap signal with a deterministic, documented local
rule or an optional provider-neutral adapter.

Acceptance criteria:

- the existing heuristic remains available as a baseline;
- every new result declares its producer, version and confidence semantics;
- a model result remains untrusted output;
- no low score changes the focus automatically;
- tests include aligned text, unrelated text, paraphrase, short input and empty
  input, with false-positive limitations documented.

## Invariants shared by every task

- explicit confirmation is the only focus-change operation;
- no network, telemetry, shell, process or background capability;
- no HTML interpretation of user-controlled values;
- no claim that a heuristic determines truth, intent or safety;
- tests and README must describe the same behavior.

Cloud sync, multi-user collaboration, autonomous agents and external execution
are outside M2.
