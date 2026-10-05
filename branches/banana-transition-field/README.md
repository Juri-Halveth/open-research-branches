# Bananen-Technologie: ein weiterwachsendes Übergangsfeld

[Zur Forschungsübersicht](../../wiki/Natur-und-Beobachtung.md) · [Alle Projekte](../../wiki/Projekte.md)

Ein automatisches Reifungsbild und ein bearbeitbares Forschungsnetz. **Aufnahme**
führt zu Transport und Verteilung; **Mikrobiom** führt zu Umwandlungsprodukten und
Körperzustand. Beide Wege behalten weitere offene Äste. Acht Einflussgruppen
enthalten jeweils drei benannte Fragenfelder mit zunächst drei offenen
Fortsetzungen. Jeder Knoten kann erneut erweitert werden.

[Direkt im Browser öffnen](https://juri-halveth.github.io/open-research-branches/).
Der Pages-Workflow veröffentlicht ausschließlich die fünf benannten
Anwendungsdateien nach den Repository-Tests.

## Öffentlicher Gestaltungsansatz

**Juri Janovski · aufgezeichnet am 05.10.2026, 22:40:04 MESZ.** Die folgende
redaktionelle Fassung materialisiert seinen ausdrücklichen Gestaltungsauftrag:

> Ich will Software, Welten und Argumente so gestalten, dass sie Zustände,
> Übergänge und neue Verbindungen aufnehmen können. Die Banane ist mein
> Anschauungsbild: Ein Name bleibt, während sich Eigenschaften verändern.
> Überlieferte Begriffe und Regeln dürfen untersucht, begründet und verbessert
> werden. Ein offener Ast soll zu einer Frage und einem nächsten Versuch führen.

Diese persönliche Richtung wird als Designprinzip angewendet: veränderlicher
Zustand, erhaltene Identität, nachvollziehbare Übergänge und wiederaufnehmbare
Forschungsfragen. Wissenschaftliche und rechtliche Einzelbehauptungen werden
an ihre eigenen Quellen gebunden. Die Erklärung ersetzt keine Messung oder
domänenspezifische Prüfung.

## Starten und benutzen

Python 3 und für die Tests Node.js 20 oder neuer genügen; es gibt keine
Paketinstallation und keine CDN-Abhängigkeit. In Git Bash im Projektordner:

```bash
bash START.txt --port 4198
```

Die ausgegebene Loopback-Adresse im Browser öffnen. Der Server stellt nur
diesen öffentlichen Demonstrationsordner bereit. `Ctrl+C` beendet ihn.

1. Die organische Grafik und Modellwerte bewegen sich automatisch. „Bewegung
   anhalten“ pausiert; „Reifung neu starten“ beginnt mit dem Ausgangszustand.
   Bei der Systemeinstellung für reduzierte Bewegung beginnt die Seite pausiert.
2. Die beiden Wege nebeneinander und die aufklappbaren Einflussgruppen öffnen
   denselben Knoten im Forschungsnetz.
3. „Drei weitere Äste öffnen“ ergänzt neue Plätze und erhält alle bisherigen
   Einträge. Drei ist eine Bediengruppierung, keine Behauptung über die Anzahl
   möglicher Prozesse oder Dimensionen.
4. Offene Plätze können benannt und mit einer eigenen Frage beschrieben werden.
   Die Ergänzungen bleiben im lokalen Browserspeicher. „Mein Netz als JSON“
   exportiert den aktuellen Stand; es gibt keinen automatischen Upload.

## Was ist berechnet, was ist offen?

| Teil | Prüfstand |
| --- | --- |
| Stärke, Zucker, Restfraktion | Synthetische Mengen; Gesamtmenge bleibt eins. Die Modellkonversion zählt jede umgewandelte Menge einmal. |
| Festigkeit, Aroma, Ethylenindex | Dimensionlose, frei gewählte Illustrationswerte; unkalibrierte Zeit. |
| Dreifacher Stoffaustausch | Allgemeiner konservativer Austauschoperator; kein kalibriertes Darmmodell. |
| Genetik, Umwelt, Struktur, Transport, Gesundheit | Forschungsfragen mit offener Quellen- und Messbindung. |
| Linien und Nachbarschaften | Forschungsorganisation, keine alleinige Kausalitätsaussage. |
| Universelle Anwendung | Übertragbarer Softwareansatz; seine Eignung für eine konkrete Fachdomäne bleibt zu prüfen. |

**Biologischer Anker:** Die Primärstudie von Phillips et al. (2021) untersucht
Stärke, Zucker und Ballaststoffe bei verschiedenen Reifegraden. Sie zeigt
zugleich die Bedeutung von Probenstand und Messmethode. Daraus stammt die
Richtung „mehrere Eigenschaften und Bedingungen gemeinsam betrachten“;
die numerischen Parameter dieses Demonstrators stammen aus eigener Gestaltung.
[Primärstudie](https://pubmed.ncbi.nlm.nih.gov/34237070/),
[Verlagsfassung](https://doi.org/10.1371/journal.pone.0253366).

Ein Literaturüberblick erläutert den Stoffwechsel von Stärke und Zucker bei der
Reifung. Er ist ein Überblick und wird neben der Primärstudie als solcher
geführt: [Cordenunsi-Lysenko et al., 2019](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2019.00391/full).

## Dateien, Nachweise und Fortsetzung

- [model.mjs](model.mjs): Reifungsoperator, konservativer Austausch, Knotenstruktur,
  acht Einflussgruppen, Validierung und Erweiterung.
- [model.test.mjs](model.test.mjs): Invarianten und Verhalten bei ungültigen
  Eingaben, beidseitige Fortsetzung und Erhaltung aller alten Knoten.
- [index.html](index.html), [app.mjs](app.mjs), [style.css](style.css):
  automatisch bewegte Form und bearbeitbare Forschungsansicht.
- [statement.json](statement.json): datierte redaktionelle Erklärung mit
  SHA-256-Bindung des exakten UTF-8-Erklärungstexts.
- [SHA256SUMS.txt](SHA256SUMS.txt): Prüfsummen der veröffentlichten Branchdateien.
- [START.txt](START.txt), [serve.py](serve.py): lokaler Start ohne privilegierte Rechte.

```bash
node --test model.test.mjs
```

Die bereitgestellte Ausgangsvorlage wurde separat geprüft und unverändert lokal
erhalten. Ihre vier Tests bestanden. Gefundene Modelllücken: Zeit null änderte
Werte; Stärke und resistente Stärke konnten überlappend in den Zuckerzuwachs
eingehen. Die neue Fassung verwendet neu geschriebenen Code und eigene Tests.
Private Chattexte, Originalvideo, Diagrammbild und Gerätepfade gehören zum
lokalen Quellenbestand und werden hier durch einen neuen Ableger vertreten.

Nächste prüfbare Äste: Messdaten für eine benannte Bananensorte anbinden;
Transport- und Verwendungswege mit Primärquellen füllen; denselben erhaltenen
Zustandsanker an Material, Form und Animation einer Spielfigur anschließen.
Der aktuelle Stand ist ein endlicher, erweiterbarer Demonstrator.

Lizenz: [HALVETH Public-Interest Research License 2.0](../../LICENSE-HALVETH-PIRL-2.0.md)
gemäß der bestehenden [Lizenzübersicht](../../LICENSES.md). Bereits zitierte
Quellen behalten ihre eigenen Rechte.
