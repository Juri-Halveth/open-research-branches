# Visual Interpretation Boundary

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

## Öffentliche Forschungsfrage

Wie bleibt eine Bildbeschreibung reproduzierbar, ohne sichtbare Merkmale
vorschnell zu einer Objektidentität, Ursache oder Diagnose zu machen?

Stand: `FINITE_SNAPSHOT`

## Grundlage

NIST zeigte an 43 duplizierten Bildmerkmalen aus mehreren Softwarepaketen,
dass Implementierung, Parameter, Einheiten und Regionsdefinitionen messbare
Abweichungen erzeugen können. Der Befund begründet eine Provenienzpflicht für
Bildmessungen, nicht die Richtigkeit einer bestimmten Deutung.

Quelle:
[NIST, Do We Trust Image Measurements](https://www.nist.gov/publications/do-we-trust-image-measurements-variability-accuracy-and-traceability-image-features)

## Vier getrennte Ebenen

1. `SOURCE`: Bildbytes, Herkunft und Rechte
2. `PREPARATION`: Zuschnitt, Skalierung, Farbe und Kompression
3. `MEASUREMENT`: Region, Algorithmus, Parameter, Einheit und Version
4. `INTERPRETATION`: Kandidatenlesarten und ihr jeweiliger Beleg

## OBSERVED

Ein gebundener Messlauf kann Pixelwerte oder definierte Merkmale innerhalb
einer benannten Region berichten.

## INFERRED

Eine Bezeichnung des Gegenstands oder seiner Ursache ist eine weitere
Ableitung und benötigt Ground Truth oder eine passende externe Quelle.

## UNKNOWN

- nicht sichtbare Eigenschaften des aufgenommenen Gegenstands
- Einfluss der nicht dokumentierten Aufnahme- und Verarbeitungskette
- ob verschiedene Auswertungen denselben Referenten messen

## NOT_PROVEN

Ähnlichkeit, Kontur oder Farbe allein belegt weder Objektidentität noch
biologischen oder medizinischen Zustand.

## Fortsetzungsaufgaben

- Synthetische Bilder mit bekannter Ground Truth erzeugen.
- Zwei Auswertungspipelines mit identischer Regionsdefinition vergleichen.
- Jede Transformation in einem maschinenlesbaren Provenienzrecord erfassen.
- Fehlende Quell- oder Rechteinformationen als `UNKNOWN` ausgeben.

Reopen-Trigger: Ein öffentlich lizenzierter Datensatz mit Ground Truth und
vollständig gebundener Verarbeitungskette.

