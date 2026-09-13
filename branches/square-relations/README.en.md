# Square Relations · Everything in relation in a square

[Deutsch](README.md) · [Research room](../../README.md) · [Code & tools](../../wiki/Code-und-Werkzeuge.md)

A local interactive comparison space: words, emojis, hearts, dashes, numbers
and other characters appear as equal blocks in four visible sectors of a
square. Every block connects to every other block. A second square matrix
shows every ordered pair, including self cells on its diagonal.

A connection means **“consider these two inputs together.”** This tool does
not assign their meaning. The sectors organize the display; they imply no
ranking, physical dimensions or causal relationship.

## Try it

With Node.js 20 or newer, run this from the repository root:

```powershell
node branches/square-relations/preview.mjs
```

Alternatively, run `node preview.mjs` from the module directory.
Then open `http://127.0.0.1:8793/` in a browser. The preview server binds to
the local loopback address and serves JavaScript modules with the appropriate
MIME type. The application needs no build step or additional runtime packages.
The interface can switch between German and English.

1. Each editor line is a block. Duplicate labels remain separate occurrences;
   empty lines and whitespace are retained. A completely empty input is
   reported as an input error.
2. Apply the input. All blocks appear in the four sectors and in the complete
   matrix.
3. Select a block or a pair. Selection highlights relationships while the
   other blocks and matrix cells remain visible.

## What is calculated?

For `n` input lines, the undirected graph has `n × (n − 1) / 2` distinct
pairs. The matrix has `n²` cells, including `n` self cells; `(i,j)` and
`(j,i)` display the same undirected pair in two positions. Self cells can
be selected as self references.

| Default example | Count |
| --- | ---: |
| Blocks | 16 |
| Visible sectors | 4 |
| Distinct undirected pairs | 120 |
| Matrix cells | 256 |
| Self cells | 16 |

The input limit is **64 blocks and 8,192 UTF-8 bytes**. Exceeding either
limit produces a visible error; input is never silently truncated. These
are limits of this interactive prototype.

The core model recognizes LF and CRLF line separators. A bare CR remains
content. It performs no Unicode normalization and rejects invalid Unicode
surrogates. Block positions are exact UTF-16 spans in the accepted source;
line separators belong to the source and are excluded from each block text.
Browsers may normalize line endings when pasting into a text field; the
accepted field contents are the bound input.

The SHA-256 display binds the accepted editor contents encoded as UTF-8.
The digest is a comparison value for this input; it does not certify
authorship, the original creation time or equivalence to an external system.

## Files and tests

| File | Responsibility |
| --- | --- |
| [index.html](index.html) | Accessible interface and editor |
| [styles.css](styles.css) | Square, sectors, colors and matrix |
| [app.mjs](app.mjs) | Rendering, selection and language switching |
| [core.mjs](core.mjs) | Input validation, blocks, pair graph and matrix |
| [preview.mjs](preview.mjs) | Local static preview server with explicit MIME types |
| [tests/core.test.mjs](tests/core.test.mjs) | Deterministic model checks |

With Node.js 20 or newer, from the module directory:

```powershell
node --test tests/core.test.mjs
```

## Data and reuse

The supplied content is synthetic. Input is rendered as text. The local
server serves the static files; the application then uses no runtime API,
external network requests, telemetry or browser storage. Reloading discards
the current editing state.

State: `PUBLIC_DERIVATIVE` · `SYNTHETIC_ONLY` · local software prototype.
This implementation provides a finite pair model and visualization; it does
not implement every HALVETH Core contract.

Code, tests, HTML and CSS follow [MIT](../../LICENSE); newly authored
documentation follows [CC BY 4.0](../../LICENSE-CONTENT.md), under the existing
[path-based license map](../../LICENSES.md).
