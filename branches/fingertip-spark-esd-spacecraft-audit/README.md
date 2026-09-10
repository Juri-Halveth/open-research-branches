# Fünkchen an den Fingerspitzen × ESD × Raumfahrtelektronik

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

## Ein offener, ausführbarer Mechanismen-Audit

Juri berichtet: **„Fünktchen wie Thor an meinen Fingern.“** Dieser Ast erhält
die Aussage als `USER_REPORTED_OBSERVATION`. Ein Bericht öffnet die Prüfung
sofort. Video, Vergleichsdaten oder eine fertige Erklärung sind keine
Eintrittskarte.

Der aktuelle Stand ist:

```text
OBSERVATION = USER_REPORTED_OBSERVATION_PRESERVED
MECHANISM = UNKNOWN
SPACECRAFT_BRIDGE = SOURCE_BOUND_ESD_RISK_ANALOGY_ONLY
NEXT_SAFE_EDGE = PASSIVE_TWO_CAMERA_DIFFERENT_ANGLE_CAPTURE
```

Der wichtige reale Treffer liegt in der Technik: Elektrostatische Aufladung
eines Menschen, Feldverstärkung an Endpunkten, ein Schwellenereignis in Luft,
Licht/Schall/elektromagnetische Störung, Potentialausgleich und eine Schutz-
oder Messschicht bilden eine prüfbare Kette. NASA behandelt menschlich erzeugte
elektrostatische Entladung als Risiko für empfindliche Elektronik in der
Raumfahrt. Das macht die Beobachtung zu einer sinnvollen Forschungsroute für
ESD-Schutz und Sensorik.

## Sechs getrennte Modelle

| Modell | Was es vorhersagt | Entscheidender Unterschied |
| --- | --- | --- |
| `ESD_CONTACT_DISCHARGE` | kurzer Lichtimpuls nahe Kontakt oder kleinem Luftspalt; eventuell Klick oder Stich | Abstand, Zielobjekt und synchroner Ton |
| `TRIBOELECTRIC_PRECHARGE` | Bewegung und Materialkontakt bauen Ladung auf; die Aufladung selbst muss nicht leuchten | Feuchte, Boden, Kleidung und vorherige Bewegung |
| `CORONA_OR_BRUSH_DISCHARGE` | wiederholtes oder anhaltendes schwaches Leuchten ohne Metallkontakt | gebundene starke äußere Feldquelle |
| `ST_ELMO_ATMOSPHERIC_CORONA` | Leuchten an Spitzen in starkem atmosphärischem Feld | Wetter-, Orts- und Feldkontext |
| `CAMERA_OR_LIGHT_ARTIFACT` | Punkt ändert sich mit Winkel, bleibt an einer Sensorkoordinate oder erscheint nur in einer Kamera | zwei feste Kameras aus verschiedenen Winkeln |
| `ULTRAWEAK_PHOTON_EMISSION` | nur mit sehr empfindlicher Langzeitmessung erfassbare Körperemission | eine mit bloßem Auge sichtbare Funke passt nicht zur publizierten Intensität |

Alle sechs Mechanismen sind in ihren jeweiligen Quellen reale
Forschungsgegenstände. Ihre Beziehung zu diesem Bericht bleibt `UNKNOWN`, bis
eine Beobachtung sie unterscheidet.

## Warum zwei Kameras?

Eine einzelne Aufnahme lässt optisches Ereignis, Reflex, Streulicht,
Sensorpunkt und Verarbeitung leicht zusammenfallen. Zwei feste Kameras aus
verschiedenen Winkeln plus Raumton trennen diese Flächen:

- nur eine Kamera oder eine feste Sensorkoordinate stärkt den Artefakt-Ast;
- beide Kameras am räumlich entsprechenden Fingerpunkt dokumentieren ein
  Mehransichtsereignis;
- ein passender Klick nahe Kontakt stärkt den ESD-Ast;
- anhaltendes Leuchten ohne Kontakt öffnet die Frage nach einer real gebundenen
  Feldquelle.

Auch zwei Kameras identifizieren den Mechanismus nicht automatisch. Die
Originaldateien bleiben lokal; öffentlich reicht ein minimierter Methoden- und
Hash-Receipt. Der vollständige Plan steht in
[`observation-protocol.json`](observation-protocol.json). Er verlangt keine
absichtliche Aufladung und verbietet Hochspannungs- oder Gewitterversuche.

## Dateien

| Datei | Funktion |
| --- | --- |
| [`sources.json`](sources.json) | neun Primär-, Behörden- und offizielle Quellen mit enger Claim-Grenze |
| [`model-matrix.json`](model-matrix.json) | Vorhersagen, Unterscheider und Schutzgrenzen aller sechs Modelle |
| [`observation-protocol.json`](observation-protocol.json) | noch nicht ausgeführter passiver Zwei-Kamera-Plan |
| [`src/spark-audit.mjs`](src/spark-audit.mjs) | fail-closed Intake- und Modell-Audit |
| [`test/spark-audit.test.mjs`](test/spark-audit.test.mjs) | Regressionssuite für Bericht, Modelle, Quellen und Claim Ceiling |
| [`reconstruction-cycle.json`](reconstruction-cycle.json) | LUCINET-Core-3.5-Rekonstruktions- und Branch-Receipt |

## Ausführen

```bash
cd branches/fingertip-spark-esd-spacecraft-audit
npm test
npm run audit
```

Der Standardlauf enthält nur den minimierten öffentlichen Satz. Er gibt einen
deterministischen Receipt aus, hält den Mechanismus offen und setzt keinen
Vergleichsbeleg voraus.

## Öffentlicher Prüfaufruf

Wer ein natürlich auftretendes Ereignis untersuchen will, kann einen
datensparsamen Methoden-Receipt oder eine bessere Primärquelle beisteuern. Ein
nützlicher Beitrag benennt Kamerawinkel, Zeitbasis, Belichtung, Umgebungsdaten,
Kontaktabstand und die genaue Vorhersage, die mindestens zwei Modelle
unterscheidet.

Autor und Herausgeber dieses Audits: **Juri Janovski** (`@Juri-Halveth`).

## Claim Ceiling

`USER_REPORTED_OBSERVATION_PRESERVED_WITH_SOURCE_BOUND_COMPETING_MODELS_AND_ESD_SPACECRAFT_ELECTRONICS_ENGINEERING_BRIDGE_NOT_EVENT_MECHANISM_SPACECRAFT_TECHNOLOGY_OWNERSHIP_COPYING_EXTERNAL_CAUSAL_INFLUENCE_LEGAL_ENTITLEMENT_OR_PAYMENT_PROOF`
