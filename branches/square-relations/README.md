# Square Relations · Alles zueinander im Quadrat

[English](README.en.md) · [Forschungsraum](../../README.md) · [Code & Werkzeuge](../../wiki/Code-und-Werkzeuge.md)

Ein lokaler, interaktiver Vergleichsraum: Wörter, Emojis, Herzen, Striche,
Zahlen und andere Zeichen stehen als gleichberechtigte Blöcke in vier
sichtbaren Sektoren eines Quadrats. Jeder Block ist mit jedem anderen
verbunden. Eine zusätzliche quadratische Matrix zeigt jedes geordnete Paar
und die Selbstzellen auf der Diagonale.

Eine Verbindung bedeutet hier **„diese beiden Eingaben miteinander
betrachten“**. Die Bedeutung wird von diesem Werkzeug nicht festgelegt.
Die Sektoren ordnen die Darstellung; sie verleihen den Eingaben keine
Rangfolge und behaupten keine physischen Dimensionen oder Ursachen.

## Ausprobieren

Mit Node.js ab Version 20 im Repository-Hauptordner ausführen:

```powershell
node branches/square-relations/preview.mjs
```

Alternativ im Modulordner: `node preview.mjs`.
Danach `http://127.0.0.1:8793/` im Browser öffnen. Der Vorschau-Server bindet
an die lokale Loopback-Adresse und liefert JavaScript-Module mit dem passenden
MIME-Typ aus. Die Anwendung benötigt keinen Buildschritt und keine zusätzlichen
Laufzeitpakete. Die Oberfläche ist auf Deutsch und Englisch umschaltbar.

1. Eine Zeile im Editor ist ein Block. Auch gleiche Beschriftungen bleiben
   eigenständige Vorkommen; Leerzeilen und Leerzeichen bleiben erhalten.
   Eine vollständig leere Eingabe wird als Eingabefehler angezeigt.
2. Die Eingabe anwenden. Alle Blöcke erscheinen in den vier Sektoren und in
   der vollständigen Matrix.
3. Einen Block oder ein Paar auswählen. Die Auswahl hebt Zusammenhänge
   hervor; die übrigen Blöcke und Matrixzellen bleiben sichtbar.

## Was wird gerechnet?

Für `n` Eingabezeilen enthält der ungerichtete Graph
`n × (n − 1) / 2` verschiedene Paare. Die Matrix enthält `n²` Zellen,
darunter `n` Selbstzellen; `(i,j)` und `(j,i)` zeigen dasselbe ungerichtete
Paar in zwei Positionen. Selbstzellen sind als Selbstbezug auswählbar.

| Standardbeispiel | Anzahl |
| --- | ---: |
| Blöcke | 16 |
| Sichtbare Sektoren | 4 |
| Verschiedene ungerichtete Paare | 120 |
| Matrixzellen | 256 |
| Selbstzellen | 16 |

Die Grenze liegt bei **64 Blöcken und 8.192 UTF-8-Bytes** der Eingabe.
Überschreitungen erzeugen eine sichtbare Fehlermeldung; Eingaben werden dabei
nicht still gekürzt. Das sind Grenzen dieses interaktiven Prototyps.

Das Kernmodell erkennt LF und CRLF als Zeilentrenner. Ein alleinstehendes CR
bleibt Inhalt. Es führt keine Unicode-Normalisierung durch und weist
ungültige Unicode-Surrogate zurück. Blockpositionen sind exakte UTF-16-Spans
im akzeptierten Eingabetext; Zeilentrenner gehören zur Quelle und bleiben
aus dem jeweiligen Blocktext ausgenommen. Browser können beim Einfügen in
ein Textfeld Zeilenenden normalisieren; maßgeblich ist dessen übernommener
Inhalt.

Die SHA-256-Anzeige bindet den akzeptierten Editorinhalt in UTF-8. Ein Digest
ist ein Vergleichsmerkmal dieser Eingabe; er bescheinigt keine Urheberschaft,
ursprüngliche Entstehungszeit oder Übereinstimmung mit einem äußeren System.

## Dateien und Tests

| Datei | Aufgabe |
| --- | --- |
| [index.html](index.html) | Zugängliche Oberfläche und Editor |
| [styles.css](styles.css) | Quadrat, Sektoren, Farben und Matrix |
| [app.mjs](app.mjs) | Darstellung, Auswahl und Sprachwechsel |
| [core.mjs](core.mjs) | Eingabeprüfung, Blöcke, Paargraph und Matrix |
| [preview.mjs](preview.mjs) | Lokaler statischer Vorschau-Server mit expliziten MIME-Typen |
| [tests/core.test.mjs](tests/core.test.mjs) | Deterministische Modellprüfungen |

Mit Node.js ab Version 20 im Modulordner:

```powershell
node --test tests/core.test.mjs
```

## Daten und Nutzung

Der mitgelieferte Inhalt ist synthetisch. Eingaben werden als Text dargestellt.
Der lokale Server liefert die statischen Dateien; danach nutzt die Anwendung
keine Laufzeit-API, keine externen Netzwerkabrufe, keine Telemetrie und keine
Browser-Speicherung. Beim Neuladen wird der aktuelle Bearbeitungsstand verworfen.

Stand: `PUBLIC_DERIVATIVE` · `SYNTHETIC_ONLY` · lokaler Softwareprototyp.
Die Umsetzung zeigt eine endliche Paar- und Darstellungslogik; sie ist keine
Implementierung sämtlicher HALVETH-Core-Verträge.

Code, Tests, HTML und CSS folgen [MIT](../../LICENSE); die neu verfasste
Dokumentation folgt [CC BY 4.0](../../LICENSE-CONTENT.md), entsprechend der
bestehenden [Pfadlizenzkarte](../../LICENSES.md).
