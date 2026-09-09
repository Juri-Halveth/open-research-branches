# Publication Policy

## Zweck

Das Archiv macht überprüfbare Nebenäste fortsetzbar, ohne private Quellarchive
zu spiegeln. Aufnahme erfolgt ausschließlich über eine positive Dateiliste in
einen neuen Export mit frischer Historie.

## Zulässiges Material

Ein Ast darf veröffentlicht werden, wenn alle folgenden Punkte belegt sind:

1. Er ist ein neu geschriebener oder einzeln geprüfter Ableger.
2. Er enthält keine Secrets, Sitzungsdaten oder privaten Identifikatoren.
3. Code, Text, Daten und Assets besitzen eine klare Rechte- und Lizenzlage.
4. Aktive Hauptprojekte und laufende koordinierte Meldungen sind nicht berührt.
5. Beispiele sind synthetisch, öffentlich lizenziert oder ausdrücklich zur
   Veröffentlichung freigegeben.
6. Beobachtung, Schlussfolgerung, Unbekanntes und Nichtbelegtes sind getrennt.
7. Tests und ein lokaler Pre-Publish-Scan laufen ohne Befund.

Ein ausdrücklich zur Veröffentlichung freigegebener Name wird nur als exakter
Text und nur in den einzeln genannten Dateien zugelassen. Diese engen
Freigaben stehen in
[`catalog/public-identities.json`](catalog/public-identities.json). Sie öffnen
keine allgemeine Ausnahme für Konten, Pfade, Kontaktangaben oder weitere
Identitäten.

## Nicht zulässiges Material

Folgende Klassen werden nicht in dieses Repository übernommen:

- private Gedanken-, Chat-, Sprach-, Traum- oder Identitätsarchive
- private Rachel-, Verachel-, Persona- oder Plugin-Interna
- Passwörter, Tokens, Cookies, Schlüssel, `.env`-Dateien oder Zugangscodes
- Wallet-, Browser-, DevTools-, Session- oder rohe Transaktionsspuren
- Gesundheits-, Genom-, Rechts-, Versicherungs-, Beschäftigungs- oder
  Behördenakten mit realen Personenbezügen
- private Portaltexte, Vendor-Kommunikation oder Rohbeweise aus
  Sicherheitsmeldungen
- operative Exploitketten, Payloads oder schadensfähige Automatisierung
- aktive Hauptprojekte, Kundendateien oder Geschäftsgeheimnisse
- fremde Dateien ohne dokumentierte Weitergaberechte

## Claim-Zustände

Jeder Forschungsast verwendet, soweit sachlich passend, diese Zustände:

- `OBSERVED`: innerhalb des benannten Tests oder der benannten Quelle direkt
  festgestellt
- `STRONGLY_SUPPORTED`: mehrere passende Belege stützen die Aussage
- `INFERRED`: nachvollziehbare Auslegung, aber keine direkte Beobachtung
- `UNKNOWN`: mit der vorhandenen Abdeckung nicht entschieden
- `NOT_PROVEN`: ausdrücklich nicht durch den vorliegenden Ast belegt

`FINITE_SNAPSHOT` bedeutet einen endlichen, wieder öffnungsfähigen Stand und
keine Vollständigkeitsbehauptung.

## Release-Gates

Vor jeder Veröffentlichung werden Katalogkonsistenz, Tests, lokale Pfade,
Identitätsreste, Secrets, Lizenzhinweise, Binärmetadaten und manuell die
gerenderten Dokumente geprüft. Ein automatischer Scan ersetzt keine
Kontextprüfung.

Der Scanner entfernt ausschließlich die in `catalog/public-identities.json`
dateigebunden freigegebenen exakten Namen aus seiner Prüfansicht. Alle übrigen
Identitätsmarker und sämtliche E-Mail-Adressen bleiben aktive Befunde.

Die positive Dateiliste liegt in
[`catalog/public-files.txt`](catalog/public-files.txt). Der Release-Gate
vergleicht diese Liste exakt mit dem Git-Index und scannt ausschließlich diese
gebundene Veröffentlichungsmenge. Binäre Dokumente werden ohne eigenen
Metadaten- und Inhaltsprüfer abgelehnt.

Bereits öffentlich lizenzierte Hauptprojekte werden verlinkt und nicht in
diese Historie kopiert.
