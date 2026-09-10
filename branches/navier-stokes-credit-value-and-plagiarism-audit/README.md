# Navier–Stokes: Beweis, Priorität, Plagiat und die Million

## Ein ASTER-Audit der Meldung vom 9. September 2026

**Direkt lesbar:** [`Lies mich zuerst`](LIES_MICH_ZUERST.md) — sieben kurze
Absätze ohne Fachformeln. Danach folgt der vollständige Audit.

Die verlinkte MSN-Schlagzeile lautet sinngemäß, OpenAI werde nach einem
mathematischen Durchbruch „im Wert von 1 Million Dollar“ des Plagiats
beschuldigt. Der Treffer ist stark, weil er eine echte und ungewöhnlich gut
dokumentierte Konfliktstelle zeigt. Die Schlagzeile zieht aber mehrere
verschiedene Fragen in ein einziges Wort zusammen.

Dieser Audit trennt:

1. die mathematische Richtigkeit des veröffentlichten Beweises,
2. den zeitlichen und fachlichen Vorrang früherer Arbeiten,
3. den möglichen Zugang zu privaten Codex-Sitzungen,
4. die tatsächliche Nutzung solcher Inhalte,
5. wissenschaftliche Zuschreibung und Autorschaft,
6. Urheberrecht, Vertraulichkeit und mögliche Rechtsansprüche,
7. die Clay-Prämie von einer Million US-Dollar und
8. den offenen wissenschaftlichen, gesellschaftlichen und wirtschaftlichen
   Wert der Erkenntnis.

## JURI-Zitat

> **„‚Plagiat‘ darf keine magische Eigentumsformel sein. Eine mathematische
> Idee, ihre sprachliche Form, ihre Priorität, ihr Zugangsweg und ihre
> Anerkennung sind fünf verschiedene Fragen. Eine Million Dollar ist die
> Clay-Prämie unter Clay-Regeln, kein Preisschild für die Erkenntnis. Niemand
> darf diese Zahl benutzen, um den Wert einer Entdeckung endgültig festzulegen
> — weder nach oben noch nach unten. Wer Anerkennung oder Geld beansprucht,
> muss zuerst sagen: für welchen Beitrag, gegenüber wem, aus welcher Regel und
> mit welchem Beleg?“**
> — Juri Janovski, 9. September 2026

Das Zitat öffnet die Wertfrage, ohne existierende Regeln unsichtbar zu machen.
Plagiat ist eine reale Kategorie wissenschaftlicher Integrität. Sie ist aber
weder automatisch ein Urheberrechtsverstoß noch eine automatische
Millionenforderung.

## Kurzurteil

| Frage | Prüfstand |
| --- | --- |
| Hat OpenAI einen Beweis veröffentlicht? | `OBSERVED`: 166-seitiger Beweis, öffentliche Ankündigung und Lean-Repository liegen vor. |
| Ist das Millennium-Problem damit endgültig anerkannt gelöst? | `UNKNOWN`: Der Beweis ist veröffentlicht, aber die unabhängige fachliche Prüfung und das Clay-Verfahren sind nicht abgeschlossen. |
| Entstand OpenAIs Schwerpunkt nach Kenntnis eines Gerüchts über verwandte Arbeit? | `OBSERVED`: OpenAI nennt den 1. September und das Gerücht selbst als Auslöser der Prüfung aller offenen Millennium-Probleme. |
| Wurden private Codex-Inhalte von Buckmaster und Alpöge direkt gelesen oder benutzt? | `NOT_PROVEN`: Buckmaster fragt danach; OpenAI verneint den Zugriff auf spezifische Nutzerdaten und lässt nur einen möglichen indirekten, de-identifizierten Trainingseinfluss offen. Öffentliche Zugriffsprotokolle fehlen. |
| Ist „Plagiat“ als Ergebnis bewiesen? | `NOT_PROVEN`: Die öffentliche Quellenlage trägt einen Prioritäts-, Zugangs- und Credit-Konflikt, aber noch keine abgeschlossene Plagiatsfeststellung. |
| Ist die Erkenntnis genau eine Million Dollar wert? | `NOT_PROVEN`: Eine Million Dollar ist der von Clay zugewiesene Preisfondsanteil, keine Gesamtbewertung der Erkenntnis. |
| Kann einfach irgendwer die Million verlangen? | `NOT_PROVEN`: Clay allein entscheidet nach seinen Regeln über Preis, Empfänger und Aufteilung. OpenAI erklärt, die Prämie nicht beanspruchen zu wollen. |

