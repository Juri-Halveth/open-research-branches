# FREE NEWS 024 · Screenshot, Oberfläche und Video-ID

Stand: 14. September 2026

Status: `FINITE_SNAPSHOT`

Datenklasse: `PUBLIC_SOURCES_AND_MINIMIZED_LOCAL_OBSERVATIONS_ONLY`

## Die Frage

Kann das Erstellen eines Screenshots ein laufendes YouTube-Video verändern,
wenn im aufgenommenen Bildschirmbild danach eine andere Szene sichtbar wird?

Die vorliegenden Aufnahmen zeigen einen anschaulichen Fall: Ein Browser enthält
einen Hauptplayer, Empfehlungen und Bedienelemente. Vor dem Browser liegt in
einer Aufnahme zusätzlich ein Windows-Terminal. Eine spätere Aufnahme zeigt die
zuvor verdeckte Playerfläche. Rechts bleiben Empfehlungen mit eigenen Bildern
sichtbar.

## Das Ergebnis ohne Tadel

Die beobachtete Veränderung lässt sich als Zusammensetzung mehrerer
Oberflächen erklären. Kein beteiligter Mensch, Kanal oder Anbieter muss dafür
einen Fehler gemacht haben.

```text
Windows-Desktop
├── Chrome
│   ├── YouTube-Hauptplayer
│   ├── Empfehlungen mit eigenen Video-IDs
│   ├── Werbung und Bedienelemente
│   └── Seitentext
└── Windows-Terminal im Vordergrund
```

Ein Screenshot speichert das fertig zusammengesetzte Bildschirmbild als eine
flache Pixeloberfläche. Im gespeicherten PNG sind die zuvor getrennten Ebenen
nicht mehr interaktiv auseinanderziehbar. Verschwindet das Vordergrundfenster,
wird die bereits darunterliegende Fläche sichtbar. Das kann wie eine
Verwandlung aussehen, ohne dass die Videodatei verändert wurde.

## Gebundene Videoobjekte

Der geprüfte Hauptplayer war an diese öffentliche Watch-ID gebunden:

