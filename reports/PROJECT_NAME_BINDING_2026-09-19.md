# Neue Namen definieren: Solstheim und das Projektsymbol SOL

Stand: 2026-09-19 · HALVETH Research · `FINITE_SNAPSHOT`

## Forschungsfrage und Umsetzung

Wie lässt sich eine neue begriffliche Zuordnung ausdrücklich definieren und
technisch nutzen, ohne sie mit einem bereits bestehenden Vermögenswert zu
verwechseln?

Die ausführbare Demonstration legt im Namensraum `halveth.research.example`
einen Eintrag an: **Solstheim erhält für dieses Beispiel das Projektsymbol SOL.**
Der Eintrag bezeichnet einen Forschungsbegriff. Eine Abfrage derselben
Registerinstanz liefert diese Definition wieder zurück.

```json
{
  "kind": "USER_DEFINED_CONCEPT_ALIAS",
  "namespace": "halveth.research.example",
  "name": "Solstheim",
  "symbol": "SOL",
  "conceptId": "solstheim-reference",
  "scope": "THIS_REGISTRY_INSTANCE",
  "effect": "PROJECT_NAME_RESOLUTION"
}
```

Dies dokumentiert eine eigene Zuordnung. Es reserviert weder einen globalen
Namen noch erzeugt es SOL-Guthaben, eine Solana-Adresse oder einen Anspruch
auf Token. Das Beispiel ruft keine Wallet auf und hat keine Netzwerkfunktion.
Zwei Instanzen desselben Demo-Registers bleiben unabhängige Objekte; sie sind
kein gemeinsam autorisiertes oder dauerhaftes Namensregister.

## Vom Fund zur Definition

Ein lokaler, rein lesender Dateiabgleich fand `Solstheim` in Spieldaten und
Skripten von `Bloodmoon.esm`. `Solana` wurde in den untersuchten zwölf
ESM-/ESP-Dateien und 414 Text-/Konfigurationsdateien nicht gefunden. Gepackte
BSA-Inhalte und eine vollständige Programmanalyse waren nicht umfasst.
Die privaten Installationspfade und Spielinhalte werden hier nicht verteilt.

Ein solcher Nulltreffer beschreibt die Suche. Er entscheidet nicht, ob ein
Name in einem anderen Register verfügbar ist. Das Codebeispiel prüft die
Verfügbarkeit ausschließlich in seiner eigenen, neu erzeugten Registerinstanz.

**Gegenmodell:** Register A enthält keinen Eintrag, Register B enthält bereits
denselben Namen. Eine Suche nur in A bleibt leer. Trotzdem existiert der Name
in B. Dieser Fall ist als ausführbarer Test enthalten.

## Vier getrennte Gegenstände

| Gegenstand | Bedeutung | Erforderliche Grundlage |
| --- | --- | --- |
| Neue Projektdefinition | Eigener Begriff und seine Auflösung im Beispiel | Expliziter Namensraum, Eintrag und Auflösungsregel |
| Anzeigename eines Tokens | Beschreibende Metadaten | Zugehöriger konkreter Token/Mint und dessen Metadaten |
| Bestehendes natives SOL | Guthaben in Solana-Accounts | Kontozustand und die vorgesehenen Transaktions-/Autorisierungsregeln |
| Rechtlicher Anspruch | Eine konkrete rechtliche Position | Gesonderte Rechtsgrundlage und die dazugehörigen Tatsachen |

Die offizielle [Solana-Kontodokumentation](https://solana.com/docs/core/accounts)
beschreibt adressierte Accounts und deren Zustandsregeln. Die
[Token-Dokumentation](https://solana.com/docs/tokens/basics) behandelt
Tokenkonten, Mint- und Transferberechtigungen getrennt von Metadaten. Daraus
folgt für dieses Beispiel: Ein zusätzlicher Textname bewirkt keine Änderung
eines solchen Kontos. Das ist eine Ableitung aus dem Kontomodell, kein
ausgeführter Blockchain-Test.

Für einen markenrechtlichen Anspruch ist etwa die konkrete Grundlage nach
[§ 4 MarkenG](https://www.gesetze-im-internet.de/markeng/__4.html) zu prüfen.
Ein Such-Nulltreffer ersetzt sie nicht. Die Anforderungen an urheberrechtlich
geschützte Werke stehen unter anderem in
[§ 2 UrhG](https://www.gesetze-im-internet.de/urhg/__2.html).
Diese Notiz führt keine Markenrecherche oder individuelle Rechtsprüfung durch.
Rechte an eigenem neuen Code oder Text sind außerdem ein anderer Gegenstand
als Rechte an fremden Spielinhalten oder vorhandenen Kryptowerten.

## Ausführen und prüfen

Voraussetzung: Node.js 20 oder neuer. Im Repository-Verzeichnis:

```sh
node --input-type=module -e "import {buildSolstheimExample} from './scripts/project-name-alias.mjs'; console.log(JSON.stringify(buildSolstheimExample(), null, 2))"
node --test scripts/project-name-alias.test.mjs
```

[Implementierung](../scripts/project-name-alias.mjs) ·
[Tests](../scripts/project-name-alias.test.mjs)

Die Tests prüfen die Auflösung, gleiche Namen in verschiedenen Registern,
Kollisionen innerhalb einer Instanz und die Ablehnung von zusätzlich
eingeschobenen Guthaben-, Berechtigungs- oder Anspruchsfeldern. Ein bestandener
Test belegt das deklarierte Softwareverhalten; er entscheidet keine Rechtsfrage.

## Diskussions- und Fortsetzungspunkte

1. In welchem genau bezeichneten Projekt soll die Zuordnung verwendet werden?
2. Soll sie Navigation, Suche, ein Spielkonzept oder eine Visualisierung steuern?
3. Falls später eine reale Gegenleistung vereinbart wird: Wer bietet welche
   Leistung, welche Vergütung und welche Rechte ausdrücklich an?

Eine freiwillig vereinbarte Vergütung für eine benannte Leistung ist ein
eigener möglicher Weg. Diese Namensdefinition enthält weder ein solches Angebot
noch eine Zustimmung einer anderen Partei.

[Diskussion im Research-Repository](https://github.com/Juri-Halveth/open-research-branches/discussions)

### Prüfstand

- `OBSERVED`: Der gebundene lokale Suchlauf; seine Coverage ist oben benannt.
- `MODEL`: Die selbst definierte Zuordnung im ausführbaren Beispiel.
- `UNKNOWN`: Verfügbarkeit in externen Registern und konkrete künftige Angebote.
- `NOT_PROVEN`: Ein Vermögens- oder Zahlungsanspruch allein aus der Zuordnung.
- Wiederaufnahme: ein benanntes Zielregister mit Regeln oder eine konkrete
  gewünschte Anwendungsfunktion. Die aktuelle Demo besitzt ausschließlich
  den Geltungsbereich ihrer Registerinstanz.

## English summary

This example creates a user-defined concept alias, “Solstheim → SOL”, in one
in-memory project registry. It demonstrates naming and exact lookup. It does
not reserve a global name, alter Solana account state or establish entitlement
to existing SOL. A negative search result is limited to its search coverage.

New original prose and example code: HALVETH Research, with AI-assisted
implementation and review; governed by the prospective rules in
[LICENSES.md](../LICENSES.md). Cited names, game material and third-party
documentation retain their respective rights. This repository does not grant
rights over them.
