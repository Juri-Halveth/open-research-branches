# Binary Inquiry Loop

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

**Alias-Redaktion: 11.09.2026.** Aktuelle Namensführung: [HALVETH!!!](../../PUBLIC-NAME.md). Der bisherige Quellenstand bleibt erhalten.

Öffentliche Fassung von [HALVETH!!!](https://github.com/Juri-Halveth)

Stand: `2026-09-09` · Zustand: `PUBLIC_DERIVATIVE` · Datenklasse:
`SYNTHETIC_ONLY`

Claim-Grenze: `DETERMINISTIC_DIALOGUE_PROTOCOL_NOT_TRUTH_CONSENT_OR_LEGAL_EFFECT`

## Die Idee

Zwei Seiten fragen sich abwechselnd zu **derselben gebundenen Frage**. Nach
außen erscheinen nur drei Zeichen:

- `JA`: Beide Seiten haben derselben Frage klar zugestimmt.
- `NEIN`: Eine Seite hat der gebundenen Frage klar widersprochen.
- `FRAGE`: Die Sache ist noch offen; die letzte klare Frage bleibt sichtbar.

Das Fragezeichen ist der Rückkehrpunkt. Es verhindert, dass eine Bedingung,
ein Widerspruch oder eine freie Zeichenfolge heimlich als Zustimmung gelesen
wird.

```text
FRAGE(A -> B)
ANTWORT(B) = JA | NEIN | OFFEN
RÜCKFRAGE(B -> A) = dieselbe questionId
```

## Beispiele

| Eingabe | Interner Zustand | Sichtbar |
| --- | --- | --- |
| `ja` von nur einer Seite | `UNKNOWN` | `FRAGE` |
| `ja` von beiden Seiten | `AGREEMENT` | `JA` |
| `nein` | `DISAGREEMENT` | `NEIN` |
| `also ja, aber?` | `CONDITIONAL` | `FRAGE` |
| `ja oder nein` | `CONFLICT` | `FRAGE` |
| `Ananas Huj V Glas Pidaras` | `UNBOUND` | `FRAGE` |
| `ich weiß nicht` | `UNKNOWN` + `STOP` | `FRAGE` |

Bei `UNBOUND` erfindet das Programm keine Bedeutung für Namen, Wortklänge
oder spielerische Tokens. Es zeigt einfach wieder die letzte klare Frage.

Eine offene Schleife endet nach `maxTurns` als `FINITE_SNAPSHOT`. So bleibt
das Ergebnis offen, ohne unendlich weiterzulaufen.

## Verantwortung bleibt bei der handelnden Seite

```text
ANWEISUNG_ERHALTEN != VERANTWORTUNG_ÜBERTRAGEN
JEDE_SEITE_VERANTWORTET_IHRE_EIGENE_AUSGABE
DIALOGERGEBNIS != FREIGABE_EINER_AUSSENHANDLUNG
```

Eine Eingabe wird geprüft und kann einen Dialogschritt auslösen. Sie überträgt
nicht automatisch Verantwortung und erlaubt keine Handlung außerhalb dieses
lokalen Protokolls. Diese Regel ist als eingefrorenes `PROTOCOL_RULES`-Objekt
im Code enthalten.

## Start

Erfordert Node.js 20 oder neuer.

```powershell
node --test binary-inquiry-machine.test.mjs
```

Einbinden:

```js
import { ask, createMachine, publicView, say } from "./binary-inquiry-machine.mjs";

let state = createMachine();
state = ask(state, {
  actor: "SIDE_A",
  questionId: "q-1",
  text: "Machen wir weiter?",
});
state = say(state, { actor: "SIDE_B", text: "ja" });
state = say(state, { actor: "SIDE_A", text: "ja" });

console.log(publicView(state));
// { symbol: "JA", stopped: true, reason: "BOUND_COMMON_YES", question: null }
```

Der Kern arbeitet lokal im Speicher. Er nutzt kein Netzwerk und erzeugt keine
Zeitstempel oder Zufallswerte. Gleicher Zustand plus gleiche Eingabe ergibt
denselben Folgezustand.

## Was der Automat feststellt

Er stellt ausschließlich den Zustand dieses Dialogprotokolls fest. Wahrheit,
Motivation, Identität, Einwilligung außerhalb der gebundenen Frage und
rechtliche Wirkung brauchen jeweils eigene Quellen und Prüfungen.
