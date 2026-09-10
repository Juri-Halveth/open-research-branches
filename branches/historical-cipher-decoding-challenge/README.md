# Juri 111 · Historical Cipher Decoding Challenge

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

Stand: `2026-09-10`<br>
Initiator: **Juri Janovski** (`@Juri-Halveth`)<br>
Status: `OPEN_DECODING_HYPOTHESIS`

## Der Fund

Juri erkennt im Aufmacherbild des Artikels eine mögliche Struktur aus `111`,
Röhren oder Pipes, nach unten fallendem Code, Text, Zahlen und einer
„Matrix“. Der Ast bewahrt diesen Ursprung als
`USER_REPORTED_VISUAL_ANALOGY` und macht daraus eine offene, ausführbare
Entschlüsselungsfrage.

Die erste Quellenkorrektur ist entscheidend:

```text
ARTICLE_IMAGE != ARTICLE_DECODED_MANUSCRIPT
```

Das eingesandte Bild zeigt den **Rosetta-Stein**. Der Artikel behandelt dagegen
den chiffrierten Vatikan-Codex **`Borg.lat.898`**. Der Rosetta-Stein ist ein
bekannter Paralleltext: Derselbe Erlass steht in Hieroglyphen, Demotisch und
Altgriechisch. Er ist deshalb ein guter Kontrollfall für Entschlüsselungslogik,
aber kein Blatt des Borg-Codex.

Der Screenshot wird nicht kopiert. Ein minimierter Receipt bindet nur die
bereitgestellten 65.536 JPEG-Bytes, ihre Maße und ihren SHA-256-Digest.

## Was beim Borg-Codex bereits belegt ist

Die [Vatikanische Bibliothek](https://digi.vatlib.it/view/MSS_Borg.lat.898)
stellt `Borg.lat.898` mit IIIF-Manifest öffentlich bereit. Die
[Stockholmer Projektseite](https://www.su.se/english/research/research-catalogue/research-projects/d/decipherment-of-historical-manuscripts/the-borg-cipher)
bindet das Manuskript, die beteiligten Rollen, den Schlüssel, die vollständige
Transkription, korrigiertes Latein und eine englische Übersetzung.

Die Entschlüsselung begann 2016. Nada Aldarrabs
[Masterarbeit von Mai 2017](https://nadaaldarrab.github.io/files/ms-thesis-nada.pdf)
dokumentiert die technische Kette: manuelle Transkription, Sprachbestimmung,
lateinisches 5-Gramm-Modell, Substitutionskanal als Finite-State-Transducer,
EM-Training, Viterbi-Decodierung und anschließende philologische Korrektur.

Die Meldung von 2026 beschreibt damit keine erstmalige Entschlüsselung eines
bis dahin ungelösten Borg-Codex. Die Universität Stockholm beschreibt eine
schnellere erneute Bearbeitung des bekannten Vergleichsfalls mit neuer KI.

## Der aktuelle `111`-Stand

In den geprüften Quellen ist `111` weder Schlüssel noch Zahlencode des
Borg-Codex. Das einzelne Zeichen `1` ist in einer normalisierten
Transkriptionsdarstellung ein Token; daraus folgt keine Dreifach-Eins-Regel.
Ebenso ist keine historische Pipe-, Fall- oder Matrixoperation dokumentiert.

Die Algorithmen der Forschenden sind Programmcode beziehungsweise formale
Modelle. Das beweist nicht, dass das Manuskript selbst ausführbarer Code ist.
Eine moderne Lookup-Tabelle ist noch keine im historischen Artefakt
eingebettete Matrix.

Status:

- `OBSERVED`: konkretes Bildreceipt, Rosetta-Identität, Borg-Artefakt,
  vorhandene Transkriptionen und bekannte Entschlüsselungsmethode;
- `STRONGLY_SUPPORTED`: das Artikelbild ist illustrativ und vom Borg-Manuskript
  getrennt;
- `HYPOTHESIS`: Juris `111`-/Pipe-/Fall-/Matrix-Lesart;
- `UNKNOWN`: eine noch nicht formulierte vollständige Juri-Regel und ihre
  Vorhersage auf unbekannten Zeichen;
- `NOT_PROVEN`: persönliche Entschlüsselung, ausführbarer historischer Code,
  göttliche Außenursache oder daraus folgende Rechte und Zahlungen.

## Wann die Challenge trifft

Ein Entschlüsselungsbeweis braucht gemeinsam:

1. exakte Ciphertextbytes, Artefakt-ID, Quelle und Digest;
2. eine gebundene Transkription und Segmentierungsregel;
3. Chiffrefamilie sowie versionierte Regel, Schlüssel oder Implementierung;
4. einen Klartext mit Digest und Sprache;
5. bisher nicht zum Anpassen verwendete Zeichen oder eine unabhängige
   Goldreferenz;
6. Metrik, Schwelle und erreichten Wert;
7. mindestens zwei sinnvolle Gegenmodelle;
8. eine unabhängige Wiederholung.

Die Regel muss auf zurückgehaltenen Zeichen besser vorhersagen als Zufall,
reine Häufigkeitszuordnung oder ein anderes gebundenes Basismodell. Ein
vollständiger maschineller Prüfpass endet bei
`REPRODUCIBLE_CANDIDATE_REQUIRES_EXPERT_REVIEW`; er erfindet kein Urteil über
Außenursache, Priorität, Recht oder Auszahlung.

## Ausführen

```bash
cd branches/historical-cipher-decoding-challenge
npm test
node src/decoding-proof.mjs
```

Die CLI zeigt den aktuellen offenen Zustand. Neue Kandidaten können denselben
Beweisvertrag durch `assessDecodingProof()` durchlaufen.

## Reopen-Trigger

Der Befund wird sofort neu geöffnet, wenn Juri oder eine andere Person eine
konkrete `111`-/Pipe-/Matrix-Regel mit exakter Eingabe, Klartextausgabe,
Held-out-Test und unabhängigem Receipt vorlegt oder wenn eine Primärquelle
eine solche Struktur im Artefakt dokumentiert.

## Claim Ceiling

`SOURCE_BOUND_ARTIFACT_IDENTIFICATION_AND_REPRODUCIBILITY_CHALLENGE_NOT_PERSONAL_DECIPHERMENT_DIVINE_OR_EXTERNAL_CAUSALITY_AUTHORSHIP_LEGAL_ENTITLEMENT_OR_PAYMENT_PROOF`
