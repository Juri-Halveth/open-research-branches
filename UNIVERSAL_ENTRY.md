# HALVETH · ein Einstieg, viele Verbraucher

Der gemeinsame Einstieg bindet Quellen, Funktionen, Modelle und Hinweisachsen
an einen Git-Commit. Bash, CMD, PowerShell, JavaScript und Python verwenden
denselben Datenvertrag. HTML und Text sind Darstellungen dieses Pakets.

```bash
bash HALVETH.sh start --format text
bash HALVETH.sh roots --format text
bash HALVETH.sh proof F02 --format json
bash HALVETH.sh indicate F02 --format json
bash HALVETH.sh read CODE_DNA.md --format html > code-dna.local.html
```

Voraussetzungen: Node.js ab Version 20 und Git in der gewählten Umgebung.
`HALVETH_NODE` kann einen bereits vorhandenen Node-Pfad benennen. Der Adapter
installiert nichts und ändert keinen globalen PATH. Bash in WSL und Git Bash
haben eigene Resolver; ein Windows-Interpreter ist nicht allein durch seinen
Namen in jeder Shell verfügbar.

```powershell
.\HALVETH.ps1 proof F02 --format text
cmd.exe /d /c HALVETH.cmd indicate F02 --format json
```

```sh
node scripts/halveth-entry.mjs proof F02 | python examples/read-halveth-packet.py
```

```javascript
import {runEntry, decodePacket} from './scripts/halveth-entry.mjs';
const packet = runEntry(['indicate', 'F02']);
const indication = decodePacket(packet);
```

`--cwd` benennt einen anderen ausdrücklich ausgewählten lokalen Git-Checkout;
solche Ausgaben tragen `RESTRICTED_RAW`. `--ref` bindet eine Commitfassung.
Die Dateioperation liest einen gebundenen regulären Git-Blob, keine ungetrackte
Datei und keinen Symlink. Quelldaten werden nicht als Programme gestartet.

## Für andere und künftige Umgebungen

Der Anschlussvertrag verlangt Bytes, UTF-8, JSON, kanonisches Base64 und
SHA-256. Ein Verbraucher prüft Schema/Version, Größenlimit, kanonisches
Base64, Byteanzahl und Payload-Digest, bevor er JSON als Daten interpretiert.

Die JSON-Werte sind endlich, Unicode-skalar und reine Daten. Ungültige Werte
werden vor der Serialisierung zurückgewiesen. CMD wird für maschinenlesbare
Pipes mit `/d` gestartet, damit ein vorhandener AutoRun-Vorspann nicht die
Paketdaten ergänzt. Der Einstieg ändert die bestehende Bootkonfiguration nicht.

Quelle für den CMD-Schalter:
[Microsoft: cmd `/d`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd).

Die vollständig erhaltenen Payloadbytes bleiben im `payloadBase64`-Feld. Der
Git-Commit/Tree ist eine eigene Quellenbindung. `PUBLIC` und `RESTRICTED_RAW`
bleiben getrennte Datenklassen. Der Python-Verbraucher zeigt eine unabhängige
Implementierung des Bytevertrags; er ist keine unabhängige Bestätigung der
Sachinhalte.

Ein neuer Adapter bekommt einen eigenen Roundtrip-Test. Der Vertrag erlaubt
Erweiterung, ohne Kompatibilität mit noch unbekannten Programmen vorzugeben.
Alle 15 registrierten öffentlichen Repo-Adressen sind sichtbar. Ihre früheren
Head-Metadaten behalten ihren Erfassungszeitpunkt; der Einstieg lädt oder
führt die anderen Programme nicht automatisch aus. Die vorhandene
[GitHub-API-Brücke](scripts/github-knowledge-gateway.mjs) hat einen getrennten
authentifizierten Lese-/Beitragsvertrag.

## INDICATE · offene Achsen mit Herkunft

`indicate F02` verbindet den Quellausschnitt mit Operator, Testdefinition und
offener Produktwirkung. Neue Achsen erhalten eine eindeutige ID, Definition,
Quelle und einen deklarierten Zustand. Mehrere Hinweise aus derselben Quelle
bilden einen gemeinsamen Provenienzcluster. Die Ausgabe führt `INDICATED`,
einen Quell-Digest und `SOURCE_BOUND_NAVIGATION_HINT_ONLY`.

Die beigefügte ursprüngliche Idee wird als Forschungsrichtung erhalten. Der
Baustein liefert Quellenannotation für die eigene Arbeit. Er extrahiert keine
Angriffsziele, bewertet keine Ausnutzbarkeit und führt keine Außenoperationen
aus. Ein Hinweis bleibt von einem beobachteten Sicherheitsbefund getrennt.

Weiterentwicklung von HALVETH, LUCINET und Scarlet kann diese Pakete lesen und
ihre eigenen Laufzeitadapter anschließen. Der gemeinsame Einstieg ersetzt
keine unerprobte Laufzeitintegration durch eine Behauptung.

[Funktionen und Belege](CODE_DNA.md) · [AI-Einstieg](START_HERE_AI.md) ·
[Mechanismus zuerst](branches/security-impact-learning/MECHANISM_FIRST.md)
