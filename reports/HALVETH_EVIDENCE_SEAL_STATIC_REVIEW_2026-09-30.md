# HALVETH · Statische Prüfung des Beweisversieglers

Der bereitgestellte PowerShell-Versiegler wurde als Text gelesen und nicht ausgeführt. Er kopiert ausgewählte Dateien, erstellt SHA-256-Einträge, ein Manifest und ein ZIP. Seine Existenz und die Hashes sind von wissenschaftlicher Validierung, Zeugenschaft und Rechtezuordnung getrennt.

| Statischer Befund | Mögliche Auswirkung | Robuste Gestaltung |
| --- | --- | --- |
| Zielname folgt ausschließlich dem ursprünglichen Dateinamen; Kopieren mit `-Force` | Zwei Quellen mit gleichem Namen können im Ziel kollidieren | Eindeutige Quell-IDs, kollisionsfreie Zielnamen und Abbruch bei vorhandenem Ziel |
| Hash entsteht nur für die Zielkopie | Gleichheit mit einer unveränderten Quelle ist nicht separat nachgewiesen | Quellhash vor und nach dem Kopieren sowie Vergleich mit dem Zielhash |
| Ausgabename nutzt einen Zeitstempel mit Sekundengenauigkeit und überschreibende Operationen | Zwei Läufe können dieselbe Ausgabeadresse treffen | Zufällige Lauf-ID, atomare Neuanlage und kein Überschreiben |
| Manifest enthält Rechner- und Kontometadaten | Öffentliche Kopie kann private Identifikatoren offenlegen | Privates Originalmanifest und gesondertes minimiertes Exportmanifest |
| Vorformulierter Zeugenbogen enthält eine private Identität und behauptete Korrespondenz | Vorlage kann mit verifizierter Zustimmung oder Prüfung verwechselt werden | Unterschriebene, quellengebundene Erklärung mit genauem Prüfungsumfang separat verwalten |

<details>
<summary>Prüfbeleg und Behauptungsgrenze öffnen</summary>

Geprüfte Skriptbytes: SHA-256 `a78dfc93c20f02f18db3c52f3ac08c7ec5841f002b3fbf36df01f32e37e8e6a2`.

**OBSERVED:** Die genannten Kopier-, Namens- und Manifestoperationen stehen im gelesenen Quelltext. **INFERRED:** Namenskollisionen sind unter den beschriebenen Voraussetzungen möglich. Ein tatsächlicher Überschreibungsverlust in einem ausgeführten Lauf wurde hier nicht beobachtet.

Der Hash bindet die geprüften Bytes. Er beweist weder einen unabhängigen ursprünglichen Zeitpunkt noch Entdeckung, Authentisierung, formale Zeugenschaft, Eigentum oder einen Zahlungsanspruch. Private Kommunikation und die originale personenbezogene Vorlage sind nicht Teil dieses Berichts.

Kleinster sicherer Folgetest: zwei selbst erzeugte Textdateien mit gleichem Basisnamen in verschiedenen lokalen Ordnern durch einen neuen kollisionsfesten Kopierhelfer verarbeiten; zwei getrennte Ziel-IDs und drei übereinstimmende Hashmessungen je Quelle prüfen. Historische Originale bleiben unverändert.

</details>


Neu verfasste HALVETH-Beiträge: [HALVETH PIRL 2.0](../LICENSE-HALVETH-PIRL-2.0.md). Verlinkte Quellen behalten ihre eigenen Rechte. Mit KI-Unterstützung erstellt und gegen die genannten Quellen geprüft.
