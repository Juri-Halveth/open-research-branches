# Local agent candidate gate

An agent may suggest a change by writing a **data-only** JSON proposal. A
separately supplied policy names one source directory, exact permitted relative
paths, file extensions, a byte limit, and the four fixed checks. The proposal
names one target, the current source SHA-256 (or `NEW` for a permitted new
file), replacement text, and a reason. The tool treats that text as bytes; it
does not run instructions found in it.

The [PowerShell tool](agent-candidate.ps1) creates a new local Git directory
outside the source workspace, snapshots the one source file, and commits the
candidate on a `candidate/*` branch. It writes a diff and JSON receipt under
the selected run root. A passing receipt says
`ELIGIBLE_FOR_HUMAN_REVIEW`: it does not merge, push, install, build, execute
candidate code, or prove that the candidate is useful. Rejected proposals also
receive a receipt once the run folder has been created.

The checks are exact UTF-8 byte readback, `git diff --check`, syntax parsing
for JSON or PowerShell (a Markdown text check for `.md`), and exactly one
staged path. Git system/global configuration and init templates are replaced
for the run to keep inherited hooks and filters out of the local candidate
repository. The tool requires PowerShell 7 and Git.

The JSON shapes are documented in the [policy schema](agent-candidate.policy.schema.json)
and [proposal schema](agent-candidate.proposal.schema.json). The script also
enforces path containment, reparse-point checks, source-hash matching,
file-size limits, extension restrictions and a no-op rejection. Schemas help
authors prepare data; the script is the runtime gate.

From the repository root:

```powershell
pwsh -NoProfile -File ./scripts/agent-candidate.test.ps1
pwsh -NoProfile -File ./scripts/agent-candidate.ps1 `
  -Policy ./sample-config/policy.json `
  -Proposal ./sample-config/proposal.json `
  -RunRoot ./sample-runs
```

For the second command, the selected policy must point to a real source
workspace that does not overlap `sample-runs`. The example paths are
placeholders; no sample workspace is bundled. A higher-level agent can produce
the proposal JSON, but it receives no automatic write, merge, publication or
game authority from this tool.

Keep run receipts and proposal data local unless their contents have been
reviewed for publication. Paths, reasons, diffs and candidate text can reveal
private information. The receipt records local checks only, and the local
candidate Git repository is an organizational separation rather than an
operating-system security sandbox.

**Claim ceiling:** one allowlisted text candidate was staged and checked in a
separate local Git directory. No autonomous improvement or production effect
is established.

Code and test: [MIT](../LICENSE). This documentation:
[CC BY 4.0](../LICENSE-CONTENT.md). Schemas: [CC0 1.0](../LICENSE-DATA.md).
The exact file-level license map is [LICENSES.md](../LICENSES.md).