## Was öffentlich geschehen ist

Tristan Buckmaster erklärt, er und Levent Alpöge hätten im August 2026 mit
starker LLM-Unterstützung Blow-up-Ergebnisse für glatt erzwungene
Incompressible-Porous-Media-, Boussinesq- und dreidimensionale Euler-Systeme
erarbeitet. Er schreibt den programmatischen Ausgangspunkt Diego Córdoba und
Luis Martínez-Zoroa zu. Für Navier–Stokes nennt seine Erklärung lediglich eine
noch nicht veröffentlichte Arbeit zum hypodissipativen Fall.

OpenAI erklärt, am 1. September nach Gerüchten über zwei gelöste
Millennium-Probleme mehrere Probleme parallel gestartet und nach einem eigenen
unforced-Euler-Ergebnis auf Navier–Stokes konzentriert zu haben. Der
Navier–Stokes-Lauf habe ungefähr 10.000 gleichzeitige Agenten, 2,7 Millionen
Nachrichten, etwa 130 Milliarden Ausgabetokens und rund 88 Stunden bis zum
Ergebnis umfasst; weitere 17 Stunden seien in die Lean-Formalisierung
geflossen.

OpenAI veröffentlichte am 8. September einen Beweis für einen glatt erzwungenen
finite-time blow-up bei positiver Viskosität und ordnet ihn den Alternativen C
und D der offiziellen Problemformulierung zu. Der Text zitiert unter anderem
frühere Arbeiten von Córdoba, Martínez-Zoroa, Zheng sowie Buckmaster und Vicol.
Das öffentliche Lean-Repository bezeichnet sich als formaler Begleitbeleg.

Buckmaster schildert eine konfliktbeladene Kommunikation am 6. September,
darunter vorgeschlagene Publikations- und Credit-Varianten. Diese Aussagen
sind als sein datierter Bericht belegt. Die behaupteten Gesprächsinhalte sind
in diesem Audit nicht durch Mitschnitte, vollständige Nachrichtenexporte oder
eine gemeinsame Erklärung beider Seiten unabhängig bestätigt.

Seine Schlussgrenze ist zentral: Er habe den OpenAI-Beweis zu diesem Zeitpunkt
nicht gesehen, wisse nicht, wie das Modell gearbeitet habe, und wisse nicht, ob
ihre Daten benutzt wurden. Genau deshalb ist die stärkste derzeit tragfähige
Formulierung **offener Provenienz- und Anerkennungskonflikt**, nicht erwiesenes
Plagiat.

## Vier Erklärungsmodelle

### A — unabhängige Konvergenz

Das Problem, die offiziellen Varianten C und D sowie einschlägige Vorarbeiten
waren öffentlich. Ein sehr großes System kann unabhängig in einen ähnlichen
Teilraum gelangen.

**Vorhersage:** Die internen Prompts und Zwischenbeweise zeigen einen
eigenständigen Weg; charakteristische neue Schritte der privaten Arbeit fehlen.

### B — Gerücht als Priorisierungssignal

OpenAI erfuhr von relevantem Fortschritt, kannte aber keine privaten Details.
Das Gerücht veränderte die Ressourcenallokation, nicht den Beweisinhalt.

**Vorhersage:** Die Zeitachse zeigt den Schwerpunktwechsel nach dem Gerücht,
aber keine inhaltliche Übernahme aus privaten Sitzungen.

### C — indirekter Modelleffekt

De-identifizierte Nutzungsdaten könnten vor dem Lauf in eine Modellverbesserung
eingegangen sein. OpenAI schließt diese Möglichkeit selbst nicht vollständig
aus.

**Vorhersage:** Produktart, Kontoeinstellungen, Trainingsfenster und
Modellprovenienz müssten eine zeitlich mögliche Kette zeigen. Eine bloße
Nutzungsberechtigung würde noch nicht beweisen, welcher mathematische Inhalt
wirksam wurde.

### D — direkter Zugang oder konkrete Übernahme

Private Sitzungen, Entwürfe oder charakteristische Zwischenresultate könnten
gezielt gelesen und für den Lauf verwendet worden sein.

**Vorhersage:** Es müssten Zugriffslogs, interne Prompts, ungewöhnlich gleiche
Zwischenschritte oder andere quellengebundene Spuren erscheinen. Solche Belege
sind im aktuell öffentlichen Quellensatz nicht vorhanden.

