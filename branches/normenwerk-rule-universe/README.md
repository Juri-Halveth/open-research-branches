# HALVETH Normenwerk · ausführbarer Regelraum

**✅ CLAIMED · dokumentierter Softwarebeitrag · Referenzkern 0.1.0**

Regeln erhalten Zustände, Quellen, Kontext und Zeit. Das Ergebnis wird vollständig
gespeichert und erneut berechnet: Welche Regel war aktiv, welche besiegt, welche
offen? Die Antworten bleiben bis zu den Eingabebytes zurückverfolgbar.

[Codeuniversum](../../wiki/HALVETH-Codeuniversum.md) · [Kern](normenkern.py) ·
[21 Kernprüfungen](test_normenkern.py) · [Technischer Entwurf mit zehn Ansprüchen](TECHNISCHER_ENTWURF.md) ·
[Verbindung mit FEGEFEUER](universe.py)

## Start

Python 3.11 oder neuer, Standardbibliothek; keine Installation weiterer Pakete.
Aus dem Repository-Hauptordner:

```sh
python branches/normenwerk-rule-universe/universe.py --demo
python branches/normenwerk-rule-universe/universe.py --catalog
python -m unittest discover -s branches/normenwerk-rule-universe -p 'test_*.py' -v
```

`--demo` wertet die vier mitgelieferten Modelle aus, prüft die vorhandenen
Records durch vollständigen Replay und bindet jeden Ergebnisrecord als eigenes
Ereignis an das unveränderliche FEGEFEUER-Archiv. Die Kandidaten erhalten HOLD;
der aktive Transformationskern bleibt leer. Normauswertung und späterer
Transformationscommit sind so separat sichtbar.

Eine vollständige Demonstrationsausgabe kann in eine neue Datei geschrieben werden:

```sh
python branches/normenwerk-rule-universe/universe.py --demo --output universe-result.json
```

Vorhandene Ausgabedateien werden nicht überschrieben. Ohne `--output` schreibt
der Demonstrator nur auf die Standardausgabe und arbeitet im Speicher.

## Vier nachvollziehbare Ergebnisse

| Modell | Zustand | Entscheidender Unterschied |
| --- | --- | --- |
| [Unterstützung](01_unterstuetzt.model.json) | `MODEL_SUPPORTED` | Eine aktive unterstützende Regel. |
| [Konflikt](02_konflikt.model.json) | `CONFLICT` | Unterstützung und Opposition bleiben gleichzeitig sichtbar. |
| [Unbekannt](03_offen.model.json) | `OPEN` | Eine ungeklärte Bedingung bleibt ungeklärt. |
| [Expliziter Vorrang](04_vorrang.model.json) | `MODEL_OPPOSED` | Die ausdrückliche Vorrangkante besiegt die unterstützende Regel; ihr Trace bleibt erhalten. |

## Technischer Kern

- Geschlossenes UTF-8-/JSON-Schema mit Typ-, Referenz- und Größenprüfung.
- Exakte Bindung an Domäne, Scope, Akteur, Aktion und Gegenstand.
- Halb offene Gültigkeitsfenster und starke dreiwertige Kleene-Logik.
- Zyklusfreie explizite Vorrangstruktur; direkte Besiegung nur durch aktive,
  unbesiegte Regeln, ohne stillen transitiven Vorrang.
- Quell- und Relationsadressen einschließlich beider Endpunkte.
- Digests der Eingabebytes und des Operatorquelltextes, Operatorversion und
  typgenau kanonisierte Ergebnisrepräsentation.
- Vergleich des gesamten neu berechneten Records mit der vorgelegten Fassung.

Die vier Modelle sind synthetische Fixtures. Der Kernel liefert `MODEL_ONLY`:
Auswertungen erklären die eingespeisten Regeln. Eine operative Anwendung würde
ihre eigene Quellprüfung, Befugnis und Ausführungsschnittstelle binden.

## Herkunft, Vertrag und Weiterarbeit

Der Kern, seine 21 Tests und die vier Modelle stammen aus dem geprüften
Normenwerk-Stand. Die Ergebnisrecords werden durch vollständigen typgenauen
Replay geprüft. Der neue Demonstrator ergänzt die Verbindung mit dem bereits
veröffentlichten FEGEFEUER-Kern.

[24 technische Bausteine](blocks.json) sind einzeln an Implementierungen und
Prüfwege gebunden. Der [Gesamtkatalog](universe-catalog.json) beschreibt die
vorhandenen Forschungsäste mit ihren tatsächlichen Quell- und Testdateien.
Eine aufgeführte Testdatei ist ein Inventarbefund; der jeweilige CI-Lauf zeigt,
welche Tests in diesem Stand tatsächlich ausgeführt wurden.

Offene Erweiterungen: versionierte Persistenz, deklarierte Operatoradapter,
Wellenoptik, Kalibrierung und zusätzliche Modellfamilien. Ein neues Modul erhält
einen eigenen Vertrag, Quellen, Tests und einen expliziten Übergang zum Kern.

Neue eigene Beiträge folgen der prospektiven [HALVETH-PIRL-2.0-Pfadregel](../../LICENSES.md).
Die vorhandenen Module behalten ihre jeweiligen historischen Lizenzstände.
