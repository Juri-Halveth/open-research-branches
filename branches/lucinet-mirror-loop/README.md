# LUCINET Mirror Loop · synthetischer Demonstrator

[Herkunft des August-Bilds](../../reports/LUCINET_MIRROR_AUGUST_PROVENANCE_2026-10-16.md) · [Punktfolge als HTML](index.html) · [Apfel/Schatten als HTML](scene.html) · [Quellcode](model.mjs)

Das Bild vom 8. August 2026 zeigt einen lokalen Spiegel und eine Projektion.
Dieser spätere, separat datierte Ast setzt **einen** kleinen Teil davon als
ausführbaren Ablauf um: eine gegebene Punktfolge lesen, zwei Vorhersagen
berechnen, beide mit derselben neu aufgedeckten Beobachtung vergleichen und
danach einen neuen Prognosepunkt ausgeben. Die Grafik verwendet frei erfundene
Koordinaten. Sie übernimmt weder Bildpixel noch private Chat- oder
Screenshot-Daten.

## Reproduzieren

Node.js 20 oder neuer:

```sh
node --test model.test.mjs
node --test scene.test.mjs
node serve.mjs
```

Der Server bindet nur an `127.0.0.1` und meldet einen freien lokalen Port.
Die Ansicht führt keine ausgehenden Requests aus. `model.mjs` selbst ist eine
reine Berechnung ohne Datei-, Netzwerk- oder Gerätezutritt. Der Server
liefert ausschließlich die zwei HTML-Ansichten und ihre zwei `.mjs`-Module.
Die Apfelansicht liegt unter `/scene.html` am selben lokalen Port.

Nach dem Aufdecken einer Schattenbeobachtung kann die Apfelansicht einen lokalen
JSON-Beleg herunterladen. Er nennt die feste Quelle, beide vorherigen
Projektionen, dasselbe Auswahlmaß, den gewählten Kandidaten und die neue
Projektion. Vor dem zweiten Klick ist die Folgebeobachtung ausdrücklich
`PENDING_NOT_OBSERVED`; danach enthält der Beleg auch deren Fehlerwert. Beide
Beobachtungen stammen aus festen synthetischen Fixtures desselben Autors. Der
Beleg enthält keine frei eingegebenen Daten und keinen Zeitstempel; er ist ein
nachrechenbares Protokoll dieses Demonstrators, kein unabhängiger Wirkungsbeweis.
Der kleine Offline-Prüfer rechnet die festgelegte v1-Arithmetik aus dem
heruntergeladenen JSON nochmals durch:

```powershell
node branches/lucinet-mirror-loop/verify-scene-receipt.mjs C:\Pfad\zum\lucinet-synthetic-scene-receipt-v1-left-observed.json
```

Ein `PASS` bestätigt nur die Felder und Arithmetik dieser eingebauten
synthetischen Fixtures, weder Urheberschaft noch Datum oder Außenwirkung.
Zwei fest eingecheckte Beispiele zeigen beide Auswahlrichtungen:
[links](examples/synthetic-left-observed.v1.json) und
[rechts](examples/synthetic-right-observed.v1.json). Beide bestehen denselben
Offline-Prüfer und sind ausdrücklich keine Messungen einer Außenwelt.

Die [Lizenzkarte](../../LICENSES.md) enthält den prospektiven HALVETH-2.0-Cutover
für neue Originalbeiträge. Die generische MIT-Zeile für ältere `branches/`-Dateien
ist für diesen neu veröffentlichten Demonstrator allein keine Lizenzzusage.

## Gebundener Ablauf

| Objekt | Hier konkret | Evidenzzustand |
| --- | --- | --- |
| `SOURCE_SNAPSHOT` | `SYNTHETIC_TRACE`, sieben erfundene `{x,y}`-Punkte | `OBSERVED` als Quellcodebytes, reale Herkunft `NOT_APPLICABLE` |
| `OBSERVED_SURFACE` | Vom Regler freigegebener Präfix bis O3, O4 oder O5 | `OBSERVED` nur im lokalen Lauf |
| `M1` | Nächste Position bei konstanter letzter Verschiebung | `MODEL` |
| `M2` | Nächste Position bei fortgesetzter letzter Verschiebungsänderung | `MODEL` |
| `ORACLE` | `euclidean-squared-error-v1`; beide Prognosen gegen denselben freigegebenen Punkt | `OBSERVED` im lokalen Test |
| `PROJECTION` | Prognose des Modells mit dem kleineren Fehler | `CANDIDATE_UNTIL_NEW_OBSERVATION` |