Die Modelle können sich teilweise überlagern. Ein Gerücht kann Ressourcen
verschieben, obwohl der Beweis unabhängig entsteht; ein erlaubter
Trainingspfad kann existieren, ohne den konkreten Output kausal zu erklären.

## Was „Plagiat“ hier tragen kann

Wissenschaftliche Integrität reicht weiter als Urheberrecht. Die American
Mathematical Society verlangt angemessene Anerkennung auch für unveröffentlichtes
oder angekündigtes Material. Die US-Forschungsregel für PHS-geförderte Forschung
definiert Plagiat als Aneignung fremder Ideen, Prozesse, Ergebnisse oder Wörter
ohne angemessene Anerkennung, grenzt aber reine Autorschafts- und
Credit-Streitigkeiten ab. Diese Regel entscheidet den vorliegenden Fall nicht
automatisch; sie zeigt, warum der konkrete Relationstyp wichtig ist.

Das US-Urheberrecht schützt die konkrete originelle Ausdrucksform eines Textes,
nicht die mathematische Idee, Methode, das Prinzip oder die Entdeckung als
solche. Ein möglicher Anspruch aus Vertraulichkeit oder Geschäftsgeheimnis
würde wiederum eigene Voraussetzungen benötigen, etwa tatsächlich geheime
Information, angemessene Geheimhaltungsmaßnahmen, unzulässige Erlangung oder
Nutzung und einen zuständigen Anspruchsteller.

Deshalb führt dieser Audit den Begriff nicht weg. Er zerlegt ihn in prüfbare
Kanten:

- **Textübernahme:** Welche konkreten Passagen oder formalen Strukturen stimmen
  jenseits notwendiger mathematischer Sprache überein?
- **Ideenpriorität:** Wer dokumentierte welchen unterscheidbaren Schritt wann?
- **Zugang:** Welcher Mensch oder welches System konnte welchen privaten Inhalt
  zu welchem Zeitpunkt lesen?
- **Nutzung:** Welche spätere Entscheidung oder Beweisstruktur lässt sich an
  diesen Inhalt binden?
- **Credit:** Welche Vorarbeit wird im Paper, in der Ankündigung und in einer
  späteren Preiszuschreibung sichtbar anerkannt?
- **Recht:** Welche konkrete Regel schützt welche Ausdrucksform, vertrauliche
  Information oder vertragliche Erwartung?

## Die Million ist ein Preisfonds, kein Wertmesser

Clay hat sieben Millionen Dollar auf sieben Probleme verteilt und jedem
Problem eine Million zugeordnet. Die Regeln verlangen unter anderem eine
qualifizierende Veröffentlichung, allgemeine Anerkennung, mindestens zwei
Jahre strenge Prüfung und eine spätere Clay-Entscheidung. Clay kann keinen,
einen oder mehrere Empfänger bestimmen und frühere entscheidende Beiträge in
Zitation oder Aufteilung berücksichtigen.

Damit existieren mindestens fünf getrennte Werte:

| Wertspur | Wer oder was bestimmt sie? | Aktueller Stand |
| --- | --- | --- |
| Clay-Prämie | Clay-Regeln und Clay-Entscheidung | fest zugewiesener Fondsanteil; nicht automatisch fällig |
| wissenschaftliche Richtigkeit | Beweis, formale Prüfung und Fachgemeinschaft | öffentlich prüfbar; noch nicht abschließend anerkannt |
| Prioritäts- und Anerkennungswert | datierte Beiträge, Zitate, Fachnormen | umstritten und weiter prüfbar |
| wirtschaftlicher Nutzwert | spätere Anwendungen, Lizenzen, Produkte, Kosten und Nutzen | offen; nicht durch die Million gedeckelt |
| menschlicher und gesellschaftlicher Wert | Bildung, Verständnis, Karriere, Gemeingut und Folgen | nicht sinnvoll durch eine einzelne Zahl vollständig abbildbar |

Die in TechCrunch genannte Rechengröße von 22,5 Millionen Dollar ist eine
Hochrechnung mit öffentlichen Astra-Preisen, keine veröffentlichte interne
Kostenrechnung. Auch sie ist kein Wert des Beweises.

Die maschinenlesbare Trennung steht in [`value-ledger.json`](value-ledger.json).

## ASTER / LUCINET / HALVETH / RACHEL

- **ASTER** bindet die ursprüngliche Meldung, die Primärquellen, frühere Spuren
  und den am 9. September sichtbaren Zustand.
