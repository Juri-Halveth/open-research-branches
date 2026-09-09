# Prämissen-Firewall: Keine voreiligen Schlüsse

Patch-ID: `ASTER-PREMISE-FIREWALL-20260909`
Status: `PUBLIC_DERIVATIVE`

Eine Frage öffnet einen Prüfweg. Sie trägt ihr Ergebnis nicht schon in sich.

## Die neun Sperren

| Sichtbares Element | Zulässiger erster Stand | Nicht automatisch enthalten |
| --- | --- | --- |
| `?` | `QUESTION_OPENED` | Behauptung, Zustimmung oder Ergebnis |
| Chat-Ausschnitt | `DISPLAYED_EXCERPT` | vollständiger Gesprächskontext |
| sichtbarer Name | `DISPLAY_LABEL` | authentisierte Personenidentität |
| angezeigte Uhrzeit | `DISPLAYED_TIME` | unabhängig bestätigte Ereigniszeit |
| keine Gesprächsbeendigung | `CONTINUATION_OBSERVED` | Interesse, Einverständnis oder Ablehnung |
| gleiche oder ähnliche Buchstaben | `STRING_RELATION_CANDIDATE` | gleicher Referent oder gleiche Person |
| zeitliche Nähe | `TEMPORAL_PROXIMITY` | Ursache oder Übertragung |
| Wort „Plagiat“ | `ALLEGATION_OR_LABEL` | fachliche oder rechtliche Feststellung |
| Geldbetrag | `NUMBER_WITH_STATED_CONTEXT` | Gesamtwert, Schuld oder Anspruch |

## Prüfoperator

Vor jedem Schluss werden fünf Felder gebunden:

1. **Prämisse:** Was liegt wirklich vor?
2. **Scope:** Auf welchen Ausschnitt bezieht es sich?
3. **Brücke:** Welche Regel soll daraus einen neuen Satz machen?
4. **Alternative:** Welche andere Erklärung passt ebenfalls?
5. **Entscheider:** Welche neue Beobachtung trennt die Möglichkeiten?

Fehlt eines dieser Felder, bleibt das Ergebnis `OPEN_WITHOUT_CONCLUSION`.

## Anwendung auf `K → C`

`Kevin → Cevin` belegt nach Ausführung die neue Zeichenfolge. Es belegt keine
Personenidentität, Aussprache oder globale Gleichheit von K und C. `Celvin`
benötigt sogar eine zweite sichtbare Operation, weil zusätzlich ein `l`
eingefügt wird.

## Anwendung auf den Navier–Stokes-Audit

Das Wort „Plagiat“, der Start nach einem Gerücht und die zeitliche Nähe öffnen
eine ernste Provenienzprüfung. Sie ersetzen weder den Vergleich der Beweise
noch Zugriffsprotokolle, Produkt- und Trainingseinstellungen, eine fachliche
Integritätsentscheidung oder die Prüfung eines konkreten Rechtsanspruchs.

## Claim Ceiling

`QUESTION_AND_DISPLAY_STATE_PRESERVED_WITHOUT_AUTOMATIC_IDENTITY_CAUSALITY_CONSENT_OR_LEGAL_CONCLUSION`