M1 und M2 lesen denselben Quellpräfix, aber nie gegenseitig ihre Ergebnisse.
Der verglichene Punkt wird erst nach beiden Vorhersagen zum Oracle gegeben.
Alle erfundenen Fixture-Punkte sind im ausgelieferten Quellcode lesbar; der
Rückhalt gilt für die Argumente der Modellfunktionen und die sichtbare Ansicht,
nicht als manipulationssicherer Blindtest.
Bei O4 prognostiziert M1 `(4,2)` und M2 `(4,3)`; die synthetische Beobachtung
ist `(4,3)`. M2 hat Fehlerquadrat `0`, M1 `1`. Mit O4 als neuer Beobachtung
projiziert M2 O5 als `(5,5)`. Erst das anschließende Aufdecken von O5 kann
diese Prognose innerhalb der synthetischen Folge prüfen.

Das ist eine **lokale Modellentscheidung**, keine Rekonstruktion einer
verdeckten Weltursache. Bei anderer Quelle oder anderem Fehlermaß kann eine
andere Auswahl entstehen. Auch ein passender Punkt beweist keine allgemeinen
Naturgesetze, Raumzeitreise, Produktreife oder Produktionsäquivalenz.

Die zweite, separat geschriebene synthetische Folge stabilisiert ihren Kurs:
Bei O3 sagt M1 `(3,5)` und M2 `(3,6)` voraus; beobachtet wird `(3,5)`.
Unter demselben zuvor festgelegten Oracle gewinnt diesmal M1 mit Fehlerquadrat
`0` gegen `1`. Der Regler zeigt beide Fälle, ohne die Auswahlregel zu ändern.

## Zweiter Lauf: Text, Mini-IR, Apfel und Schatten

`scene.mjs` akzeptiert ausschließlich den erfundenen Text
`object:apple; color:red; light:?`. Sein Parser gibt eine fest definierte
Mini-Struktur aus: roter Apfel und zwei Kandidaten für die unbekannte
Lichtrichtung. Er behauptet keine freie Sprachverarbeitung. Beide Kandidaten
projizieren den Apfel an dieselbe Position und einen Schatten um 42 Einheiten
nach rechts oder links. Das vorab festgelegte Oracle ist das Fehlerquadrat des
Schattenmittelpunkts gegen eine synthetische Beobachtung. Nach der Auswahl
wird der Apfel verschoben und ein neuer Schatten als Prognose gerendert.

Die zweite Ansicht kann beide möglichen synthetischen Beobachtungen aufdecken:
rechts wählt Licht von links, links wählt Licht von rechts. Der nächste
Bildkandidat bleibt bis zur nächsten Beobachtung ein Modelloutput. Es gibt
keinen Pixelabgleich mit einem realen Foto und keine Rekonstruktion eines
physischen Apfels. Der Abschnitt ist näher an der Text–Semantik–Struktur–Bild-
Idee im August-Entwurf, aber keine vollständige Umsetzung dieser Architektur.

Ein zweiter Knopf deckt je nach gewähltem Modell den vorgegebenen nächsten
synthetischen Schatten auf und berechnet seinen Fehler gegen die zuvor
angezeigte Projektion. Beide Fixtures stammen aus derselben lokalen
Autorschaft; ein Treffer ist keine unabhängige Bestätigung an einer Außenquelle.

## Getrennter Messdaten-Benchmark

Der [NOAA-Pegelvergleich](../../reports/LUCINET_NOAA_ROLLING_BENCHMARK_2026-10-16.md)
wendet dieselben beiden festen Rechenformeln außerhalb dieser HTML-Ansicht auf
zwölf vorab bestimmte historische Messfenster an. Er zeigt pro Fenster beide
Fehler und zwei Fehlwahlen der einfachen Auswahlregel. Die Daten kommen aus
einem separaten, nur lesenden Abruf; die HTML-Ansicht selbst sendet weiterhin
keine Netzwerkanfragen. Der Benchmark ist ein rollierender Ein-Stunden-Test mit
neuen Messwerten zwischen den Prognosen und kein freilaufender 24-Stunden-Forecast.

## Nächste unterscheidende Kanten

1. Eine zweite synthetische Folge mit anderer Bewegungsregel aus unabhängiger
   Fixture-Provenienz verwenden. Beide Modelle mit demselben Oracle prüfen.
2. Eine echte Quelle nur mit expliziter Acquisition-, Privacy-, Zeit- und
   Coverage-Bindung anschließen; Rohdaten bleiben außerhalb des öffentlichen
   Archivs.
3. Für reale Bilder eine getrennte, versionierte Projektion und eine gebundene
   Pixel-/Geometrievergleichsregel definieren. Die vorhandene
   [Pixelvergleichsbranche](../pixel-region-change-observer/README.md) kann
   dafür eine beschränkte, rein synthetische Beobachtungsbasis sein.

**Claim ceiling:** `LOCAL_PREDICTION_COMPARISON_ON_SUPPLIED_SYNTHETIC_POINTS`.
**Stand:** `BEHAVIORAL_SHADOW` dieses kleinen Rechenmodells, kein voller
LUCINET-Klon. **Reopen-Trigger:** eine separat provenienzierte Folge oder ein
autorisiert gebundener realer Beobachtungsadapter mit definiertem Oracle.
