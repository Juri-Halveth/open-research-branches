# PortSwigger Public Bug-Bounty Scope Snapshot · 2026-10-07

**State:** `PUBLIC_SCOPE_SNAPSHOT`

Public asset-level scope observed in the PortSwigger HackerOne program on
2026-10-07.

## Assets

| Asset | Type | Max severity | Bounty eligible | Updated | Resolved |
| --- | --- | --- | --- | --- | ---: |
| `share.portswigger.net` | Domain | Critical | Yes | 2025-12-19 | 0 (0%) |
| `portswigger.net` | Domain | Critical | Yes | 2017-07-21 | 33 (29%) |
| `links.portswigger.net` | Domain | Critical | Yes | 2025-12-19 | 0 (0%) |
| `id.portswigger.net` | Domain | Critical | Yes | 2026-06-09 | 0 (0%) |
| `collections.portswigger.net` | Domain | Critical | Yes | 2025-12-19 | 0 (0%) |
| Burp Suite DAST | Other | Critical | Yes | 2025-04-17 | 3 (3%) |
| Burp Collaborator | Executable | Critical | Yes | 2017-07-21 | 3 (3%) |
| `ai.portswigger.net` | Domain | Critical | Yes | 2025-04-02 | 0 (0%) |

## State model

Each asset remains independently addressable:

    asset
    → identity
    → operation
    → before-state
    → after-state
    → delta
    → verification

Current research state:

    share.portswigger.net        OPEN
    links.portswigger.net        OPEN
    id.portswigger.net           OPEN
    collections.portswigger.net  OPEN
    ai.portswigger.net           OPEN
    portswigger.net              OPEN
    Burp Suite DAST              OPEN
    Burp Collaborator            OPEN

The resolved-report counter is preserved as an observed program-UI value.
It is not interpreted as a count of all historical submissions.

## Sources

- https://hackerone.com/portswigger
- https://docs.hackerone.com/en/articles/8494552-defining-scope

## Research continuation

Live observations are bound to asset, identity, operation, time and provenance.
New evidence extends the state graph rather than replacing earlier observations.
