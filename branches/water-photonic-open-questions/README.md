# Water and Photonics Open Questions

## Öffentliche Forschungsfrage

Welche gebundenen Messungen unterscheiden Änderungen einer Wasserprobe von
Änderungen des optischen Aufbaus, der Temperatur, des Drucks oder der
Wellenlänge?

Stand: `FINITE_SNAPSHOT`

## OBSERVED

Die International Association for the Properties of Water and Steam führt
eine Referenzformulierung für den Brechungsindex gewöhnlichen Wassers als
Funktion von Wellenlänge, Temperatur und Dichte beziehungsweise Druck. Der
angegebene Gültigkeitsbereich ist Teil der Referenz und darf in einer
Auswertung nicht verschwinden.

Quelle:
[IAPWS R9-97, Refractive Index of Ordinary Water Substance](https://www.iapws.org/relguide/Rindex.html)

## Kandidatenmodelle

1. `SAMPLE_CHANGE`: Eine kontrollierte Änderung der Probe verändert die
   gebundene optische Messgröße.
2. `ENVIRONMENT_CHANGE`: Temperatur, Druck oder Zusammensetzung erklären die
   Differenz.
3. `INSTRUMENT_DRIFT`: Lichtquelle, Sensor, Geometrie oder Kalibrierung haben
   sich verändert.
4. `PROCESSING_ARTIFACT`: Auswertung, Normalisierung oder Darstellung erzeugt
   die Differenz.

Diese Modelle sind Kandidaten, keine Befunde.

## Kleinster unterscheidender Aufbau

- Referenzprobe und Prüfprobe in derselben Geometrie
- gebundene Wellenlänge oder Spektralbandbreite
- Temperatur- und Druckmessung mit Unsicherheit
- Dunkel- und Referenzmessung vor und nach der Probe
- Rohwerte, Kalibrierung, Auswertungsversion und fehlende Messintervalle
- vorab definierte Entscheidungsregel

## UNKNOWN

- Welche Messgröße ein konkreter späterer Aufbau verwenden wird
- Welche Empfindlichkeit und Wiederholbarkeit erreichbar ist
- Ob eine beobachtete Differenz probe-, umwelt-, instrument- oder
  verarbeitungsbedingt wäre

## NOT_PROVEN

Dieser Ast belegt keine neue Eigenschaft von Wasser, keine Energiequelle,
keine biologische Wirkung und keinen Mechanismus außerhalb des benannten
Messaufbaus.

## Fortsetzungsaufgaben

- Eine öffentlich lizenzierte synthetische Spektral-Fixture erstellen.
- Zwei Kandidatenmodelle mit numerisch verschiedenen Vorhersagen formulieren.
- Kalibrier- und Unsicherheitsfelder in ein maschinenlesbares Schema überführen.
- Einen Blindvergleich zwischen Rohdaten und zwei Auswertungspipelines planen.

Reopen-Trigger: Ein sicherer Aufbau mit gebundener Kalibrierung, Messunsicherheit
und öffentlichen oder selbst erzeugten Daten.

