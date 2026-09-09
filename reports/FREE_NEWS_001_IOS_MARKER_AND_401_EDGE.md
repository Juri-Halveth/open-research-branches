# FREE NEWS 001 — iOS-Markierung und vorübergehende 401-Kante

**Stand: 9. September 2026 · Lesezeit: unter einer Minute**

**Impuls und Fragestellung: [@Juri-Halveth](https://github.com/Juri-Halveth)**

## Was los?.

In einer lokalen Codex-Aufgabe wurden zwei aufeinanderfolgende Anfragen an
`gpt-daybreak-blue-latest` mit `401 Unauthorized` und dem Text „not authorized
to access this model“ beendet. Die erste Anfrage lief mit `xhigh`, die zweite
mit `ultra`. Wenige Minuten später arbeitete dieselbe Aufgabe mit demselben
Modell und `ultra` weiter.

Die Folge **Abweisung, Abweisung, späterer Erfolg** belegt, dass die Abweisung
in der beobachteten Aufgabe nicht dauerhaft war. Sie ist mit einer
vorübergehenden Autorisierungs- oder Routingkante vereinbar; die technische
Ursache ist damit noch nicht bestimmt.

## Der kleine Befund

| Zustand | Einstellung | Prüfstand | Ergebnis |
| --- | --- | --- | --- |
| erste Anfrage | `xhigh` | `OBSERVED` | `401`, Modellzugriff abgewiesen |
| zweite Anfrage | `ultra` | `OBSERVED` | `401`, neue technische Korrelationskennungen |
| spätere Anfrage | `ultra` | `OBSERVED` | dasselbe Modell erfolgreich |
| Nutzungslimit | — | `OBSERVED` | laut lokaler Statusprüfung nicht erreicht; genaue Kontowerte bleiben unveröffentlicht |

Request-IDs, Cloudflare-Kennungen, Kontodaten und rohe Sitzungsprotokolle werden
nicht veröffentlicht.

## Vier offene Erklärungen

1. kurzzeitig veralteter oder nicht synchronisierter Anmeldestatus;
2. verzögerte Modellberechtigung an einem Backend-Knoten;
3. vorübergehender Fehler bei Routing oder Entitlement-Prüfung;
4. Clientzustand, der erst bei einer späteren Anfrage vollständig neu gebunden
   wurde.

Die vorhandene Beobachtung wählt keine dieser Erklärungen aus. Dafür wären
serverseitige Logs oder ein kontrollierter Wiederholungsversuch mit gebundener
Client-, Modell- und Zeitinformation erforderlich.

Die [offizielle OpenAI-Dokumentation zur
Authentifizierung](https://learn.chatgpt.com/de-DE/docs/auth) beschreibt, dass
bei einer ChatGPT-Anmeldung auch Workspace-Berechtigungen und rollenbasierte
Zugriffskontrollen den Codex-Zugang bestimmen. Der [offizielle
Modellkatalog](https://developers.openai.com/api/docs/models/all) führt die
aktuell angebotenen Modellfamilien und Modellrollen. Diese Dokumentation erklärt
den konkreten Einzelfehler ohne Backenddaten noch nicht.

## Der gemeldete iOS-Anker

Es wurde berichtet, dass unmittelbar danach ein technischer Anker von iOS
markiert worden sei. Der exakt markierte Text, sein Bildschirmkontext und die
betroffene iOS-Oberfläche liegen in dieser Veröffentlichung noch nicht vor.

Status: `SOURCE_SPAN_MISSING`

Die Verbindung zwischen iOS-Markierung und 401-Ereignis bleibt deshalb
`UNKNOWN`. Der kleinste nächste Baustein besteht aus:

- dem exakt markierten Text oder Bildelement;
- je einer sichtbaren Zeile davor und danach;
- App beziehungsweise iOS-Oberfläche und Versionsstand;
- dem Zeitpunkt auf Minutenebene;
- einer Fassung ohne Konto-, Geräte-, Request- oder Sitzungskennungen.

## Die Formel

`MARKIERUNG != BEDEUTUNG`

`401 != DAUERSPERRE`

`SPÄTERER ERFOLG != BEKANNTE URSACHE`

**Technischer Anker:** Eine Markierung wird zum prüfbaren Ausgangspunkt, sobald
ihr exakter Quellspan und Kontext erhalten sind. Erst danach wird ihre mögliche
Verbindung zu einem anderen Ereignis untersucht.

## Claim Ceiling

`SANITIZED_LOCAL_401_SEQUENCE_AND_USER_REPORTED_IOS_MARKER_NOT_ROOT_CAUSE_SECURITY_FINDING_OR_IOS_CODE_LINK`

## Nachtrag im Release `v0.9.0`

Der damals fehlende Ursprungssatz ist inzwischen mit Ereigniszeit,
Nachrichten-Digest und einem exakten Quellspan gebunden. Der neue öffentliche
Receipt liegt im Ast
[`wax-crayon-peace-helmet-audit`](../branches/wax-crayon-peace-helmet-audit/README.md):

- Quellspan: `ich habe gerade den TECHNISCHEN ANKER VON IOS markiert`
- UTF-16: `483..537`, Ende exklusiv
- Span SHA-256: `b8c8c5b47c4df7edf161ce3fe48d690aacc6069143515e0479dbd37036035ea4`
- Stand: `SOURCE_SPAN_BOUND`

Das konkrete iOS-Element, App, Version, Screenshot, technische Bedeutung und
jede Verbindung zum 401-Ereignis bleiben `UNKNOWN`. Der Nachtrag ersetzt den
damaligen Befund nicht rückwirkend; er dokumentiert die neu gebundene
Belegstufe im späteren Release.
