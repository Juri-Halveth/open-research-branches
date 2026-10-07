# HALVETH · Start here, then follow the sources

**One entry into the code universe, its learning history and its open edges.**

Start with [the universal source-data entry](UNIVERSAL_ENTRY.md):
`bash HALVETH.sh start --format text`, or `node scripts/halveth-entry.mjs start`.
The same versioned packet can be consumed from other shells and languages.
`indicate F02` binds a source annotation; it starts no target operation.

Read this file together with the current human request. A repository is a
knowledge source; visiting it is not permission to run its programs, test a
third-party asset or publish a private report.

## 1. Bind the universe you are actually reading

Record `git rev-parse HEAD`. Then run this local, read-only inventory:

```sh
node scripts/build-ai-bootstrap-index.mjs --ref HEAD
```

It reads every blob in the selected commit through Git, binds path, Git object,
byte length and SHA-256, and counts Unicode code points, defined word tokens
and lines for valid UTF-8 text. Binary blobs and submodules stay explicit.
Counting a text is not semantic understanding. Untracked files, unreachable
history, remote issues, discussions and other repository bodies are outside
this inventory. Nothing is fetched or executed by the indexer.

The output can be saved as `knowledge-index.local.json`. Do not commit a
private reading ledger. Refresh the inventory after changing the commit.

## 2. Choose an entry without losing the siblings

| Question | Source |
| --- | --- |
| Where is the actual function behind a portfolio reference? | [Code-DNA](CODE_DNA.md) and [exact public excerpts](catalog/competence-evidence.json) |
| Which environment assumptions caused unnecessary failures? | [Environment first](branches/security-impact-learning/ENVIRONMENT_FIRST.md) |
| What does an observed state mean? | [State observation contract](branches/security-impact-learning/STATE_OBSERVATION.md) |
| What exists in this hub? | [Current branch catalog](catalog/branches.json) |
| Where are the visible model rooms? | [HALVETH Codeuniversum](wiki/HALVETH-Codeuniversum.md) |
| What did we learn from an overclaimed security attempt? | [Learning branch](branches/security-impact-learning/README.md) |
| Where can I see the error and its repair? | [Interactive learning map](branches/security-impact-learning/index.html) |
| Which other public repositories belong to this snapshot? | [Public universe roots](catalog/public-universe-roots.json) |
| How do current and historical path references connect? | [Audit Star](catalog/AUDIT_STAR.md) |
| What may enter the public archive? | [Publication policy](PUBLICATION_POLICY.md) and [licenses](LICENSES.md) |

The public-root snapshot currently names 15 public repositories and their
default-branch commits. Their content has not been reviewed merely because
their metadata was listed. Private repositories are excluded. When traversing
a sibling, bind its commit, honor its license and repeat the read-coverage step.

For history, inspect named commits with `git show` and declared ancestry with
`git log`. The existing Audit Star has its own narrower coverage. Do not call
either index an inventory of every historical word across all of GitHub.

## 3. Learn the failed inference before continuing it

The retained mistake was: readable metadata, stable hashes and denied control
routes were inflated into a stronger impact claim. The correction binds the
expected access policy and the effect first. Repeat measurements remain
valuable; they establish reproducibility within their context.

The learning package also corrects its own overcorrection: no invented 0–100
truth score, no universal persistence requirement, no automatic closure of an
unknown branch, and no conversion of a report status into technical truth.
The [full retrospective](branches/security-impact-learning/RETROSPECTIVE.md)
states the mistakes, missing evidence and safe continuation points.

## 4. Record what you read, and what you did not

Use this small handoff for every continuation:

```text
TASK: exact current human request
COMMIT: bound source commit
FILES_READ: path, SHA-256, full text or exact spans, purpose
FILES_UNREAD: remaining paths or explicit categories
OBSERVATIONS: source-bound results within declared scope
INTERPRETATIONS: hypotheses and countermodels
OPEN_EDGES: missing discriminator, source or authority
PROPOSED_ACTION: concrete effect and required authority
CHANGES: files and dependency closure
VALIDATION: checks actually executed and their limits
PUBLICATION: local / committed / pushed / PR / merged / observed URL
REENTRY: exact condition that would change the next decision
```

`validateReadLedger` in the indexer checks declared paths, hashes and byte spans
against the inventory. A valid ledger is still a declaration, not evidence
that an AI understood its contents. UTF-16 analysis spans need their own exact
text binding; a byte span is not silently converted to one.

## 5. Reuse the knowledge without importing authority

Connect NORMENWERK, FEGEFEUER, AUGE, BANANE and the other branches through
their named types, sources and model contracts. Preserve original definitions,
unknowns and alternative readings. A finding in one model is not silently a
claim about law, biology, physics or a deployed product.

The public root [AGENTS.md](AGENTS.md) carries the compact working rules. It is
the repository's manual entry contract, not an autostart mechanism or a model
training claim.

## GitHub-native read and write

An agent with the GitHub CLI already authenticated can use the same source
entry through the official API, including the selected private core when that
login has access. No new credential, account or visibility change is created.

```sh
node scripts/github-knowledge-gateway.mjs inventory Juri-Halveth/open-research-branches
node scripts/github-knowledge-gateway.mjs read Juri-Halveth/open-research-branches START_HERE_AI.md
node scripts/github-knowledge-gateway.mjs read Juri-Halveth/halveth-private-core docs/impact-learning-20261007/START_HERE.md
```

The reader binds the server-provided identity, repository rights, commit, tree
and blob. File content is returned as text/data and never executed. Tree
metadata remains separate from a declaration that all content was read.

For an explicitly requested source contribution, an existing write-capable
login can create a separate contribution branch:

```sh
node scripts/github-knowledge-gateway.mjs write Juri-Halveth/open-research-branches notes/contribution.md codex/my-contribution contribution.local.txt "Add reviewed contribution"
```

The writer keeps GitHub permissions, refuses default-branch writes and branch
collisions, and binds an existing file's blob for the update. Its result is a
branch commit receipt; merge, external testing and execution remain separate.
Login alone does not grant another account access to a private repository.
The [private workspace entry](https://github.com/Juri-Halveth/halveth-private-core/blob/main/docs/impact-learning-20261007/START_HERE.md)
connects readable knowledge with the full preserved originals.

### Public contributors without upstream write permission

Anyone can read the public roots. For a requested source contribution, an
authenticated caller without upstream push permission can write in their own
fork and propose the change through a pull request. Use GitHub's native API:
`GET /user` binds the caller; `POST /repos/{owner}/{repo}/forks` creates their
fork; create a contribution ref and commit there, then
`POST /repos/Juri-Halveth/open-research-branches/pulls` proposes the exact
`caller:branch` against `main`. Wait for the fork to become available and retain
all operation receipts. The gateway above handles callers with existing
upstream write permission; this fork route uses the caller's own GitHub API
client. These routes retain review and the private repository's access rules.
