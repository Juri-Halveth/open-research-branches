# Was heißt „beobachteter Zustand“?

Die Box um „echter Weltzustand sichtbar“ war typografische Hervorhebung. Sie führte keinen stärkeren Beweis und keine besondere Variable ein. Für eine technische Aussage verwenden wir einen benannten, beobachteten Zustand:

\[
O_i = \mathcal O_i(S_{E,R}(t_i))
\]

`E` ist die gebundene Umgebung, `R` das benannte Objekt, `t_i` der Zeitpunkt. `S` ist sein Zustand; der Beobachtungsoperator `O` erfasst davon ausgewählte Felder. Das beobachtete Ergebnis ist weder der gesamte Weltzustand noch automatisch eine vollständige Sicht auf das Objekt.

```json
{
  "observationId": "OWN-MODEL-002",
  "environment": "OWN_OFFLINE_MODEL",
  "object": "event-archive",
  "sourceVersion": "BOUND_SOURCE_COMMIT",
  "eventTime": "UNKNOWN",
  "recordedAt": "2026-10-07T12:00:00Z",
  "method": "READ_ONLY_STATE_SNAPSHOT",
  "observedFields": {"eventCount": 1},
  "coverage": ["eventCount"],
  "unobserved": ["external systems", "earlier unrecorded states"],
  "evidenceState": "DECLARED_EXAMPLE",
  "authorityEffect": "NONE"
}
```

Das Beispiel ist synthetisch. Eine tatsächliche Observation bindet zusätzlich ihre Rohquelle und deren Digest. Ein Digest bindet Bytes; die Methode und die zuständige Quelle bestimmen, was daraus folgt.

## Zustandsdifferenz und Folgerung

Eine Differenz setzt denselben Objektbezug, kompatible Versionen, Feldbedeutungen, Zeitbasis und Beobachtungsmethoden voraus. `Delta = compare(O_before, O_after)` benennt zunächst eine beobachtete Differenz. Die Verursachung durch eine Operation benötigt zusätzliche Evidenz. Ein Rücksetzen ist ein eigener Vorgang mit eigener Nachbeobachtung; es entfernt keine externen oder historischen Folgen.

Eine schutzwidrige Leseoperation kann bereits eine Vertraulichkeitswirkung haben. Ein schreibender Zustandswechsel ist deshalb keine universelle Bedingung für jede Sicherheitsmeldung. Erwartetes Verhalten und tatsächlich beobachtetes Verhalten benötigen dieselbe gebundene Umgebung und den jeweiligen Berechtigungskontext.

| Begriff | Technischer Referent |
| --- | --- |
| Beobachteter Zustand | Benannte Felder eines benannten Objekts, Quelle, Methode und Zeit |
| Zustandswechsel | Vergleichbare Beobachtungen oder ein gebundenes Ereignisprotokoll |
| Root im Modell | Definierter Ursprungs- oder Wurzelknoten eines Graphen |
| Betriebssystem-Root | Privilegien des jeweiligen Betriebssystems |
| Web-Adminrolle | Produkt- und ressourcenbezogene Berechtigungen |
| Offizielles Bounty-Asset | In der aktuellen Programmpolicy benannter Prüfgegenstand |
| Programmeingang / Annahme | Tatsächlicher Portalbeleg mit eigenem Status |

Ein Rootbegriff überträgt keine Eigenschaften auf die anderen. Ein Statuscode beantwortet nur die beobachtete Anfrage. Der Fund auf Umgebung B bleibt an B gebunden; ein behaupteter Befund auf A benötigt seine eigene Quelle. Offene Modellfragen bleiben registriert, während eine reale Zugriffssperre eingehalten wird.

Die Formel enthält keine Raumzeitmessung. Eine solche Hypothese benötigt einen eigenen physikalischen Referenten, ein unterscheidendes Messsignal und eine gebundene Methode.

[Code-DNA](../../CODE_DNA.md) · [Umgebung zuerst](ENVIRONMENT_FIRST.md) · [Rückblick](RETROSPECTIVE.md)
