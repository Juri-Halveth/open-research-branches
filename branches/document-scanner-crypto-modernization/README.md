# Document Scanner Cryptography Modernization

## Öffentliche Forschungsfrage

Welche überprüfbaren Anforderungen muss ein lokaler Dokumentenscanner erfüllen,
bevor er verschlüsselte Speicherung als Sicherheitsmerkmal anbieten darf?

Stand: `HOLD_IMPLEMENTATION`

## Ausgangslage

Dieser Ast enthält absichtlich keinen übernommenen Scanner-Code. Er beschreibt
einen Neuaufbau, weil ein historisches Design mit veralteter
Passwortableitung oder Dokumentverschlüsselung nicht als sichere Grundlage
weitergegeben werden soll.

## Mindestanforderungen

- Bedrohungsmodell mit Gerätediebstahl, Offline-Angriff, Backup, Export und
  Wiederherstellung
- versioniertes Dateiformat mit Algorithmus- und Parameterkennung
- Passwortableitung mit zufälligem Salt und überprüfbaren Kostenparametern
- authentifizierte Verschlüsselung und Fehler bei veränderter Ciphertext-Datei
- sichere Zufallsquelle und dokumentierte Schlüssel-Lebensdauer
- keine Secrets in Logs, Dateinamen, Vorschaubildern oder Crashreports
- Testvektoren, Interoperabilität, Migration und Rückrollstrategie
- unabhängige Sicherheitsprüfung vor Produktbehauptungen

NIST SP 800-132 beschreibt Anforderungen für passwortbasierte
Schlüsselableitung bei gespeicherten Daten. Eine konkrete Implementierung muss
zusätzlich den aktuellen Zielstandard, das Dateiformat und die verwendete
Bibliothek binden.

Quelle:
[NIST SP 800-132](https://doi.org/10.6028/NIST.SP.800-132)

## UNKNOWN

- Zielplattform und benötigte Interoperabilität
- Schutzprofil des späteren Produkts
- geeignete aktuelle Bibliothek und konkrete Parameter
- Migration vorhandener Dateien ohne Datenverlust

## NOT_PROVEN

Dieser Plan ist keine sichere Implementierung, keine Prüfung eines Produkts und
keine Garantie gegen Datenverlust oder Zugriff.

## Fortsetzungsaufgaben

1. Threat Model und Datenlebenszyklus schreiben.
2. Aktuelle Plattform- und Formatstandards binden.
3. Zwei gepflegte Bibliotheken nach Interoperabilität, Auditstand und
   Fehlermodell vergleichen.
4. Ausschließlich synthetische Testdateien und bekannte Testvektoren verwenden.
5. Migration, Abbruch und Wiederherstellung mit absichtlichen Fehlerfällen
   testen.

Reopen-Trigger: Ein versionsgebundenes Threat Model, eine begründete
Bibliothekswahl und ein lokaler Prototyp mit unabhängigen Testvektoren.

