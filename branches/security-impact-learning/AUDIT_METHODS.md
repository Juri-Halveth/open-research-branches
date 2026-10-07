# Security Research · seven review questions

These are general review methods and synthetic examples. They contain no private
report threads, target identifiers or operational reproduction instructions.

| Review question | The mistake it catches | Evidence needed for the next decision |
| --- | --- | --- |
| Is authority current? | Treating an old permitted state as current authority | The source and time of the authority used for this decision |
| Which format is required? | Treating one reference library as the target's contract | Producer, consumer and version-bound format definition |
| What does revocation mean? | Equating deactivation, removal and revocation | The explicit lifecycle and consent contract |
| Is the observation complete? | Sending a template with unfilled observations or trigger fields | Concrete own observation and complete source record |
| Is the entry actually bound? | Modeling a large consequence while assuming the disputed input | The narrow entry/policy/effect bridge within the authorized scope |
| Who supplied the consumer? | Treating a researcher-created capability as a deployed one | Separate source, test, consumer and deployment records |
| Is source equal to deployment? | Calling a build inconsistency a production security failure | Version and deployment binding, with remaining gaps retained |

[The draft checker](submission-review.mjs) preserves these missing edges and
rejects explicit placeholders and severity-field drift. Its booleans are
declarations. A pass means a structurally reviewable draft; it proves no
outside fact, severity, authority, program acceptance or payment.

```sh
node --test branches/security-impact-learning/submission-review.test.mjs
```

A valid contribution, a duplicate, an informational correction and a bounty
decision have different meanings. Competition reward rules must be checked
separately from ordinary duplicate-report rules. Record the actual current
decision rather than preserving an obsolete closure as the latest state.

Public learning uses newly written general methods. Publication of a specific
private report follows its own program category and case outcome. See the
[official publication policy](https://immunefi.com/responsible-publication/)
and [publication guide](https://immunefi.com/responsible-publication-guide/).
The [submission checklist](https://immunefisupport.zendesk.com/hc/en-us/articles/15427337783057-Bug-Report-Submission-Checklist)
binds asset, impact, evidence and safe proof requirements separately.

Money remains a separate ledger: application cost, refundable deposit, service
expense, investment result and confirmed reward must not be added together as
one demonstrated loss. An announced payment window and a completed transfer
also retain separate receipts.

[Universe entry](../../START_HERE_AI.md) · [Public discussions](https://github.com/Juri-Halveth/open-research-branches/discussions)
