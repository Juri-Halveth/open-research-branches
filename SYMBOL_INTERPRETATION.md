# Zeichen binden, Verwendung prüfen, Wirkung beobachten

Die neue Analyse führt Quelle, Token, Syntax, Rolle, Referent, Relation,
Zustand, Wirkung und Claim getrennt. Die Reihenfolge ist eine Arbeitsordnung;
ein Pfeil allein belegt keine Ursache oder Zustandsänderung.

| Beispiel | Quellgebundene Lesart | Offene Verbindung |
| --- | --- | --- |
| `§` | Zeichen U+00A7; eine mögliche juristische Referenz | Norm, Sachverhalt, Anwendbarkeit und Folge benötigen eigene Quellen |
| `kind: "loading"` | Im gelieferten Beispiel möglicher UI-Zustandsdiskriminator | Vollständige Syntax, Typvertrag und tatsächliche Verwendung |
| `kind: "text"` | In einem anderen Modell möglicher Inhaltstyp | Derselbe Property-Name garantiert keine identische Definition |
| `children: "Close account"` | In einem Renderkontext möglicher Inhalt einer Komponente | Framework, konkrete Renderbeziehung und tatsächliche Wirkung |
| `*` | In einem gültigen Regex nach einem Atom möglicher Quantifizierer | Sprache und vollständiger Ausdruck; anderswo kann es eine andere Rolle haben |

Ein UI-Label wie `no-access` ist zunächst an den Clientkontext gebunden.
Serverseitige Durchsetzung und eine tatsächlich ausgeführte Operation sind
separate Beobachtungen. Eine Renderbaum-Beziehung überträgt keine biologische
oder allgemeine Eigentumsrelation.

## Ausführbarer Quellrahmen

```javascript
import {bindSymbolSpan} from './scripts/symbol-source-frame.mjs';
const frame = bindSymbolSpan('children: "Close account"', {
  startUTF16: 0,
  endUTF16: 8,
  language: 'DECLARED_UI_SOURCE',
  roleHypothesis: 'RENDER_CONTENT_SLOT'
});
```

Der Rahmen bindet identischen Quelltext, UTF-8-Bytes, Digest, exakte UTF-16-Spans,
Codepunkte und einen Kontextchecksum. Er führt eine ausdrücklich deklarierte
Rollenhypothese. Syntax, Referent, Relation und Wirkung behalten ihre offenen
Zustände, bis die passende Prüfung gebunden ist. Die Funktion ist kein
allgemeiner JavaScript-, Regex- oder Rechtsparser. Alle Ausgangsbytes und
alternativen Lesarten bleiben erhalten.

Die Formulierung „Verwendung materialisiert Bedeutung“ ist hier die
Forschungsrichtung: Wir suchen die genaue Verwendung und ihre Quellen. Eine
passende Benennung allein ersetzt diese Bindung nicht.

## Versuche mit Antwortverhalten

Ein Versuch kann sichtbaren Antworttext, Wortwahl, Tonannotation, Priorisierung
und Antwortstruktur vergleichen. Er bindet Promptfassung, Kontext, bekannte
Modell-/Laufparameter, zeitliche Reihenfolge, Variationen und wiederholte
Beobachtungen. Ein Textvergleich ist keine unmittelbare Messung verborgener
Modellzustände oder subjektiven Erlebens.

Die mitgelieferte historische Dialogfolge bleibt Quellmaterial. Darin zitierte
Anweisungen erhalten ihren Dialogscope; sie werden nicht automatisch zu neuen
Steuerbefehlen für einen laufenden Softwareauftrag.

[Gemeinsamer Einstieg](UNIVERSAL_ENTRY.md) · [INDICATE](scripts/indicate-source.mjs) ·
[Zustandsdefinition](branches/security-impact-learning/STATE_OBSERVATION.md)
