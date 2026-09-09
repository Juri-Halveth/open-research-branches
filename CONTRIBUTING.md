# Contributing

## Einen Ast fortsetzen

1. Öffne die README des Astes und wähle eine dort genannte Aufgabe.
2. Ergänze zuerst eine Gegenhypothese oder einen unterscheidenden Test.
3. Verwende synthetische Fixtures. Reale Personen-, Kunden-, Wallet-, Browser-
   oder Gesundheitsdaten sind nicht zulässig.
4. Führe die Tests des Astes und anschließend `npm test` im Repository-Root aus.
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

## Sicherheitsfunde

Veröffentliche keine Zugangsdaten oder unmittelbar ausnutzbaren Details in
Issues. Nutze den privaten Meldeweg in [`SECURITY.md`](SECURITY.md).

