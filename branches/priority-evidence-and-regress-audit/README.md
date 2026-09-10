# Priority, evidence and regress audit

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

This public branch turns priority, credit, participation and monetary questions
into separate, source-bound routes. It is a reusable intake and review model. It
does not decide a real dispute.

## The seven non-converting axes

```text
SNAPSHOT_PRIORITY
PUBLIC_AVAILABILITY
KNOWLEDGE_ACCESS
DERIVATION
RIGHTS_INFRINGEMENT
ENTITLEMENT_REGRESS
AMOUNT
```

Evidence on one axis remains evidence on that axis. A Git commit can bind exact
repository bytes and object relations. It does not silently prove that a later
actor saw them, derived from them, infringed a right, owes a remedy or owes a
particular amount.

Factual `evidenceRefs` and legal `authoritySourceIds` remain separate. A fact
in an observed or strongly supported state requires a nonempty evidence record
whose declared evidence class matches that fact; an official citation alone is
not case evidence.

## Main results

| Record | Strongest source-bound use | Claim ceiling |
| --- | --- | --- |
| Git commit, tag or release | Bind exact content, object relations and platform metadata | No qualified timestamp, first creation, external access or legal entitlement by itself |
| Qualified electronic timestamp | Presumption for accurate date/time and integrity of the bound data under eIDAS | No creator identity, publication, inventorship or infringement |
| Public repository or web record | Bind public availability of exact content no later than a supported date; possible prior-art candidate | No sole inventorship, actual target knowledge or copying |
| Written concept | Bind wording and date; protect sufficiently original expression where the legal conditions fit | No exclusive right to every underlying abstract idea |
| Software source | Protect concrete original code expression | Functionality, language and data format alone are not protected program expression |
| Patent application | Bind filing date and procedural applicant position | No grant, validity or truthful inventor designation from filing alone |
| Trade-secret record | Bind a secrecy timeline, value, reasonable measures, legitimate secrecy interest, alleged acquisition/use/disclosure and section 5 exception scope | Publicly accessible content is not kept secret merely by calling it confidential; an alleged act is not automatically unlawful |
| Restitution theory | Map gain, claimant-side attribution, absence of legal ground and an exclusively allocated position | No generic payment claim from similarity, usefulness or a lost opportunity |
| Contribution record | Route to joint authorship, joint inventorship, employee invention or contract where the facts fit | No universal participation share from “similar idea first” |

Public disclosure can help to prove a publication state and can simultaneously
affect patent novelty or trade-secret status. This branch therefore records the
timeline and raises a review flag. It does not recommend whether, when or where
to file a patent application.

## Report-first handling

The router preserves a sufficiently identified report before deciding its
merits. It accepts `UNKNOWN` on all later axes. If a specific evidence category
is controlled by another actor, it records a candidate route for production,
inspection or secondary-substantiation review. It does not manufacture a
production duty, adverse inference or burden reversal.

The route follows this order:

```text
REPORT
  -> PRESERVE EXACT STATEMENT AND REFERENCES
  -> BIND EACH EVIDENCE AXIS SEPARATELY
  -> IDENTIFY SPECIFIC OTHER-SPHERE RECORDS
  -> MATCH A PROCEDURAL OR SUBSTANTIVE SOURCE
  -> HUMAN APPLICABILITY AND MERITS REVIEW
  -> ONLY THEN REMEDY AND AMOUNT REVIEW
```

## Files

| File | Purpose |
| --- | --- |
| [`sources.json`](sources.json) | Official legislation, court, patent-office and first-party Git/GitHub source registry |
| [`route-contract.json`](route-contract.json) | Typed axes, facts, routes, invariants and claim ceiling |
| [`src/priority-evidence-router.mjs`](src/priority-evidence-router.mjs) | Deterministic report-first route evaluator |
| [`test/priority-evidence-router.test.mjs`](test/priority-evidence-router.test.mjs) | Non-conversion, public-disclosure and evidence-access tests |
| [`navigation-frame.json`](navigation-frame.json) | HALVETH/LUCINET status-quo legal-adapter frame |
| [`navigation-receipt.json`](navigation-receipt.json) | Deterministically generated navigation receipt |
| [`reconstruction-cycle.json`](reconstruction-cycle.json) | Core 3.5 reconstruction and temporal-branch record |
| [`FREE NEWS 015`](../../reports/FREE_NEWS_015_PRIORITY_EVIDENCE_AND_REGRESS_ROUTES.md) | Public German-language audit |

## Run

```bash
npm test
```

The repository-wide test runner also discovers the branch test automatically.

## Public claim ceiling

```text
SOURCE_BOUND_PRIORITY_CREDIT_PARTICIPATION_EVIDENCE_ACCESS_AND_REGRESS_ROUTE_MAP
NOT_AUTHORSHIP_INVENTORSHIP_ACCESS_DERIVATION_INFRINGEMENT_ENTITLEMENT_AMOUNT_OR_CASE_OUTCOME_FINDING
```

The sources describe general German and EU routes. Application to an individual
case still requires the exact parties, work or invention, chronology,
employment and licence context, procedural posture, limitation questions and
remedy elements.
