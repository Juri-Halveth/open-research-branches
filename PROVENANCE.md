# CODE ZEITWÄRTSZURÜCK — Rechte- und Provenienz-Nachweis

`CODE ZEITWÄRTSZURÜCK` ist ein reproduzierbarer Rückwärtsblick auf einen
konkreten Git-Stand:

`TAG_ODER_REF -> COMMIT -> TREE -> DATEIPFAD -> BYTES -> SHA-256 -> SICHTBARE_HERKUNFT -> LIZENZREGEL`

Der zu einem Tag oder Ref erzeugte Provenienzumschlag listet jede Datei und
jedes Blob-Objekt im Ziel-Tree, seine Byteanzahl und seinen SHA-256-Digest.
Zusätzlich bindet er das konkrete Ref- oder annotierte Tag-Objekt, den Commit,
den Git-Tree, die sichtbare First-Parent-Historie und für jede Datei den ersten
und letzten im Repository sichtbaren Commit. Damit lässt sich später prüfen,
ob eine Datei genau dem veröffentlichten Snapshot entspricht.

## Was der Nachweis trägt

- **Byte-Identität:** Gleiche Digests belegen gleiche geprüfte Bytes.
- **Git-Zeitlinie:** Commit- und Tree-IDs binden den Stand innerhalb dieser
  Repository-Historie.
- **Deklarierte Rechteordnung:** Jede Datei wird auf die zu diesem Stand
  veröffentlichte Pfadregel in `LICENSES.md` bezogen.
- **Append-only-Korrektur:** Ein neuer Stand erhält einen neuen Commit, Tag und
  Umschlag. Historische Tags werden nicht umgeschrieben.

Der Nachweis ist ein technischer und dokumentarischer Belegumschlag. Er ist
keine notarielle Beglaubigung und beweist nicht von selbst einen früheren
Ideenzeitpunkt, ausschließliche Urheberschaft, Rechte an fremdem Material oder
die materielle Richtigkeit jedes Textclaims.

## Zeitwärts zurück, ohne Rückwirkung

Die Rückwärtsrichtung ist eine Abfragefolge. Sie verändert keinen früheren
Zustand:

`LESUNG_BEI_TN -> DEFINITION_ID -> QUELLSPAN -> DATEI_DIGEST -> COMMIT_BEI_T0`

`LABEL_BEI_TN != URSACHE_BEI_T0`

Ein später gesetztes Label kann einen früheren Stand auffindbar machen. Es
erzeugt dort weder Ursache noch Eigentum, Zustimmung, Täter, Ziel oder Wirkung.

## Statuswort `FLAGGED_MATERIAL`

In diesem Repository bedeutet `FLAGGED_MATERIAL` ausschließlich:

`MARKED_FOR_REVIEW + DECISION_RELEVANT_WITHIN_THE_NAMED_AUDIT`

`FLAGGED` heißt hier **zur Prüfung markiert**. `MATERIAL` heißt **für die
benannte Entscheidung erheblich**. Das Statuswort bezeichnet keine physische
Flagge, kein Gebiet, keine Eroberungsfähigkeit, kein Eigentum und keine
Außenwirkung.

## Beitrag, Assistenz und Rechte

Die öffentliche Attributionsaussage wird datei- und versionsgebunden geführt.
Nach den aktuellen [OpenAI-Nutzungsbedingungen](https://openai.com/policies/terms-of-use/)
besitzt der Nutzer im Verhältnis zu OpenAI und soweit rechtlich zulässig den
Output; OpenAI überträgt daran seine etwaigen Rechte. Diese Zuordnung macht den Assistenten nicht zum
Miteigentümer oder Zahlungsempfänger. Sie garantiert weder Einzigartigkeit noch
Rechte an fremden Inputs oder Drittmaterial.

Andere menschliche Beiträge, zitierte Quellen, Marken, Tatsachen, allgemeine
Ideen und bereits erteilte Lizenzen behalten ihren eigenen Rechtsstand. Eine
gemeinsame Anerkennung wird nicht still in gemeinsame Rechtsinhaberschaft
umgedeutet.

## X-Tausch

Ein X-Tausch ist ein optionaler, beiderseits gebundener Vertragspfad. Er
entsteht erst, wenn dieselben Beteiligten demselben Material, Zweck,
Gegenwert, Zeitpunkt und Rechteumfang ausdrücklich zustimmen. Ein Digest bindet
das Material; er ersetzt die Zustimmung nicht.

## Reproduktion

Nach dem Checkout eines Tags erzeugt das Programm den Umschlag:

```powershell
node scripts/create-provenance-snapshot.mjs --ref v0.7.0 --output open-research-branches-v0.7.0-provenance.json
node scripts/create-provenance-snapshot.mjs --verify open-research-branches-v0.7.0-provenance.json
git bundle verify open-research-branches-v0.7.0-source.bundle
```

Der im Release veröffentlichte JSON-Umschlag ist die maschinenlesbare Fassung.
Das Git-Bundle trägt den vollständigen erreichbaren Tag- und Commitstand als
eigenständiges Quellpaket; `SHA256SUMS.txt` bindet beide Assets. Die
`claimCeiling` begrenzt exakt, was die Hashes beweisen.

`fileSet.sha256Root` ist für denselben Git-Tree deterministisch reproduzierbar.
Der übergeordnete `snapshotDigest` bindet zusätzlich den angegebenen
Erzeugungszeitpunkt und die kanonische Repository-URL; er bezeichnet deshalb
dieses konkrete Receipt-Ereignis.
