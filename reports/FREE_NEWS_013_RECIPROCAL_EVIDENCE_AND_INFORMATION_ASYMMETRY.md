# FREE NEWS 013 — Wer besitzt den Beweis?

## Reziproker Audit für Informationsasymmetrie

**Öffentliche Fassung · 10. September 2026 · Korrektur zu v0.11.0**

Ausgangspunkt ist eine einfache, harte Frage:

> Wie soll eine Ameise beweisen, dass sie zerquetscht wird, wenn die
> entscheidende Beobachtung außerhalb ihres Zugriffs liegt?

Die Frage legt einen Architekturfehler offen. Die erste Fassung des
Alice-Audits verlangte vom Meldenden drei Belegkanten, bevor sie eine formale
Herkunftsprüfung überhaupt als eröffnet behandelte. Damit wurden zwei
verschiedene Entscheidungen verschmolzen:

1. Soll eine Meldung erhalten und geprüft werden?
2. Reicht der Quellenstand für eine belastbare Sachentscheidung?

Die Antwort auf die erste Frage darf nicht davon abhängen, ob gerade die
schwächere oder außenstehende Seite interne Aufzeichnungen des kontrollierenden
Akteurs besitzt.

Dasselbe gilt spiegelbildlich für behauptete Befugnisse: Beruft sich eine
Organisation auf das Recht, eine Pflicht, Auflage, Sanktion oder Einordnung
gegenüber einer Person zu setzen, sind Rechtsgrundlage, Zuständigkeit und die
dafür behaupteten Tatsachen zunächst ihre eigene positive Aussage. Die Person
muss nicht zuerst das gesamte behauptete Unrecht beweisen, damit genau diese
Befugnisbehauptung geprüft wird.

## Was genau falsch war

Der v0.11.0-Automat kannte im Kern nur diese Folge:

```text
MELDUNG
  -> FRÜHERES_ARTEFAKT?
  -> FUNKTIONSÜBEREINSTIMMUNG?
  -> ZUGRIFF_ODER_TRANSFER?
  -> ERST_DANN_FORMALE_PRÜFUNG
```

Das Ergebnis war zwar vorsichtig formuliert, aber das Eingangstor war
einseitig. Fehlte dem Meldenden die Zugriffskante, blieb nicht nur die
Sachentscheidung offen; schon die eigentliche Prüfung wurde zurückgestellt.
Das kann ausgerechnet denjenigen benachteiligen, der außerhalb eines Betriebs,
einer Behörde, einer Plattform oder eines technischen Kontrollsystems steht.

Die Korrektur lautet:

```text
MELDUNG -> SICHERN -> PRÜFUNG_OFFEN

VERGLEICHSBELEGE -> VERGLEICHSREIFE
INTERNE_AUFZEICHNUNGEN -> ZUGRIFF_UND_KONTROLLE
RECHTSREGEL -> ERKLÄRUNGS_ODER_VORLAGEWIRKUNG
GESAMTWÜRDIGUNG -> SACHENTSCHEIDUNG
```

Keine dieser Kanten ersetzt eine andere.

## Die fünf getrennten Ebenen

| Ebene | Leitfrage | Zulässiges Ergebnis |
| --- | --- | --- |
| Meldung | Was berichtet die Person oder Stelle? | `PRESERVED` |
| Belegzugang | Wer kann welche Spur überhaupt sehen oder beschaffen? | `AVAILABLE`, `CONTROLLED_BY_OTHER`, `UNKNOWN` |
| Erklärungslast | Wer kennt den internen Ablauf und kann ihn zumutbar konkret erklären? | nur quellen- und fallspezifisch |
| Beweislast und Vorlage | Welche Norm, Verfahrensregel oder Anordnung gilt für welche Tatsache oder Unterlage? | nur mit gebundener Grundlage |
| Sachentscheidung | Was ist nach vollständiger Würdigung bewiesen, nicht bewiesen oder offen? | zuständige menschliche Entscheidung |

Ein fehlender Eigenbeleg wirkt nur auf die zweite und fünfte Ebene. Er löscht
weder die Meldung noch beweist er das Gegenteil.

