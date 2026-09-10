# De-identified Self-Observation Protocol

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

## Öffentliche Forschungsfrage

Wie kann ein leeres Eigenbeobachtungsschema Messbedingungen und Unsicherheit
sichtbar machen, ohne private Gesundheitsdaten oder medizinische Aussagen zu
veröffentlichen?

Stand: `FINITE_SNAPSHOT`

## Datenschutzgrenze

Dieses Repository enthält nur das leere Schema
[`schema.json`](schema.json). De-Identifikation garantiert keine Anonymität.
Reale Einträge, Freitext, genaue Zeit- und Ortsdaten, Diagnosen, Medikamente,
Fotos, Stimmen und kombinierbare Identifikatoren gehören nicht in öffentliche
Forks.

Die europäische Datenschutz-Grundverordnung verlangt unter anderem
Zweckbindung und Datenminimierung. Für patientenberichtete Zielgrößen behandelt
die FDA einen Fragebogen zusammen mit seiner Dokumentation als Instrument;
ein loses Tagebuch ist daher nicht automatisch ein validiertes Maß.

Quellen:

- [EU-Verordnung 2016/679, Artikel 5](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)
- [FDA guidance on patient-reported outcome measures](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/patient-reported-outcome-measures-use-medical-product-development-support-labeling-claims)

## OBSERVED

Das Schema kann festhalten, welche Variable eine Person zu welchem relativen
Zeitpunkt mit welcher Methode und welchem Abdeckungsstatus dokumentieren
möchte.

## INFERRED

Muster in Eigenbeobachtungen können Fragen erzeugen. Sie sind ohne geeignete
Studie keine Diagnose, Wirksamkeitsprüfung oder Kausalitätsaussage.

## UNKNOWN

- Validität und Zuverlässigkeit eines späteren Instruments
- Einfluss von Erwartung, Auswahl, Erinnerung und fehlenden Einträgen
- Übertragbarkeit über eine Person oder Situation hinaus

## NOT_PROVEN

Das Schema belegt keine Erkrankung, Behandlung, Nebenwirkung, Heilung oder
medizinische Produktaussage.

## Fortsetzungsaufgaben

- Datenminimierungsprüfung für jeden vorgeschlagenen Feldtyp schreiben.
- Synthetische Missingness-Szenarien erstellen.
- Eine lokale Verschlüsselungs- und Löschstrategie außerhalb dieses
  öffentlichen Repositories entwerfen.
- Vor jeder Forschung mit realen Personen Ethik, Einwilligung und fachliche
  Methodik separat prüfen.

Reopen-Trigger: Ein ethisch und fachlich geprüftes Protokoll mit eindeutigem
Zweck, Population, Messmethode und Datenschutzkonzept.

