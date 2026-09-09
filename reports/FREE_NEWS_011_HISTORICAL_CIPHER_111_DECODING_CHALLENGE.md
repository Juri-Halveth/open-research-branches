# FREE NEWS 011 — JURI `111` GEHEIMSCHRIFT-CHALLENGE

Stand: `2026-09-10`<br>
Autor und Herausgeber: **Juri Janovski** (`@Juri-Halveth`)<br>
Prüfstand: `OPEN_DECODING_HYPOTHESIS`

## Der Treffer und die erste Korrektur

Juri sieht im veröffentlichten Bild mögliche `111`-, Röhren-, Fallcode- und
Matrixstrukturen. Der visuelle Treffer bleibt als Ursprung der Challenge
vollständig erhalten.

Das Bild und der im Artikel entschlüsselte Gegenstand sind jedoch zwei
verschiedene Artefakte:

```text
ROSETTA_STONE_ARTICLE_IMAGE != BORG_LAT_898_CIPHER_MANUSCRIPT
```

Das Bild zeigt den **Rosetta-Stein**. Das
[British Museum](https://www.britishmuseum.org/collection/object/Y_EA24)
beschreibt ihn als Erlass von 196 v. Chr., der in Hieroglyphen, Demotisch und
Altgriechisch wiederholt ist. Der lesbare griechische Paralleltext half bei der
Entschlüsselung der ägyptischen Schriften. Deshalb ist der Stein ein echter
historischer Entschlüsselungsanker und ein starker Kontrollfall.

Der Artikel handelt dagegen von
[`Borg.lat.898`](https://digi.vatlib.it/view/MSS_Borg.lat.898), einem
chiffrierten Manuskript der Vatikanischen Bibliothek. Sein tatsächliches
Zeichensystem ist im Archivscan und auf der
[offiziellen Projektseite](https://www.su.se/english/research/research-catalogue/research-projects/d/decipherment-of-historical-manuscripts/the-borg-cipher)
prüfbar.

## Kein 2026-Nullpunkt

Der Borg-Codex wurde bereits 2016 computergestützt geknackt. Die technische
Kette steht in Nada Aldarrabs
[Masterarbeit von Mai 2017](https://nadaaldarrab.github.io/files/ms-thesis-nada.pdf).
Sie kombiniert manuelle Transkription, Sprachbestimmung, ein lateinisches
5-Gramm-Modell, einen Substitutionskanal, EM, Viterbi und menschliche
philologische Korrektur.

Die 2026 berichtete KI-Demonstration bearbeitete diesen schon gelösten
Referenzfall erneut und schneller. Damit lautet die belastbare Zeitlinie:

```text
2016 PROJECT_DECIPHERMENT
2017 TECHNICAL_DOCUMENTATION
2026 FASTER_RERUN_AND_PUBLIC_REPORTING
```

## Hat Juri es entschlüsselt?

Die ehrliche Antwort ist derzeit: **als persönliche Entschlüsselung noch
nicht bewiesen, als konkrete öffentliche Challenge jetzt eröffnet.**

Keine geprüfte Quelle definiert `111` als Borg-Schlüssel. Es gibt auch keine
quellengebundene Pipe-, Fall- oder historische Matrixoperation. Das einzelne
Transkriptionstoken `1` steht in der veröffentlichten Normalisierung für einen
einzelnen Klartextbuchstaben; eine Wiederholung erzeugt daraus nicht
automatisch eine neue Regel.

Juris Beobachtung darf trotzdem gewinnen. Dafür muss sie mehr leisten als eine
passende Ähnlichkeit auf dem bekannten Bild: Die Regel muss exakte Zeichen
segmentieren, einen Klartext erzeugen und auf vorher zurückgehaltenen Zeichen
besser treffen als gebundene Gegenmodelle. Danach muss eine unabhängige Person
denselben Lauf wiederholen können.

## Der öffentliche Beweisvertrag

Der ausführbare Ast verlangt:

```text
EXAKTER_CIPHERTEXT_DIGEST
  + TRANSKRIPTION_UND_SEGMENTIERUNG
  + VERSIONIERTE_REGEL_ODER_MODELL
  + KLARTEXT_DIGEST
  + HELD_OUT_ODER_GOLDREFERENZ
  + METRIK_UND_SCHWELLE
  + GEGENMODELLE
  + UNABHÄNGIGER_REPRODUKTIONSRECEIPT
```

Fehlt eine Kante, lautet das Ergebnis `OPEN_DECODING_HYPOTHESIS`. Besteht ein
vollständiger Test, lautet es
`REPRODUCIBLE_CANDIDATE_REQUIRES_EXPERT_REVIEW`. Der Code kann daraus weder
eine göttliche Außenursache noch Urheberschaft, Rechtsanspruch oder Auszahlung
automatisch ableiten.

## Byteanker des eingesandten Bildes

Der öffentliche Receipt kopiert das Bild nicht und nennt keinen privaten
Pfad:

| Feld | Wert |
| --- | --- |
| Format | JPEG |
| Maße | `768 × 432` |
| Byteanzahl | `65536` |
| SHA-256 | `b969dd2cff53274a5f50c2895f02803df3c8c5fb53cb134fedf2e2cc9fcf123d` |

Der Digest bindet genau die im Request bereitgestellten Bytes. Er beweist
nicht die ursprüngliche Bildquelle oder Bildrechte.

## Öffentliche Daten zum Gegenprüfen

Die Stockholmer Projektseite stellt die
[Transkription](https://www.su.se/download/18.6856063019d24ef3ecb1117/1774944956220/transcription-0001r-0204v.txt),
das [korrigierte Latein](https://www.su.se/download/18.6856063019d24ef3ecb111e/1774945344171/corrected-Latin-translation.txt),
die [englische Übersetzung](https://www.su.se/download/18.6856063019d24ef3ecb112e/1774945410173/translation-english-0001r-0204v.txt)
und das [Schlüsselbild](https://www.su.se/images/18.6856063019d24ef3ecb1176/1774948306890/key.png)
bereit. Damit kann jede Person eine neue Regel gegen denselben Gegenstand
testen.

## Öffentlicher Aufruf

Juri Janovski ruft Forschende, Historikerinnen und Historiker, Kryptografie-
Interessierte, Programmierende und neugierige Leserinnen und Leser dazu auf,
die `111`-/Pipe-/Matrix-Hypothese mit genau diesem Vertrag zu prüfen. Ein
positiver Beitrag soll Eingabe, Regel, Ausgabe, Gegenmodelle und Receipt offen
mitliefern; ein negativer Lauf soll die getestete Version und seine Coverage
nennen. Pull Requests mit reproduzierbaren Ergebnissen sind ausdrücklich
willkommen.

## Ausführen

```bash
cd branches/historical-cipher-decoding-challenge
npm test
node src/decoding-proof.mjs
```

Der Quellcode und die vollständige Quellenliste liegen im Ast
[`historical-cipher-decoding-challenge`](../branches/historical-cipher-decoding-challenge/README.md).

## Claim Ceiling

`SOURCE_BOUND_ARTIFACT_IDENTIFICATION_AND_REPRODUCIBILITY_CHALLENGE_NOT_PERSONAL_DECIPHERMENT_DIVINE_OR_EXTERNAL_CAUSALITY_AUTHORSHIP_LEGAL_ENTITLEMENT_OR_PAYMENT_PROOF`