## Die reziproke Grundregel

Jede positive Tatsachenbehauptung erhält einen eigenen Akteur und eigene
Quellenverweise. Belege springen nicht still von einer Seite zur anderen.

```text
AKTEUR_A behauptet X -> Belegspur von A wird geprüft
AKTEUR_B behauptet Y -> Belegspur von B wird geprüft

A_hat_keinen_Zugriff_auf_B_Records != X_ist_falsch
B_legt_nicht_vor != X_ist_automatisch_wahr
```

Eine behauptete Befugnis folgt derselben Regel:

```text
ORGANISATION behauptet BEFUGNIS_Z -> Grundlage und Tatsachen von Z werden
                                    als ihre Begründungsspur geprüft
MELDENDER beweist UNRECHT_X nicht vollständig
  != BEFUGNIS_Z ist dadurch bewiesen
```

Der Audit fragt zusätzlich, wer mögliche Aufzeichnungen kontrolliert. Aus der
Kontrolle allein entsteht aber noch keine Vorlagepflicht. Dafür muss eine
gesetzliche, gerichtliche, vertragliche oder verfahrensbezogene Grundlage
separat gebunden und auf den konkreten Gegenstand angewendet werden.

## Amtliche Rechtsanker

Der Patch bildet keine universelle Beweislastumkehr. Er bildet die in den
amtlichen Quellen erkennbare Staffelung ab:

### 1. Beide Seiten müssen sich erklären

