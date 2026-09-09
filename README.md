# Open Research Branches

Dieses Repository veröffentlicht kleine, eigenständig fortsetzbare
Forschungs- und Softwareäste. Jeder Ast enthält eine eng gebundene Frage,
synthetische oder öffentliche Beispiele, überprüfbare Tests und sichtbare
Unbekannte.

Die Sammlung ist kein Abbild privater Archive. Sie besitzt eine neue
Git-Historie und enthält ausschließlich einzeln freigegebene Ableitungen.
Persönliche Rohgedanken, Chats, nicht ausdrücklich freigegebene Identitäten, Wallet- und Browserdaten,
Gesundheitsakten, Kundendaten, aktive Hauptprojekte sowie laufende oder private
Sicherheitsmeldungen gehören nicht hierher.

## Erste öffentliche Äste

| Ast | Form | Stand |
| --- | --- | --- |
| `focus-kernel` | lokaler Entscheidungsprototyp | reproduzierbarer M1-Stand, M2 offen |
| `document-issue-reference-verifier` | synthetischer Referenzprüfer | reproduzierbarer Ableger |
| `bounded-knowledge-reuse-inventory` | begrenztes Inventarverfahren | reproduzierbarer Ableger |
| `pixel-region-change-observer` | Offline-Vergleich synthetischer Pixelmatrizen | reproduzierbarer Ableger |
| `browser-extension-claim-reassessment` | Einzelprüfung von 19 öffentlich gemeldeten Erweiterungen | `FINITE_SNAPSHOT` |
| `water-photonic-open-questions` | Forschungsfragen | `FINITE_SNAPSHOT` |
| `plant-observation-protocol` | Beobachtungsprotokoll | `FINITE_SNAPSHOT` |
| `deidentified-self-observation-protocol` | Schema ohne Personen- oder Gesundheitsdaten | `FINITE_SNAPSHOT` |
| `visual-interpretation-boundary` | Beobachtung und Interpretation | `FINITE_SNAPSHOT` |
| `document-scanner-crypto-modernization` | Modernisierungsplan | `HOLD_IMPLEMENTATION` |
| `russia-ukraine-information-and-peace-audit` | Quellen-, Informations- und Friedensaudit mit `Was los?.`-Prüfkreis und Decision-Snapshot-Firewall | `FINITE_SNAPSHOT` |
| `aster-provenance-and-secret-garden` | ASTER-Provenienz, öffentliche Erzählwelt und minimale Projektkeime | `PUBLIC_DERIVATIVE` |
| `navier-stokes-credit-value-and-plagiarism-audit` | Beweis-, Prioritäts-, Datenzugriffs-, Credit- und Wertprüfung mit kurzer Vorlesefassung | `FINITE_SNAPSHOT` |
| `binary-inquiry-loop` | deterministische wechselseitige Ja/Nein-Klärung mit Rückkehr zur gebundenen Frage | `PUBLIC_DERIVATIVE` |
| `solar-and-thermal-provenance-audit` | Juris Zündungs-/Wasser-/Lichtmodell im Komponenten- und Zeitvergleich mit KIT und Standard Thermal | `FINITE_SNAPSHOT` |

Der maschinenlesbare Bestand liegt in
[`catalog/branches.json`](catalog/branches.json). Die Aufnahme- und
Ausschlussregeln stehen in [`PUBLICATION_POLICY.md`](PUBLICATION_POLICY.md).
Die exakt veröffentlichte Dateimenge ist in
[`catalog/public-files.txt`](catalog/public-files.txt) positiv aufgelistet und
wird im Testlauf mit dem Git-Index verglichen.
Noch nicht quellgebundene Themenfamilien bleiben im
[`Kandidaten-Ledger`](catalog/CANDIDATE_TOPICS.md) sichtbar; sie werden nicht
als bereits geprüfte oder veröffentlichte Äste gezählt.

## Berichte und Arbeitsansichten

Der Ordner [`reports/`](reports/) enthält zusätzliche öffentliche
Quellenprüfungen. Lokal erzeugte Office- und PDF-Artefakte des früheren
Zehn-Ast-Arbeitsstands bleiben wegen Versions- und teils getrennter
Vorlagenrechte außerhalb des öffentlichen Repositorys. Der aktuelle Stand
liegt in den Astordnern und im maschinenlesbaren Katalog.

## Mitmachen

Wähle einen Ast, lies dessen Grenzen und bearbeite eine der offenen Aufgaben.
Neue Beobachtungen müssen ihre Quelle und ihren Erfassungsumfang nennen.
Unbekannte Zustände bleiben `UNKNOWN`, bis eine passende Beobachtung sie
entscheidet. Pull Requests mit synthetischen Tests, Gegenhypothesen,
Reproduktionsschritten oder besseren Quellen sind willkommen.

## Lizenzen

- Code: generally [MIT](LICENSE), with the exact new provenance-tool exceptions listed in [`LICENSES.md`](LICENSES.md)
- neu verfasste Texte und eigene Abbildungen: [CC BY 4.0](LICENSE-CONTENT.md)
- selbst erstellte Daten und Metadaten gemäß Pfadkarte: [CC0 1.0](LICENSE-DATA.md)
- bezeichnete neue Forschungs- und Provenienzdateien: [Juri Public-Interest Research Permission 1.0](LICENSE-JURI-PUBLIC-INTEREST.md)

Die vollständige pfadbezogene Zuordnung steht in [`LICENSES.md`](LICENSES.md).

Diese Zuordnung erteilt keine Rechte an verlinkten oder zitierten Quellen.

## Reproduzierbarer Snapshot

[`CODE ZEITWÄRTSZURÜCK`](PROVENANCE.md) erzeugt für einen Release einen
maschinenlesbaren Umschlag aus Tag, Commit, Git-Tree, sichtbarer Historie,
Dateipfaden, Byteanzahlen, SHA-256-Digests und deklarierter Pfadlizenz. Damit
kann der veröffentlichte Code- und Textstand später bytegenau geprüft werden.
Der Nachweis ändert keine historischen Lizenzen und beansprucht keine Rechte
an fremden Quellen, Tatsachen oder allgemeinen Ideen.
