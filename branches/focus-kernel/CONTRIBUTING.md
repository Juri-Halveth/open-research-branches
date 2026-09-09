# Contributing

This public derivative welcomes small, independently reviewable continuations
under the repository's path-based license map.

## Workflow

1. Select exactly one task from `OPEN_M2_TASKS.md`.
2. State the behavior being changed and the behavior that must remain unchanged.
3. Add or update tests before claiming completion.
4. Run `npm test` with Node.js 20 or newer.
5. Verify that the application still performs no network request and creates no
   storage unless the selected task explicitly introduces opt-in M2 storage.
6. Document remaining limitations without calling them fixed.

## Contribution boundaries

Do not include:

- credentials, tokens, cookies, private messages or personal records;
- local machine paths, usernames, device names or private network addresses;
- copied proprietary reports, screenshots, datasets or third-party assets;
- exploit payloads or instructions for harmful external action;
- telemetry, hidden analytics or automatic external submission;
- automatic focus changes based on reviewer or model output.

Use synthetic examples in tests. Reviewer output must remain typed as untrusted
data and consequential changes must remain user-confirmed.
