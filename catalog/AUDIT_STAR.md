# Audit Star

Stand: 2026-09-10
Status: `FINITE_SNAPSHOT`

Der Audit Star in [`audit-star.json`](audit-star.json) ist ein
deterministischer, endlicher Index aktueller und historischer Git-Pfade. Sein
Zentrum ist `audit-star:index`. Von dort führen ausschließlich typisierte
`INDEXES`-Kanten zu Pfadknoten. Zusätzliche `EXPLICITLY_REFERENCES`-Kanten
entstehen nur, wenn ein gebundener aktueller Textblob einen Zielpfad wörtlich
enthält.

## Gebundene Coverage

Für den in `source.commitId` genannten Commit erfasst der Generator:

- alle Einträge aus `catalog/branches.json` am gebundenen Ref;
- alle Git-Objektpfade unter `reports/` am gebundenen Ref;
- dieselben beiden Pfadklassen in der mit `git rev-list <BOUND_COMMIT_ID>`
  bestimmten Vorfahrenschaft des gebundenen Commits;
- wörtliche Querverweise aus aktuellen Textblobs, die einem aktuellen Ast- oder
  Reportknoten gehören.

Jeder aktuelle Pfad trägt sein gebundenes Git-Objekt. Ein nur historisch
beobachteter Pfad bleibt als `HISTORICAL_ONLY` erhalten. Gleichnamige oder
umbenannte Pfade werden nicht still als dasselbe Artefakt behandelt.

Die JSON-Datei nennt den exakten Commit, Tree, Committer-Zeitstempel, Regeln,
Zählwerte und ausgeschlossenen Flächen. Ungetrackte Arbeitsbaumdateien, vom
gebundenen Commit nicht erreichbare Side-Refs und Git-Objekte, externe
Repositories, Remote-Publikationsstatus, Binärinhalt und historische
Blobkörper liegen außerhalb dieser Coverage.

## Relationsgrenze

`INDEXES` bedeutet nur, dass ein Pfad durch die deklarierte Katalog- oder
Git-Historienregel aufgenommen wurde. `EXPLICITLY_REFERENCES` bedeutet nur,
dass ein aktueller gebundener Textblob einen Zielpfad wörtlich referenziert.
Die Evidence nennt dafür Quellpfad, Blob-ID, Zeile, Literal und Syntaxklasse.

Keine Kante beweist Kausalität, Urheberschaft, Ableitung, Kopieren, Identität,
Priorität, Veröffentlichung oder die Wahrheit eines Artefaktclaims. Ein
Committer-Zeitstempel ist ebenfalls kein unabhängiger Entstehungs- oder
Publikationsnachweis.

## Reproduktion

```bash
node scripts/build-audit-star.mjs --ref SOURCE_COMMIT_ID --stdout
node --test scripts/audit-star.test.mjs
```

`SOURCE_COMMIT_ID` wird durch den exakten Wert aus `source.commitId` ersetzt.
Ein anderer gebundener Commit oder eine andere Vorfahrenschaft erzeugt einen
neuen endlichen Snapshot. Side-Refs außerhalb dieser Vorfahrenschaft ändern
ihn nicht. Die erzeugte JSON-Datei bleibt deshalb an den in ihr genannten
Commit und Tree gebunden.

## Claim Ceiling

`BOUND_GIT_PATH_INVENTORY_AND_EXPLICIT_TEXT_REFERENCES_ONLY_NOT_AUTHORSHIP_CAUSALITY_DERIVATION_IDENTITY_REMOTE_PUBLICATION_OR_CLAIM_TRUTH`
