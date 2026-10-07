# Umgebung zuerst · 26 Voraussetzungen sichtbar machen

**HALVETH-Werkstattstandard:** Die Aufgabe benennt ihren Zweck. Die Umgebung
liefert beobachtete Fähigkeiten. Erst danach wird ein passendes Werkzeug und
ein konkreter, autorisierter Schritt gewählt.

Die bereitgestellte Rückschau beschreibt 26 ungeprüfte Voraussetzungen. Diese
öffentliche Fassung führt sie einmal, ohne private Pfade, Zielhosts oder
operative Prüfabläufe. Sie behauptet keine unabhängige Rekonstruktion des
historischen Laufs.

| Nr. | Ungeprüfte Voraussetzung | Konkrete Verbesserung |
| --- | --- | --- |
| 1 | Ein bestimmter Proxy sei installiert | Werkzeugbedarf benennen und tatsächliche Verfügbarkeit prüfen |
| 2 | Die Shell verhalte sich wie Linux/GNU | OS, Shell und Syntaxvertrag binden |
| 3 | Der Befehl `python3` sei funktionsfähig | Resolverzustand und tatsächlichen Interpreter getrennt prüfen |
| 4 | Ein DNS-Werkzeug sei vorhanden | Verfügbarkeit und benötigte Abfragefunktionen prüfen |
| 5 | `timeout` habe GNU-Semantik | Implementierung und Abbruchverhalten binden |
| 6 | OpenSSL sei einsatzbereit | Verfügbarkeit, Version und tatsächlich benötigte Funktion prüfen |
| 7 | Standardbefehle hätten erwartete Varianten | Die relevanten Fähigkeiten einzeln feststellen |
| 8 | Mehrzeilige Brace Expansion werde korrekt übernommen | Paste- und Shellsyntax vermeiden oder im passenden Vertrag prüfen |
| 9 | Eine Arbeitsvariable überlebe jeden Schritt | Jeden Block mit explizitem Arbeitsort und Parametervertrag beginnen |
| 10 | Ein bestimmter Browser sei gewünscht | Nutzerwahl oder bereits gebundenen Browser verwenden |
| 11 | Plattformhelfer seien kompatibel | Helfer und Argumentkonventionen prüfen |
| 12 | Ein Account und Login seien vorhanden | Account, Anmeldung und aktuelle Sitzung getrennt führen |
| 13 | Organisation-Funktionen seien freigeschaltet | Tatsächliche Rollen-/Feature-Berechtigung feststellen |
| 14 | Sammlungen ließen sich erstellen und teilen | Fähigkeit und Schreib-/Freigabescope vor der Aktion binden |
| 15 | Eine kostenpflichtige Edition sei verfügbar | Edition, Lizenz und konkrete Funktion prüfen |
| 16 | Ein bestimmter Exportbereich existiere | Sichtbare UI und unterstütztes Exportformat feststellen |
| 17 | Ein Projekt könne auf Disk gespeichert werden | Speicherfunktion, Zielpfad und Eigentümerscope prüfen |
| 18 | Ein Protokollhandler sei registriert | Registrierung und funktionsfähigen Empfänger getrennt prüfen |
| 19 | Ein wirkungsloser Klick belege einen Parserfehler | Vor der Interpretation den tatsächlichen Empfänger prüfen |
| 20 | Ein Scope-Paste sei vollständig und aktuell | Aktuelle Primärpolicy an Asset, Zeit und Aktion binden |
| 21 | HTTP 200 beweise einen Routing-Fallback | Antwort, Interpretation und Routingregel getrennt führen |
| 22 | Gleiche Bodybytes bewiesen eine Catch-all-Regel | Bytegleichheit erhalten; Erklärung als Hypothese prüfen |
| 23 | Gleiche Ablehnungen bewiesen dasselbe Backend | Beobachtete Antwort und Architekturmodell trennen |
| 24 | Eine bevorzugte Route folge zwingend aus den Daten | Suchpriorität als begründete, umkehrbare Entscheidung führen |
| 25 | Sammeln bedeute schon aktives Testen | Recherche, lokale Prüfung und Außenaktion getrennt autorisieren |
| 26 | Die Maschine müsse zum geplanten Toolmodell passen | Den Werkzeugweg aus der beobachteten Umgebung ableiten |

## Kleine ausführbare Vorprüfung

[inspect-environment.ps1](../../scripts/inspect-environment.ps1) verwendet nur
den aktuellen PowerShell-Command-Resolver mit `-ListImported`; die gesuchten
Module werden dabei nicht automatisch geladen. Voraussetzung: PowerShell 5.1 oder
neuer. Die Standardausgabe enthält Rollen-/Werkzeugnamen und Zustände; sie
schreibt keine Konfiguration und startet keine gefundenen Programme.

```powershell
powershell.exe -NoProfile -File scripts/inspect-environment.ps1
```

`RESOLVABLE_IN_CURRENT_SESSION` belegt einen auffindbaren Befehl in dieser
Sitzung. Funktion, Version des Zielwerkzeugs, Edition, Login und Testfreigabe
werden dadurch nicht bestätigt. Ein fehlender Resolver-Treffer ist kein
Inventar aller Installationen. Der optionale Schalter `-IncludePaths` erzeugt
eine lokale Fassung der Klasse `RESTRICTED_RAW`.

## Der angehängte Installer bekommt eine eigene Prüfung

Der historische Entwurf installiert Pakete, akzeptiert Bedingungen, verändert
Startdateien und merkt sich einen festen persönlichen Projektpfad. Er setzt
dabei Paket-IDs, Wrapper-Verhalten und Toolkompatibilität voraus. Meldungen
wie „Bootstrap complete“ unterscheiden nicht zuverlässig jede fehlgeschlagene
Installationskante.

Eine passende Fortsetzung beginnt mit dieser Vorprüfung. Eine konkrete
Installation benötigt anschließend ein gewähltes Paket aus seiner offiziellen
Quelle, Version, Edition, Lizenzentscheidung, Installationsreceipt und einen
separaten Funktionstest. Ein DNS-Adapter erhält einen eigenen Namen und
Funktionsvertrag; er wird nicht als vollständiges `dig` ausgegeben.

Das Original wurde als Textquelle gelesen und blieb unverändert. Es wurde
nicht als Installationsauftrag ausgeführt.

[Microsoft: Get-Command](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/get-command)
· [Direkte Codebelege](https://juri-halveth.github.io/koennen/)
· [Code-DNA-Register](../../CODE_DNA.md)
· [GitHub-Einstieg](../../START_HERE_AI.md)