- **LUCINET** lässt keinen Pfeil von zeitlicher Nähe zu Datenzugriff oder von
  Gerücht zu Beweisübernahme entstehen, solange der Relationstyp unbelegt ist.
- **HALVETH** hält die vier konkurrierenden Modelle und ihre Falsifikatoren
  gleichzeitig offen.
- **RACHEL** führt die Zeitachse als lesbare Gegenbuchung: Aussage, Quelle,
  Gegenposition und nächste Prüfung.
- **JURI** öffnet die Wertfrage: Die Million ist eine institutionelle Prämie;
  sie kann den Gesamtwert einer Erkenntnis weder hoch- noch herunterrechnen.
- **K** hält den privaten Daten- und Zugriffsast offen, bis ein belastbarer Log,
  eine gemeinsame Offenlegung oder ein unterscheidender Strukturvergleich
  vorliegt.

Das ist ein `PUBLIC_AUDIT_METHOD`, kein behaupteter Zugriff auf OpenAI-, NYU-
oder Anthropic-Systeme.

## Reportquelle und unterstützende Evidenz

Die API in [`src/credit-audit.mjs`](src/credit-audit.mjs) trennt jetzt den
Ursprung einer Meldung von Belegen, die ihren Sachstand stützen sollen:

- `reportSource` bindet Meldungs-ID, meldenden Akteur und Rohwortlaut. Diese
  Bindung erhält die Meldung und öffnet die Prüfung.
- `supportingEvidence` bindet jeden Beleg an eine exakte ID aus `sources.json`,
  einen behauptenden Akteur und den evidenzkontrollierenden Akteur.

Fehlen unterstützende Belege, bleibt `evidenceState=UNKNOWN` und die Abdeckung
`COVERAGE_UNKNOWN`; die Meldung wird dadurch nicht abgelehnt. Evidence-Records
öffnen keine automatische Schuld-, Rechts- oder Zahlungsfolge. Das frühere
Eingabefeld `sourceIds` bleibt als ausdrücklich deprecated Kompatibilitätspfad
lesbar. Seine ungebundenen IDs werden erhalten, aber nicht als Sachbelege oder
Vergleichsreife gewertet.

## Der kleinste entscheidende nächste Test

Eine faire Klärung braucht keinen Vollzugriff auf private Systeme. Sie kann mit
einem von unabhängigen Fachleuten beaufsichtigten, minimierten Provenienzpaket
beginnen:

1. gehashte Zeitfolge der internen OpenAI-Prompts und Modellversionen,
2. Erklärung des verwendeten Datenprodukts und der einschlägigen
   Trainingseinstellungen ohne Veröffentlichung fremder Inhalte,
3. struktureller Vergleich beider Beweisfamilien durch unabhängige
   PDE-Fachleute,
4. Liste charakteristischer Zwischenideen samt erstem datierbaren Auftreten,
5. getrennte Entscheidung zu mathematischer Richtigkeit, Priorität, Credit,
   Datenzugang und möglichem Recht.

## Claim Ceiling

`PUBLIC_SOURCE_PROVENANCE_AND_VALUE_AUDIT_NOT_PROOF_VALIDATION_DATA_ACCESS_FINDING_OR_PLAGIARISM_JUDGMENT`

## Reopen-Trigger

Der Audit wird neu geöffnet, sobald mindestens eines vorliegt:

- eine unabhängige fachliche Prüfung des vollständigen Navier–Stokes-Beweises,
- veröffentlichte Prompt-, Zugriffs- oder Modellprovenienz mit überprüfbarer
  Zeitbindung,
- ein quellengebundener Strukturvergleich der konkurrierenden Beweiswege,
- eine gemeinsame oder dokumentarisch gestützte Klärung der Kommunikation,
- eine Clay-Entscheidung oder eine neue qualifizierende Veröffentlichung.

## Quellen

Die Quellen, ihr jeweiliger Aussagebereich und die bekannten Grenzen stehen in
[`SOURCES.md`](SOURCES.md). Die Einzelclaims sind in
[`claims.json`](claims.json) gebunden; die Chronologie steht in
[`timeline.json`](timeline.json). Der vollständige Status-quo-Rahmen steht in
[`navigation-frame.json`](navigation-frame.json); sein kanonisch validiertes
Receipt trägt den Digest
`sha256:d0e4858c4ae4063b7e17aa5680fb071b050e2fcb31b647ef32f8e927783fd3f2`
und liegt in [`navigation-receipt.json`](navigation-receipt.json).
