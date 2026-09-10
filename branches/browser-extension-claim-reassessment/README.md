# Browser Extension Claim Reassessment

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

## Result

The article's binary framing is too coarse, but the opposite conclusion would
also be unsupported. Every listed product idea has plausible legitimate value.
That does **not** establish that the listed extension identity or a reported
version is safe.

The strongest public investigator source reports a shared remote-control and
code-loading framework across all nineteen IDs. It separately says the
detailed sixteen-module payload set was observed through the command channel
of the largest extension. Therefore this branch keeps four statements apart:

- `ADVERTISED_UTILITY`: useful or at least plausible for all nineteen
- `SHARED_MALICIOUS_FRAMEWORK`: reported by Socket for all nineteen
- `EVERY_FINAL_PAYLOAD_ON_EVERY_ID`: `NOT_PROVEN` by the public report
- `CURRENT_SAFE_ARTIFACT`: `NOT_PROVEN`; removal or a good idea is not a safe build

## Why both can be true

A browser extension may perform its advertised function and still contain a
second hidden control path. DomainTools independently describes that general
dual-function pattern: useful-looking extensions can provide partial or real
functionality while contacting actor-controlled infrastructure. Chrome's own
security guidance treats extensions as privileged software and recommends
minimal permissions because compromise exposes users through those privileges.

The relevant object is consequently not the title alone. Review must bind:

`extension ID + store + exact version + package digest + permissions + network destinations + update owner + observed behavior + time`.

## Individual reassessment

The machine-readable table in [`data/extensions.json`](data/extensions.json)
reviews each of the nineteen IDs. It preserves the useful idea and gives a
clean-room design route while retaining the investigator report and the
absence of an independent reproduction here.

| Family | Listed products | Legitimate clean-room potential |
| --- | ---: | --- |
| copy, selection, OCR | 2 | accessibility and user-triggered extraction |
| visual search | 2 | selected-region search and translation |
| local PDF protection | 1 | offline encryption with reviewed primitives |
| marketing/SEO/ad research | 6 | transparent current-site or public-ad analysis |
| crypto news and market data | 5 | fixed-source, read-only feeds and alerts |
| public chain/address exploration | 3 | no-signing explorer routing and reconciliation |

## Safe conclusion today

Do not reinstall the reported IDs merely because their concepts are valuable.
A safe continuation is a clean-room, open, reproducible implementation with:

- `activeTab` or optional per-site permissions instead of permanent all-site access
- no remote executable code and no dynamic CSP weakening
- fixed, documented network endpoints
- no cookies, session tokens, wallet connection, signing or seed-phrase input
- published source, reproducible package digest and version-specific review
- visible ownership/update history and a rollback path

Google documents `activeTab` and optional permissions as narrower alternatives
to broad host access. Microsoft requires narrow purpose, essential permissions,
disclosed behavior and prohibits remote scripts inconsistent with the stated
function. Those are useful design baselines; store presence alone is not a
complete security proof.

## Evidence states

- `OBSERVED`: the supplied article names nineteen extensions; Socket's public
  report lists matching IDs and groups them as five acquired plus fourteen
  reportedly actor-created; its package pages mark them unpublished/removed.
- `STRONGLY_SUPPORTED`: the product concepts themselves are not inherently
  malicious; the described utilities can be built with narrow permissions.
- `INFERRED`: a clean-room version could preserve value while removing the
  reported control plane, subject to code and build review.
- `UNKNOWN`: exact package bytes on any particular user's computer, which
  version was installed, which command modules it received, and whether a safe
  independently maintained successor exists.
- `NOT_PROVEN`: that the PC-Welt summary independently verified every sample;
  that every malicious module ran in every extension; or that any listed ID is
  now safe to reinstall.

## Reopen trigger

Reopen one row when an exact extension package with a cryptographic digest,
version, manifest, source provenance and lawful static-analysis scope is
available. Do not install or execute a historical sample for this branch.

## Claim ceiling

`PUBLIC_SOURCE_REASSESSMENT_NOT_INDEPENDENT_MALWARE_REPRODUCTION`

See [`SOURCES.md`](SOURCES.md) for primary and official sources.

