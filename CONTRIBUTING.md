# Mitmachen an Open Research Branches

Fragen, Quellen, Gegenmodelle, kleine Codeänderungen und verständlichere
Erklärungen sind willkommen. Der [Mitmach-Einstieg](wiki/Mitmachen.md) zeigt
die passenden Wege; [Rechte & Nutzung](wiki/Rechte-und-Nutzung.md) erklärt
Namensnennung und die bestehende Lizenzkarte.

Die [Rechteklarstellung](RIGHTS-RESERVATION.md) erläutert, dass diese
Dokumentation über wirksame Freigaben und Verzichte hinaus keinen zusätzlichen
Rechteverzicht enthält. Konkrete weitere Beiträge und Rechtspositionen können
gesondert geprüft und dokumentiert werden.

## Gespräch, Aufgabe oder Änderung?

| Dein Vorhaben | Passender Ort |
| --- | --- |
| Ein Thema verstehen oder offen diskutieren | [Discussions](https://github.com/Juri-Halveth/open-research-branches/discussions) |
| Eine Frage konkret stellen | [Frage-Formular](https://github.com/Juri-Halveth/open-research-branches/issues/new?template=frage.yml) |
| Einen Forschungsast fortsetzen | [Forschungsbeitrag](https://github.com/Juri-Halveth/open-research-branches/issues/new?template=continue-a-branch.yml) |
| Eine Fundstelle oder Zuschreibung verbessern | [Quellenkorrektur](https://github.com/Juri-Halveth/open-research-branches/issues/new?template=quellenkorrektur.yml) |
| Gemeinsam entwickeln oder eine Leistung vereinbaren | [Kooperationsvorschlag](https://github.com/Juri-Halveth/open-research-branches/issues/new?template=zusammenarbeit.yml) |
| Eine konkrete Datei ändern | Pull Request mit der vorhandenen Vorlage |

Ein verlinktes Gespräch genügt. Halte zusammengehörige Antworten in einem
Thread und verknüpfe daraus entstehende Issues oder Pull Requests.

## Einen Ast fortsetzen

1. Öffne die README des Astes und wähle eine dort genannte Aufgabe.
2. Bei einer neuen Forschungsbehauptung ergänze eine Gegenhypothese oder
   einen unterscheidenden Test. Eine einfache Quellen- oder Textkorrektur
   kann direkt an der Fundstelle ansetzen.
3. Verwende synthetische Fixtures. Reale Personen-, Kunden-, Wallet-, Browser-
   oder Gesundheitsdaten sind nicht zulässig.
4. Prüfe geänderte Links und Beispiele. Für Codeänderungen führe die Tests des
   Astes aus. Vor Aufnahme in einen Release läuft zusätzlich `npm test` im
   Repository-Root. Notiere im Pull Request, was tatsächlich geprüft wurde.
5. Aktualisiere den Katalog nur, wenn sich Reifegrad oder Claim-Grenze ändert.

## Neue Äste

Ein neuer Ast benötigt:

- eine öffentliche Forschungsfrage
- Herkunft als neu verfasster, rechtlich veröffentlichbarer Ableger
- `OBSERVED`, `INFERRED`, `UNKNOWN` und `NOT_PROVEN`, soweit passend
- einen kleinsten sicheren Reproduktionsschritt
- offene Aufgaben und einen Reopen-Trigger
- Lizenz- und Quellenhinweise

Keine Datei aus einem privaten Archiv soll direkt kopiert werden. Schreibe den
öffentlichen Ast neu und übernimm nur die minimal nötige, überprüfte Logik.

## Einen Pull Request vorbereiten

1. Erstelle in deinem Fork einen Branch für eine zusammengehörige Änderung.
2. Beschreibe Problem, Änderung und Ergebnis so, dass neue Leser folgen können.
3. Nenne Quellen und die Rechte an übernommenem Material. Prüfe die betroffenen
   Pfade in [`LICENSES.md`](LICENSES.md). Bringe nur Beiträge ein, die unter
   den passenden Bedingungen veröffentlicht werden dürfen; abweichende
   Rechtebedingungen müssen vor der Übernahme geklärt werden.
4. Benenne Hilfsmittel wie KI dort, wo sie zum Verständnis der Änderung helfen.
   Prüfe erzeugte Aussagen, Code und Quellen selbst. Ein Generatorname ersetzt
   keine Rechte- oder Funktionsprüfung.
5. Verwende die Pull-Request-Vorlage und trenne bestandene Prüfungen von noch
   offenen Fragen. Die Pflege von Katalog, positiver Dateiliste und
   Release-Prüfungen erfolgt vor dem Merge passend zur Änderung.

## Anerkennung und Zusammenarbeit

Beschreibe deinen eigenen Beitrag und die gewünschte öffentliche Zuschreibung.
Ein GitHub-Name oder Pseudonym reicht aus. Private Namen anderer Personen
werden nicht beiläufig zu Mitwirkenden erklärt.

Eine gesonderte Zusammenarbeit kann Material, Leistung, Namensnennung,
Vergütung, Beteiligung und Rechteumfang ausdrücklich vereinbaren. Ein Issue,
Fork, Stern oder Pull Request allein erzeugt keine solche Zusage. Bereits
erteilte Freigaben werden durch diese Einladung nicht nachträglich erweitert
oder eingeschränkt. Die Einzelheiten stehen in
[Rechte & Nutzung](wiki/Rechte-und-Nutzung.md).

## Umgang miteinander

Diskutiere die Aussage und ihre Quellen. Frage nach, wenn der Bezug unklar ist.
Gegenmodelle, verständliche Kritik und sichtbare Korrekturen sind Teil der
Arbeit. Verzichte auf persönliche Herabsetzungen, Drohungen und private
Angaben über andere. Ein offener Prüfstand ist ein zulässiges Ergebnis.

## Sicherheitsfunde

Veröffentliche keine Zugangsdaten oder unmittelbar ausnutzbaren Details in
Issues. Nutze den privaten Meldeweg in [`SECURITY.md`](SECURITY.md).
