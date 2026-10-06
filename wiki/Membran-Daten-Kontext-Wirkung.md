# HALVETH · Membran, Daten, Kontext und Wirkung

Ein weiterer Baustein des [Codeuniversums](HALVETH-Codeuniversum.md): Daten
aufnehmen, ihre Bedeutung an einen Vertrag binden und ausgeführte Wirkung mit
einer eigenen Beobachtung verbinden. Die folgenden Lehren sind eine neu
geschriebene, öffentliche Ableitung aus einem bereitgestellten Gesprächssnapshot.
Die dort berichteten externen Tests wurden für diese Veröffentlichung nicht
unabhängig wiederholt. Die Beispiele hier verwenden ausschließlich Rollen und
synthetische Zustände.

## Eine Membran erhält mehrere Adressen

| Ebene | Gebundene Felder | Bereits vorhandene Umsetzung |
| --- | --- | --- |
| Inhalt | Eingabebytes, Typ, Digest, Quellenrecord | [Normenwerk](../branches/normenwerk-rule-universe/README.md) |
| Ereignis | Ereignis-ID, Quellzeit, Kontext, Vorgänger | [FEGEFEUER](../branches/fegefeuer-provenance-transducer/README.md) |
| Relation | Zwei Endpunkte, definierter Relationstyp, Scope | [Normenkern](../branches/normenwerk-rule-universe/normenkern.py) |
| Entscheidung | Regel, Gegenregel, Vorrang, unbekannter Zustand, Trace | [Vier Modellfälle](../branches/normenwerk-rule-universe/README.md#vier-nachvollziehbare-ergebnisse) |
| Wirkung | Konkreter Ausführungsoperator und unabhängig erhobene Nachbeobachtung | Eigenständiger Integrationsvertrag für eine spätere Anwendung |

Eine erfolgreiche Strukturprüfung beantwortet ihre konkrete Strukturfrage.
Eine Wirkungsaussage bindet zusätzlich den Wirkungsreferenten und die passende
Nachbeobachtung. Aus einem HTTP-Status allein folgt kein bestimmter Befund.

## Rohdifferenz und fachliche Differenz

Zwei synthetische Antworten können beide `status = DENIED` enthalten und
unterschiedliche Ereigniskennungen tragen. Dann unterscheiden sich ihre
Rohbytes; unter einem vorher definierten Vergleichsvertrag können sie dieselbe
fachliche Statusprojektion besitzen. Die unterschiedlichen Ereignisse bleiben
mit ihren vollständigen Rohfassungen erhalten.

Ein solcher Vergleich benötigt die genaue Feldliste, den Operator mit Version,
die erhaltene Rohquelle und ein Verlustledger. Ein entferntes Feld darf nicht
nachträglich deshalb als irrelevant gelten, weil es das gewünschte Ergebnis
stört. Der Normenwerk-Replay verwendet bewusst die vollständigen Records und
bindet sogar Unterschiede der Eingabebytes; eine zusätzliche semantische
Projektion wäre ein eigener Operator.

## Kontext gehört zur Relation

Ein Akteur, eine Rolle, eine Operation und eine Ressource sind getrennte
Objekte. Die Befugnis für eine konkrete Operation wird aus der zuständigen
Quelle und dem gebundenen Kontext geprüft. Eine Lesefähigkeit führt nicht
automatisch zu Schreibbefugnis; eine Rolle in einem Modell erzeugt keine
Identität in einem anderen System. Der Normenkern prüft genau die Bindung aus
Domäne, Scope, Akteur, Aktion und Gegenstand.

Ein Laborstand kann eine Hypothese für einen anderen Stand liefern. Die
Übertragung benötigt Versions-, Controller-, Kontext- und Quellenbindung.
Ein gemeinsamer Produktname ersetzt diese Verbindung nicht.

## Textübergabe ist ein eigener Operator

Ein Bash-Here-Document gibt einen mehrzeiligen Datenstrom an die Standardeingabe
eines benannten Befehls. Bei einem gequoteten Begrenzungswort wie `<<'ENDE'`
expandiert Bash den Inhalt nicht. Der empfangende Befehl entscheidet dann,
wie er den Datenstrom verarbeitet: etwa als Text für `cat` oder als Programm
für einen ausdrücklich aufgerufenen Interpreter. Das Begrenzungswort beendet
die Eingabe; es erteilt keine zusätzliche Aktionsbefugnis.

Der Wartestatus des aktuellen Here-Documents beschreibt nur diesen
Eingabevorgang. Frühere Befehle können bereits ausgeführt worden sein. Eine
zusammenfassende Meldung ersetzt die Beobachtung des tatsächlichen Shell-
und Prozesszustands nicht.

Quelle: [GNU Bash Reference Manual, Here Documents](https://www.gnu.org/s/bash/manual/html_node/Redirections.html#Here-Documents),
abgerufen am 07.10.2026. Metaphern wie Membran, Kosmos oder SNAP geben der
Darstellung einen Namen; der technische Vertrag bleibt Ein-/Ausgabetyp,
Operator, empfangender Prozess, Erhaltungs- und Ausführungsregel.

## Fortsetzung

Ein neues Modul kann eine gebundene semantische Projektion, eine persistente
Ereignisablage oder einen ausdrücklich autorisierten Ausführungsadapter
ergänzen. Es erhält eigene Tests und einen eigenen Wirkungsvertrag. Der
aktuelle Demonstrator verbindet die vollständige Recordprüfung mit der
provenienzgebundenen Aufnahme in FEGEFEUER bereits ausführbar.
