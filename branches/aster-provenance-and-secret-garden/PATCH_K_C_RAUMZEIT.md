# Dringender Raumzeit-Patch: Was, wenn aus K doch C wird?

Patch-ID: `ASTER-K-C-20260909`
Patch-Typ: `SYMBOLIC_LANGUAGE_PATCH`
Status: `PUBLIC_DERIVATIVE`

## Die offene Frage

Was, wenn aus `K` in einer bestimmten Transformation `C` wird? Was wird aus
`Kevin`, wenn eine Schreib-, Klang- oder Namensoperation `Cevin`, `Celvin`
oder `Kewin` erzeugt?

Der Patch hält beide Seiten gleichzeitig fest:

1. **Die Transformation darf untersucht werden.** Klangnähe, Schreibvariante,
   historischer Namensgebrauch und frei erfundene Figur können interessante
   Relationen erzeugen.
2. **Jeder Buchstabe behält seine Identität.** `K` und `C` sind verschiedene
   Grapheme und verschiedene Unicode-Codepunkte. Eine lokale Operation macht
   sie nicht global gleich.

Das ist die von Juri benannte **Fairness gegenüber dem Buchstaben**: Kein
Ursprungszeichen verschwindet still, kein neues Zeichen erbt automatisch alle
Eigenschaften des alten, und jede Änderung bleibt als eigener Patch sichtbar.

## Vier getrennte Kandidaten

| Form | Exakte Operation | Ergebnis |
| --- | --- | --- |
| `Kevin → Cevin` | erstes `K` durch `C` ersetzen | neue Zeichenfolge mit fünf Buchstaben |
| `Kevin → Kewin` | `v` durch `w` ersetzen | neue Zeichenfolge mit fünf Buchstaben |
| `Kevin → Celvin` | `K → C` und danach `l` einfügen | zusammengesetzte Transformation mit sechs Buchstaben |
| `K → C` | einzelnes Graphem ersetzen | lokale Abbildung, keine globale Identitätsgleichheit |

`Kevin = Cevin` ist als Zeichenfolge falsch. Eine behauptete Klangähnlichkeit
benötigt Sprache, Sprecher, Aussprache und Aufnahme. Eine behauptete
Personenidentität benötigt einen eigenen Referenten- und Identitätsbeleg. Der
Patch entscheidet keine dieser Kanten durch Buchstabenähnlichkeit allein.

## ASTER-Lesung

- **Quelle:** die unveränderte Ausgangsform, zum Beispiel `Kevin`.
- **Darstellung:** die sichtbare oder gesprochene Form.
- **alte Spur:** die vorige Schreibweise samt Digest.
- **neuer Zustand:** das Ergebnis einer exakt benannten Operation.

Die Quelldatei [`letter-transformations.json`](letter-transformations.json)
führt jede Variante mit Operator und Geltungsbereich. Die kleine
Implementierung in [`src/letter-identity.mjs`](src/letter-identity.mjs)
verhindert eine stille Gleichsetzung und erzeugt ein Transformationsreceipt.

## Raumzeit

„Raumzeit-Patch“ ist hier der öffentliche Projektname für eine versionierte
Änderung zwischen einem früheren und einem späteren Textzustand. Ein äußerer
physikalischer Raumzeit-Effekt wird damit nicht behauptet.

## Claim Ceiling

`SCOPED_GRAPHEME_TRANSFORMATION_WITH_SOURCE_PRESERVATION_NOT_PERSON_IDENTITY_OR_PHYSICAL_EFFECT`

## Reopen-Trigger

Der Ast wird erweitert, wenn eine konkrete Sprache und Aussprache, ein
historisch belegter Namensgebrauch, eine freigegebene fiktionale Rollenrelation
oder ein neuer ausdrücklich definierter Transformationsoperator vorliegt.