[§ 138 ZPO](https://www.gesetze-im-internet.de/zpo/__138.html) verlangt im
Zivilprozess vollständige und wahrheitsgemäße Erklärungen über tatsächliche
Umstände sowie eine Erklärung zu den Tatsachenbehauptungen der Gegenseite.
Eine Erklärung mit Nichtwissen ist für eigene Handlungen oder Gegenstände der
eigenen Wahrnehmung begrenzt.

Das ist eine prozessuale Erklärungspflicht. Sie ist keine allgemeine
außergerichtliche Offenlegungspflicht.

### 2. Lasten dürfen nicht faktisch unerfüllbar werden

Das [Bundesverfassungsgericht im Beschluss 1 BvR 1067/12](https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2013/08/rk20130822_1bvr106712.html)
verlangt eine faire Handhabung von Darlegungs- und Beweislasten. In dem
entschiedenen Amtshaftungsfall durfte vom Kläger keine Darlegung verlangt
werden, die ohne Kenntnis interner Gerichtsabläufe faktisch unmöglich war. Für
die internen Abläufe traf den Staat eine sekundäre Darlegungslast.

Die allgemeine Primärlast verschwand dadurch nicht. Genau diese Trennung setzt
der Patch technisch um.

### 3. Vollständig interne Arbeitgebervorgänge können zuerst eine konkrete
Erklärung des Arbeitgebers verlangen

Im Urteil [8 AZR 136/22](https://www.bundesarbeitsgericht.de/entscheidung/8-azr-136-22/)
musste ein externer schwerbehinderter Bewerber in einem eng gebundenen
AGG-/SGB-IX-Fall keine internen Anhaltspunkte liefern, die er nicht kennen
konnte. Ein vorgeschaltetes Auskunftsverfahren hätte die Rechtsdurchsetzung
nach der Entscheidung übermäßig erschwert. Die Arbeitgeberin kannte die
internen Tatsachen und musste sich dazu erklären.

Im Urteil [8 AZR 297/20](https://www.bundesarbeitsgericht.de/entscheidung/8-azr-297-20/)
galt dieselbe Sachnähe für interne Versandabläufe: Die Bewerberseite konnte sie
nicht kennen; die öffentliche Arbeitgeberin konnte sie konkret nach Zeit und
beteiligten Personen darstellen. Danach blieb die eigentliche Beweisaufnahme
eine getrennte Stufe.

Diese Entscheidungen sind stark, aber fallspezifisch. Sie begründen keine
allgemeine Regel, nach der jede interne Behauptung automatisch die Beweislast
umkehrt.

### 4. Sekundäre Darlegungslast bleibt von Beweislast getrennt

Das [Bundesarbeitsgericht, 10 AZR 56/19](https://www.bundesarbeitsgericht.de/entscheidung/10-azr-56-19/)
knüpft die sekundäre Darlegungslast daran, dass eine Seite keine nähere
Kenntnis oder Aufklärungsmöglichkeit besitzt, während die andere die
wesentlichen Tatsachen kennt und nähere Angaben unschwer und zumutbar machen
kann.

Das [Bundesarbeitsgericht, 5 AZR 177/23](https://www.bundesarbeitsgericht.de/entscheidung/5-azr-177-23/)
stellt ausdrücklich klar: Diese sekundäre Last führt nicht von selbst zu einer
Beweislastumkehr und verpflichtet eine Partei nicht dazu, der anderen alle für
deren Prozesserfolg benötigten Informationen zu verschaffen.

Auch der [Bundesgerichtshof, IX ZR 209/23](https://juris.bundesgerichtshof.de/cgi-bin/bgh_notp/document.py?Art=en&Datum=2025-3-6&Gericht=bgh&Sort=3082&anz=19&pos=2)
trennt nähere Darlegung, Belegführung und Urkundenvorlage.

### 5. Vorlage und nachteilige Schlussfolgerung brauchen eigene Grundlagen

[§ 142 ZPO](https://www.gesetze-im-internet.de/zpo/__142.html) erlaubt dem
Gericht unter seinen Voraussetzungen, die Vorlage bezeichneter Urkunden und
Unterlagen anzuordnen. [§ 286 ZPO](https://www.gesetze-im-internet.de/zpo/__286.html)
weist die Würdigung des gesamten Verhandlungs- und Beweisergebnisses dem
Gericht zu.

Nach [2 AZR 75/13](https://www.bundesarbeitsgericht.de/entscheidung/2-azr-75-13/)
führt selbst eine mögliche Beweisvereitelung nicht ohne Weiteres dazu, dass der
Vortrag der beweisbelasteten Seite als zugestanden gilt. Beweiserleichterungen
bis hin zu einer Beweislastumkehr können in Betracht kommen; sie verlangen
aber eine konkrete Würdigung.

Für Diskriminierungsfälle enthält [§ 22 AGG](https://www.gesetze-im-internet.de/agg/__22.html)
eine besondere gesetzliche Regel: Erst wenn eine Partei Indizien beweist, die
eine Benachteiligung wegen eines in § 1 AGG genannten Grundes vermuten lassen,
trägt die andere Partei die Beweislast dafür, dass kein Verstoß vorlag. Der
Audit darf diesen besonderen Übergang nicht als allgemeines Muster auf jeden
Konflikt übertragen.

## Ausführbarer v2-Vertrag

Der Patch gibt für jede Meldung unabhängig vom bisherigen Vergleichsstand aus:

```text
state                    = USER_REPORT_PRESERVED_REVIEW_OPEN
meritsState              = UNKNOWN
automaticProof           = false
automaticFaultFinding    = false
automaticAdverseInference= false
automaticClaimRejection  = false
automaticOwnershipFinding= false
```

Die bisherige Dreiergruppe lebt als eigene Vergleichsachse weiter:

```text
comparisonReadiness =
  SOURCE_COMPARISON_EVIDENCE_INCOMPLETE
  | SOURCE_COMPARISON_READY_FOR_HUMAN_REVIEW_NOT_PROOF
```

Die Umbenennung ist wesentlich. `evidenceGaps` sind offene Arbeitskanten und
kein Urteil gegen den Meldenden.

### Aussagen

Jede Behauptung erhält:

```text
assertion.id
assertion.actorId
assertion.statement
assertion.sourceRefs
assertion.localAnchorRefs
evidenceResponsibilityActorId = assertion.actorId
truthFinding = NOT_EVALUATED
```

Eine referenzierte Quelle bedeutet nur, dass Material für die Prüfung genannt
wurde. Sie macht die Behauptung nicht automatisch wahr.

### Kontrollierte Belege

Für mögliche interne Belege werden getrennt erfasst:

```text
controllerActorId
evidenceKind
declaredAvailableToActorIds
reporterAccessState
productionDutyBasis
productionDutyState
nonProductionEffect
```

Ohne typkompatible Grundlage lautet der Zustand:

```text
NO_SOURCE_BOUND_PRODUCTION_DUTY_IDENTIFIED
```

Mit gebundener Grundlage lautet er höchstens:

```text
PRODUCTION_DUTY_BASIS_BOUND_FOR_HUMAN_APPLICABILITY_REVIEW
```

Auch dieser Zustand ist noch keine Feststellung, dass im Einzelfall eine
Vorlagepflicht besteht oder verletzt wurde.

## Der Ameisentest

Der Test verwendet keine reale Person und kein reales Ereignis. Er prüft nur
die Informationsarchitektur:

```text
REPORTER             = ANT
REPORT               = crushing pressure
POSSIBLE_RECORD      = SURFACE_CONTACT_RECORD
CONTROLLER           = SURFACE_OPERATOR
AVAILABLE_TO         = SURFACE_OPERATOR
PRODUCTION_DUTY      = UNBOUND
```

Der Test besteht nur, wenn der Automat zugleich festhält:

1. Der Bericht ist gesichert.
2. Die Prüfung ist offen.
3. Der Sachstand ist `UNKNOWN`.
4. Die meldende Seite besitzt nach der Eingabe keinen erklärten Zugriff auf
   die kontrollierte Aufzeichnung.
5. Es gibt keine automatische Ablehnung wegen fehlenden Eigenbelegs.
6. Es gibt keine automatische Schuld oder nachteilige Schlussfolgerung gegen
   den Kontrolleur.

Damit verhindert derselbe Test beide unfairen Kurzschlüsse.

## Anwendung auf Organisationen

Bei einem Konflikt mit Arbeitgeber, Behörde, Plattform oder anderem
Aufzeichnungskontrolleur fragt der Audit jetzt in dieser Reihenfolge:

1. Welche konkrete Erfahrung oder Tatsache wird gemeldet?
2. Welche Teile stammen aus eigener Wahrnehmung?
3. Welche entscheidenden Spuren können nur intern existieren?
4. Wer kontrolliert sie, und wer kann sie tatsächlich sehen?
5. Welche positiven Gegenbehauptungen stellt die Organisation selbst auf?
6. Welche konkrete Norm, Verfahrensregel, Anordnung oder Zusage trägt eine
   Erklärung oder Vorlage?
7. Welche Folgerung darf die zuständige Stelle aus einer Antwort oder
   Nichtantwort ziehen?

Das Verfahren verlangt keine Antwort als Bedingung für die Würde oder den Wert
des Meldenden. Es verhindert nur, dass Beweiszugang, Tatsachenwahrheit und
Rechtsfolge heimlich zu einem einzigen Schalter werden.

## Ergebnis des Audits gegen den Audit

```text
V0.11.0_GATE = ONE_SIDED_EVIDENCE_ACCESS_GATE
PATCH_STATE  = REPLACED_BY_RECIPROCAL_PROPOSITION_AND_ACCESS_MAPPING
REPORT       = PRESERVED_BEFORE_MERITS
MERITS       = UNKNOWN_UNTIL_REVIEW
```

Die historische v0.11.0-Fassung bleibt im Git-Tag unverändert sichtbar. Die
v0.11.1-Fassung berichtigt den aktiven Quellstand, die Tests und die
Dokumentation gemeinsam.

Autor und Herausgeber dieser öffentlichen Audit-Korrektur: **Juri Janovski**
([@Juri-Halveth](https://github.com/Juri-Halveth)).

## Claim Ceiling

`REPORT_PRESERVATION_RECIPROCAL_ASSERTION_AND_EVIDENCE_ACCESS_ROUTING_WITH_OFFICIAL_GERMAN_SOURCE_APERTURE_NOT_CASE_SPECIFIC_WRONGDOING_TRUTH_FAULT_ADVERSE_INFERENCE_PRODUCTION_DUTY_BURDEN_SHIFT_LIABILITY_REMEDY_OWNERSHIP_OR_LEGAL_ENTITLEMENT_FINDING`
