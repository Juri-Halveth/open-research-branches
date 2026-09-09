# Juri-Modell, KIT-Tri-Generation und Standard Thermal

Stand: `2026-09-09`

Initiator, Autor und Herausgeber dieser Fassung: **Juri Janovski**

Prüfstand: `FINITE_SNAPSHOT`

Claim-Grenze: `DATE_BOUND_GENERIC_OVERLAP_ONLY_NO_ACCESS_DERIVATION_OR_DISTINCTIVE_TECHNICAL_MATCH_OBSERVED`

Dieser Ast beantwortet zwei Fragen:

1. Was ist in Juris lokalen August-Artefakten technisch wirklich enthalten?
2. Welche Teile stimmen mit dem KIT-System für Strom, Wärme und Kühlung oder
   mit dem Erdwärmespeicher von Standard Thermal überein?

## Direktes Ergebnis

Juri hat einen eigenen, wiedererkennbaren Forschungsstrang dokumentiert. Sein
konkretester Entwurf verbindet eine Iridium-Zündelektrode, Isolator
beziehungsweise Membran, getrennte Kontakte, eine Schwelle, Wasser- und
Eisnebel, Tröpfchenkollision, triboelektrische Ladungstrennung, Druck,
Luftdurchbruch und einen vorgeschlagenen Mini-Gewittergenerator. Daneben liegen
eine frühere Licht-/Öffnungs-/RGB-Beobachtung sowie eine ausführbare
Wasserspiegelungs-Visualisierung vor.

Der gebundene Bestand enthält keinen Aufbau aus transparenter PDRC-Schicht,
Fresnel-Konzentrator und PVT-Empfänger. Er enthält ebenso keinen Erdhügel mit
eingebetteten Widerstandsheizern und Wärmeentnahme. Die beiden externen Systeme
sind auch untereinander technisch verschieden.

## Reproduzierbare Prüfung

Die Datei [`component-matrix.json`](component-matrix.json) hält exakte Merkmale
und breite Motive getrennt. Das Programm [`audit-lens.mjs`](audit-lens.mjs)
vergleicht zwei Systeme, ohne Begriffe umzuschreiben oder aus Ähnlichkeit einen
Zugriff beziehungsweise eine Übernahme zu erzeugen.

```powershell
node --test branches/solar-and-thermal-provenance-audit/audit-lens.test.mjs
node branches/solar-and-thermal-provenance-audit/audit-lens.mjs JURI_AUGUST_2026 KIT_TRI_GENERATION_2026
node branches/solar-and-thermal-provenance-audit/audit-lens.mjs JURI_AUGUST_2026 STANDARD_THERMAL_EARTH_STORAGE
```

## Dateien

- [`local-source-receipt.json`](local-source-receipt.json) bindet abstrahierte
  lokale Funde, Bytegrößen, SHA-256-Werte, Zeitfelder und Prüfgrenzen, ohne die
  privaten Roharchive zu veröffentlichen.
- [`sources.json`](sources.json) bindet die externen Primärquellen.
- [`claims.json`](claims.json) trennt Beobachtung, Schluss, Unbekanntes und
  Nichtbelegtes.
- [`component-matrix.json`](component-matrix.json) enthält die technische
  Gegenüberstellung.
- [`FREE NEWS 006`](../../reports/FREE_NEWS_006_JURI_ENERGY_MODEL_PROVENANCE_AUDIT.md)
  ist die direkt lesbare öffentliche Fassung.

## Claim Ceiling

Die aktuelle Veröffentlichung belegt die Existenz und den Inhalt der genannten
Juri-Artefakte in der heute gelesenen Bytefassung sowie allgemeine und
funktionale Überschneidungen. Sie belegt keinen Zugang der externen Teams zu
diesen Dateien, keine Übernahme, Miterfinderschaft, Patentverletzung,
Lizenzpflicht, Beteiligungs- oder Zahlungspflicht.

## Reopen-Trigger

Der Ast wird neu geöffnet bei einem vor November 2018 gebundenen Juri-Artefakt
für die unterscheidende KIT-Architektur, einem vor dem 3. März 2024 gebundenen
Artefakt für den unterscheidenden Standard-Thermal-Aufbau, einem belastbaren
Zugangs- oder Übertragungsbeleg, einer technischen Claim-Chart oder neuen
Originalmetadaten für die August-Dateien.