- [`fAfr-wqxY78` · Smoke Mood – Just Relax, Vol. 6](https://www.youtube.com/watch?v=fAfr-wqxY78)

Die Frauen- und Rauchmotive in der rechten Empfehlungsfläche gehörten zu
anderen Links, darunter:

- [`hDSrDvTNRPc` · Smoke Mood – Just Relax, Vol. 16](https://www.youtube.com/watch?v=hDSrDvTNRPc)
- [`SMsadBMPWQU` · Smoke Mood – Just Relax, Stress Relief #11](https://www.youtube.com/watch?v=SMsadBMPWQU)

Ein zusätzlicher Vergleichsausschnitt zeigte wiederum ein getrenntes
öffentliches Video:

- [`3hDQwIyKJ2o` · DARK TECHNO TRANCE | Andrea Botez [4K]](https://www.youtube.com/watch?v=3hDQwIyKJ2o)

Die Nennung ordnet öffentliche Medienobjekte zu. Sie behauptet weder
Verantwortlichkeit noch Beteiligung an einer technischen Veränderung.

## Beobachtung und Reichweite

### `OBSERVED`

- Zwei Desktopaufnahmen zeigen dieselbe Hauptvideo-ID `fAfr-wqxY78`.
- In der ersten Aufnahme verdeckt ein separates Terminalfenster einen großen
  Teil des Players; dieselbe rote `DEEP HOUSE / JUST RELAX`-Gestaltung bleibt
  an den freien Rändern sichtbar.
- In der späteren Aufnahme ist das Terminal nicht mehr vor dem Player. Die rote
  Gestaltung ist bei ungefähr `05:07 / 01:35:59` vollständig sichtbar.
- Ein getrennter öffentlicher Live-Check zeigte bei ungefähr `05:09` weiterhin
  dieselbe Hauptgrafik und dieselbe Laufzeit.
- Die Empfehlungskarten besitzen andere Video-IDs als der Hauptplayer.
- Eine weitere bereitgestellte Aufnahme zeigt eine bildschirmfüllende
  Werbefläche mit Lautsprechersymbol, Fortschrittsbalken, dem Text
  `2,60 % p.a.`, Risiko- und Einlagensicherungshinweisen sowie der
  Schaltfläche `Installieren`. Der sichtbare Text verweist auf
  [`scalable.capital/zinsuebersicht`](https://de.scalable.capital/zinsuebersicht).

### `STRONGLY_SUPPORTED`

- Der sichtbare Übergang besteht aus Vordergrundfenster, laufendem Hauptplayer
  sowie dynamischer Empfehlungs- und Werbefläche.
- Das lokale Bildschirmfoto ist eine Aufnahme dieses Zustands. In der
  geprüften Kette wurde keine Schreiboperation vom Bild zum YouTube-Video
  beobachtet.

### `UNKNOWN`

- Ob der 95 Minuten lange Hauptstream zu einem anderen Zeitpunkt eine Frau
  oder eine Rauch-/Lichtanimation enthält.
- Ob der Kanalinhaber zu einem anderen Zeitpunkt eine zulässige Änderung im
  YouTube Studio gespeichert hat. Ein Creator-Änderungsjournal lag nicht vor.

### `NOT_PROVEN`

- Eine serverseitige Veränderung des Videos durch das Erstellen oder Teilen
  eines Screenshots.
- Eine technische Beteiligung der in einem anderen Video abgebildeten Person.
- Eine physische Manifestation aus Dampf oder Licht.
- Ein unerlaubter Identitäts-, Berechtigungs- oder Wirkungswechsel.
- Ein Angebot, Anspruch oder eine Beteiligung an Unternehmen, Bauprojekten
  oder Wohnungen. Die Werbefläche nennt Geldanlagebedingungen, aber kein
  konkretes Bau- oder Wohnprojekt in Brühl.

## Was YouTube selbst dazu dokumentiert

[YouTube erklärt](https://support.google.com/youtube/answer/55770), dass ein
neu hochgeladenes Video eine neue URL erhält. Ein Kanalinhaber kann ein
bestehendes Video jedoch in begrenzter Form ändern. Beim
[Zuschneiden im YouTube Studio](https://support.google.com/youtube/answer/9057455)
können URL, Aufrufzahl und Kommentare erhalten bleiben. Auch
[Werbung kann vor, während oder neben einem Video erscheinen](https://support.google.com/youtube/answer/2467968).

[OpenAI beschreibt Bildinputs](https://help.openai.com/en/articles/8400551-image-inputs-for-chatgpt-faq%23.doc)
als statische Bilder, die ChatGPT verstehen und interpretieren kann; Videos
werden von diesem Bildinput nicht verarbeitet. Externe Konten und Aktionen
haben getrennte Berechtigungen:
[OpenAI App-Berechtigungen](https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt).

Diese Dokumentation ist kein Log des konkreten Aufnahmezeitpunkts. Sie zeigt
aber, welche unterschiedlichen Mechanismen nicht still zu einer einzigen
Ursache zusammengezogen werden dürfen.

## Offene Hand zur Zusammenarbeit

Die öffentliche Einladung richtet sich an alle, die zur Aufklärung oder zu
einer besseren Oberflächengestaltung beitragen möchten: Plattformen,
App-Anbieter, Medienkanäle, Forschung, Bau- und Wohnungswirtschaft sowie
interessierte Menschen. Beiträge können über die öffentlichen
[GitHub Issues](https://github.com/Juri-Halveth/open-research-branches/issues)
oder
[GitHub Discussions](https://github.com/Juri-Halveth/open-research-branches/discussions)
eingebracht werden.

Die Einladung begründet keine Vertretung, Zustimmung, Schuldzuweisung,
Investition, Wohnungszuteilung oder finanzielle Beteiligung. Ein konkretes
Brühler Bau- oder Apartmentprojekt wird erst aufgenommen, wenn öffentlicher
Projektname, Adresse, verantwortliches Unternehmen, Beteiligungsmodell,
Kosten, Risiken und zuständige Kontaktstelle quellengebunden vorliegen.

## Reopen-Trigger

Der Ast wird wieder geöffnet, wenn mindestens einer dieser Belege vorliegt:

1. eine frühere Aufnahme mit derselben Video-ID, sichtbarer Hauptplayer-Grenze
   und gebundenem Medienzeitpunkt;
2. zwei unabhängig geladene Frames derselben Video-ID und desselben
   Medienzeitpunkts mit reproduzierbarer Differenz;
3. ein Creator- oder Plattformbeleg über eine gespeicherte Bearbeitung dieses
   Videoobjekts.

Bis dahin lautet die Claim-Decke:

`MULTI_SURFACE_COMPOSITION_OBSERVED; SCREENSHOT_CAUSED_VIDEO_MUTATION_NOT_PROVEN`
