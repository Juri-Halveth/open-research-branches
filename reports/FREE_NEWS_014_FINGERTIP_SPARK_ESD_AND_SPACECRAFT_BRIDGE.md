# FREE NEWS 014 — Fünkchen an den Fingerspitzen

## Der reale Technikpfad zu ESD und Raumfahrtelektronik

Stand: `2026-09-10`<br>
Autor und Herausgeber: **Juri Janovski** (`@Juri-Halveth`)<br>
Datenklasse: `PUBLIC_SOURCE_AND_MINIMIZED_USER_REPORT_ONLY`<br>
Prüfstand: `FINITE_SNAPSHOT_WITH_PASSIVE_REOPEN_TRIGGER`

## Der Ausgangspunkt

Juri berichtet:

> „Fünktchen wie Thor an meinen Fingern.“

Der Audit übernimmt diesen Satz als `USER_REPORTED_OBSERVATION`. Er wird nicht
weggefiltert, nur weil noch kein Video oder Messgerät gebunden ist. Der Bericht
öffnet sofort die Prüfung:

```text
USER_REPORT -> OBSERVATION_PRESERVED -> REVIEW_OPEN
MECHANISM = UNKNOWN
```

Die Frage lautet anschließend präzise: Welche Modelle sagen bei Kontakt,
Abstand, Dauer, Ton, Material, Luftfeuchtigkeit, Kamerawinkel und Feldkontext
unterschiedliche Beobachtungen voraus?

## Die engste reale Raumfahrtbrücke

Die technische Kette ist:

```text
Ladungserzeugung
Feldverstärkung an einem Endpunkt
Schwellenereignis in Luft
Licht, Schall oder elektromagnetischer Impuls
Potentialausgleich
Schutz- und Messschicht
```

