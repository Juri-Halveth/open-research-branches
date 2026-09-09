# Pixel Region Change Observer

This branch is a pure offline comparator for caller-supplied RGBA frame arrays.
It does not capture a screen, enumerate windows, inspect foreground
applications, read session logs, identify a person, access a camera, or use the
network.

Its purpose is narrower: compare the same bounded pixel region in consecutive
synthetic frames and return explicit observation and coverage records.

## Observation model

Input binds:

- frame dimensions and exactly four RGBA channels;
- a closed declaration that the source is generated, contains no personal or
  third-party content, and was not captured from a device;
- one rectangular region;
- a per-channel difference threshold;
- an ordered sequence of synthetic frame IDs, synthetic monotonic times, and
  pixel arrays.

A pixel is marked changed when the maximum absolute RGBA-channel difference is
greater than or equal to the threshold. Comparisons outside the declared region
are not performed.

Each result carries two addressed frame endpoints and their SHA-256 digests.
The relation type is `PIXEL_DIFF_BETWEEN_SUPPLIED_FRAMES`; its authority effect
is always `NONE`.

## Run

Requires Node.js 20 or newer.

```sh
node src/cli.js < fixtures/synthetic-frames.json
npm test
```

The included frames are generated numeric arrays. They contain no screenshot,
window title, local path, foreground event, session record, user identifier, or
third-party content.

The source declaration is a required input constraint, not independent proof
of provenance. The output therefore keeps the source-origin evidence state at
`NOT_PROVEN` and never claims that arbitrary caller-supplied numbers are truly
synthetic.

## Coverage and claim boundaries

**Observed by this code:** differences between the supplied frame samples,
inside the supplied region, under the supplied threshold and RGBA comparison
rule.

**Not observed:** the interval between samples, the acquisition process that
created a frame, pixels outside the region, another display or layer, dropped
source frames, application state, user action, causality, security impact, or
the physical world.

Every positive result is capped at:

`PIXEL_DIFFERENCE_OBSERVED_BETWEEN_SUPPLIED_FRAMES_WITHIN_DECLARED_REGION_AND_THRESHOLD`

Every negative result is capped at:

`NO_PIXEL_CHANGE_OBSERVED_AT_SUPPLIED_SAMPLES_WITHIN_REGION_AND_THRESHOLD`

It never establishes `NO_TRANSIENT_OCCURRED_BETWEEN_FRAMES`. Between-sample
time is emitted as a known temporal blind interval. The output keeps
`all_states_observed`, `no_event_observed_means_event_absent`, and
`validator_proves_model_complete` set to `false`.

## Public-safety properties

- No screen-capture or operating-system APIs.
- No filesystem traversal; the CLI accepts stdin only.
- No network, subprocess, persistence, or external effect.
- Closed input objects reject metadata such as a window title or session ID.
- Bounded dimensions, frame count, and total channel values.
- Strictly increasing synthetic timestamps and explicit endpoint digests.

## Continuation tasks

- Publish a versioned JSON Schema matching the runtime validator.
- Add property tests for region slicing and threshold boundaries.
- Add calibrated color-space profiles as separate versioned operators.
- Design a bounded streaming buffer that reports measurable overflow and loss.
- Compare two independent synthetic generators without calling them independent
  observations unless their provenance is actually separate.
- Keep any future real capture adapter in a separate, authorization-gated
  project with data minimization, retention, and privacy review.

## Licence

MIT. See `LICENSE`.
