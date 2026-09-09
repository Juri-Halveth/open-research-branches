# Plant Observation Protocol

## Öffentliche Forschungsfrage

Wie dokumentiert man eine Pflanzenbeobachtung so, dass sichtbare Veränderung,
Behandlung, Umgebung, Zeit und Interpretation getrennt bleiben?

Stand: `FINITE_SNAPSHOT`

## Grundlage

MIAPPE beschreibt Mindestinformationen für Pflanzen-Phänotypisierung und
trennt unter anderem Studie, biologisches Material, Umwelt, Behandlung und
Beobachtungsvariablen. Dieser Ast übernimmt keine MIAPPE-Datei. Er verweist auf
den Standard und stellt nur ein kleines, neu geschriebenes Schema bereit.

Quellen:

- [MIAPPE overview](https://www.miappe.org/overview/)
- [MIAPPE repository and specifications](https://github.com/MIAPPE/MIAPPE)

## Protokoll

Vor der Beobachtung werden gebunden:

- `study_id` und `specimen_id` als synthetische oder veröffentlichbare IDs
- Zeitpunkt, Zeitzone und Beobachtungsfenster
- Umgebung und ihre Einheiten
- Behandlung und Vergleichsbedingung
- Sensor, Auflösung, Position und Kalibrierung
- Beobachtungsvariable, Einheit und Auswertungsregel
- fehlende Intervalle und bekannte Störungen

[`templates/observations.csv`](templates/observations.csv) enthält nur
synthetische Beispiele.

## OBSERVED

Ein ausgefüllter Datensatz kann innerhalb seines Erfassungsfensters sichtbare
oder gemessene Merkmale dokumentieren.

## INFERRED

Ein Zusammenhang zwischen Behandlung und Veränderung bleibt eine Auslegung,
bis Kontrollen, Wiederholungen und eine passende Analyse ihn stützen.

## UNKNOWN

- nicht erfasste Umweltvariablen
- biologische Variation außerhalb der Stichprobe
- Beobachter- und Verarbeitungseffekte
- Übertragbarkeit auf andere Arten, Orte oder Zeiträume

## NOT_PROVEN

Eine einzelne Beobachtung belegt keine Kommunikation, Empfindung, Absicht oder
kausale biologische Wirkung.

## Fortsetzungsaufgaben

- Schema mit MIAPPE-Feldern abgleichen und Abweichungen dokumentieren.
- Synthetische Zeitreihe mit absichtlich fehlenden Intervallen ergänzen.
- Blind codierte Kontroll- und Behandlungsgruppe simulieren.
- Eine Auswertung schreiben, die Beobachtung und Interpretation getrennt
  exportiert.

Reopen-Trigger: Wiederholte Messungen mit vorab gebundener Vergleichsregel und
vollständiger Quellen- und Rechtekette.