Das [NIST Technical Note 1314](https://nvlpubs.nist.gov/nistpubs/Legacy/TN/nbstechnicalnote1314.pdf)
beschreibt elektrostatische Aufladung, den schnellen Ladungstransfer durch den
Durchbruch von Luft und die abgestrahlten Felder einer Entladung. Der Bericht
nennt Reibung und Oberflächenbewegung, Material, Druck, Bewegungsrate und
Luftfeuchtigkeit als Faktoren der triboelektrischen Aufladung. Er zeigt auch,
dass ESD-Felder Elektronik stören können.

Das
[NASA ESD Compendium](https://sma.nasa.gov/docs/default-source/sma-disciplines-and-programs/quality/qlf/nasa-eee-parts_esd_compendium_june-2018-sept-18.pdf)
behandelt vom Menschen erzeugte elektrostatische Entladung als reales Risiko
für empfindliche elektronische Bauteile in der Luft- und Raumfahrt. Genau hier
liegt die belastbare Verbindung zur Raumfahrtelektronik: Ein Mensch kann Teil
der elektrischen Umgebung sein, gegen die Bauteile, Arbeitsplätze, Gehäuse und
Messketten ausgelegt werden.

Der daraus entstehende Forschungsbeitrag ist konkret: Die gemeldete
Fingerspitzenbeobachtung kann als Eingang für ein offenes Modell über
Ladungserzeugung, Endpunktfelder, Schwellen, Sensorik und ESD-Schutz dienen.
Der äußere Mechanismus des einzelnen Ereignisses ist damit noch offen.

## Die sechs Kandidaten

### 1. Kurze elektrostatische Entladung

Ein kurzer Impuls nahe einem leitenden Gegenstand oder kleinen Luftspalt, ein
Klick, ein Stich und anschließendes Verschwinden passen zu ESD. Das Modell wird
stärker, wenn Bewegung auf Teppich oder anderen Oberflächen vorausging und die
Umgebung trocken war. Es bleibt ein Kandidat, bis Abstand, Ziel, Zeit und Ton
gebunden sind.

### 2. Triboelektrische Voraufladung

Triboelektrik beschreibt die Ladungserzeugung durch Kontakt und Trennung von
Oberflächen. Sie erklärt einen möglichen Vorzustand, nicht automatisch den
sichtbaren Punkt. Boden, Kleidung, natürliche Bewegung und Luftfeuchtigkeit
sind deshalb Kontextvariablen und keine fertige Ereigniserklärung. Historische
Grundlagen enthält auch der NBS-Rundbrief
[Static Electricity](https://nvlpubs.nist.gov/nistpubs/Legacy/circ/nbscircular438.pdf).

### 3. Corona- oder Bürstenentladung

Corona kann als schwaches, wiederholtes oder anhaltendes Leuchten an Bereichen
hoher Feldstärke erscheinen. Die veröffentlichte
[Fingerspitzen-Corona-Studie](https://journals.sagepub.com/doi/10.1177/0040517509105599)
arbeitete jedoch mit einer kontrollierten Hochspannungsapparatur. Sie belegt,
dass solche Aufnahmen unter starkem Feld möglich sind; sie bindet keine
spontane gewöhnliche Raumsituation. Eine reale äußere Feldquelle wäre hier der
entscheidende fehlende Übergang.

### 4. St.-Elmo-artiger atmosphärischer Effekt

Der [National Weather Service](https://www.weather.gov/media/zhu/ZHU_Training_Page/lightning_stuff/lightning/lightning_facts2.pdf)
ordnet St. Elmo's Fire starken atmosphärischen elektrischen Feldern und
exponierten Punkten zu. Ohne gebundenen Wetter-, Orts- und Feldkontext bleibt
dieses Modell offen und schwach für eine gewöhnliche Innenraumszene.

### 5. Kamera- oder Lichtartefakt

[Sony](https://www.sony.com/electronics/support/articles/00344523) erklärt
Flare und Ghosting als Effekte von Lichtquelle, Linse und Aufnahmewinkel.
[NASA](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-are-webbs-full-color-images-made/)
zeigt bei Webb-Bildern, dass Detektorartefakte, kosmische Strahlung und
Bildverarbeitung bei hellen Punkten mitgedacht werden müssen. Das überträgt
nicht automatisch einen Webb-Mechanismus auf ein Telefon; es bindet die
allgemeine Prüfregel, Beobachtungskanal und Ereignis getrennt zu halten.

### 6. Ultraweak Photon Emission

Die PLOS-ONE-Arbeit
[Imaging of Ultraweak Spontaneous Photon Emission from Human Body Displaying Diurnal Rhythm](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0006256)
maß extrem schwache Körperemission mit empfindlicher Bildtechnik. Die
publizierte Intensität liegt weit unter der Empfindlichkeit des bloßen Auges.
Das ist ein reales Messgebiet, erklärt aber keinen ohne Kamera sichtbaren
Funken.

## Der passive Zwei-Kamera-Test

Der kleinste starke nächste Schritt braucht keine absichtliche Aufladung:

1. Zwei eigene oder ausdrücklich freigegebene Kameras stehen fest und sehen
   dieselbe Fingerspitzenregion aus verschiedenen Winkeln.
2. Ein fester Hintergrund und Raumton werden gleichzeitig aufgenommen.
3. Kameraeinstellungen, Zeitbasis, Winkel, natürliche Bewegung, Material,
   Luftfeuchtigkeit, Abstand zu Gegenständen, Klick, Stich und Dauer werden
   protokolliert.
4. Originaldateien bleiben lokal. Nach außen geht höchstens ein minimierter
   Hash- und Methoden-Receipt.

Nur eine Kamera oder eine feste Sensorkoordinate stärkt den Artefakt-Ast. Zwei
räumlich passende Ansichten dokumentieren ein Mehransichtsereignis, aber noch
nicht dessen Mechanismus. Ein zeitgleicher Klick nahe Kontakt stärkt den
ESD-Ast. Ein anhaltendes Leuchten ohne Kontakt verlangt die Prüfung einer
realen Feldquelle. Der Plan enthält ausdrücklich keine Hochspannung, keine
absichtliche statische Aufladung und keinen Gewitterversuch.

## Ausführbarer Audit

Der Quellcode erhält den Bericht auch ohne Vergleichsmaterial, weist
unbekannte Eingabefelder zurück und hält alle Modelle getrennt:

```bash
cd branches/fingertip-spark-esd-spacecraft-audit
npm test
npm run audit
```

Die Tests prüfen Bare Report, ESD-Merkmale, Tribo-Kontext, Corona mit und ohne
gebundene Feldquelle, atmosphärischen Kontext, Ein- und Zwei-Kamera-Szenarien,
die Intensitätsgrenze ultraschwacher Photonen und die vollständige
Anspruchsgrenze.

## Prüfstand

```text
PROVEN:
  ESD ist ein realer Schutz- und Störungsgegenstand empfindlicher Elektronik.
  NASA bindet diesen Gegenstand an Luft- und Raumfahrt-Elektronik.
  Mehrere reale Mechanismen sagen unterscheidbare Beobachtungen voraus.

OPEN:
  Mechanismus des von Juri berichteten einzelnen Ereignisses.
  Wiederholbarkeit und genaue Umgebungsbedingungen.
  Mehransichts-, Ton- und Zeitbeleg.

REOPEN:
  Natürliches neues Ereignis mit zwei festen Ansichten, lokal erhaltenen
  Originalen und gebundenem Kontext oder eine bessere Primärquelle.
```

## Claim Ceiling

`USER_REPORTED_OBSERVATION_PRESERVED_WITH_SOURCE_BOUND_COMPETING_MODELS_AND_ESD_SPACECRAFT_ELECTRONICS_ENGINEERING_BRIDGE_NOT_EVENT_MECHANISM_SPACECRAFT_TECHNOLOGY_OWNERSHIP_COPYING_EXTERNAL_CAUSAL_INFLUENCE_LEGAL_ENTITLEMENT_OR_PAYMENT_PROOF`
