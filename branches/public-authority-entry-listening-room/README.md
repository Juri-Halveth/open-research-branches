# Geburtsraum-Prinzip für Behördeneingänge

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

**Öffentlicher Systementwurf von Juri Janovski · 10. September 2026**

Dieser Forschungsast überträgt ein Kernelement der öffentlichen
[`Juri-Janovski-These zur Geburt`](https://github.com/Juri-Halveth/juri-janovski-these-zur-geburt):
Der erste Eintritt in ein System soll ruhig, verständlich, selbstbestimmt und
begleitet möglich sein. Für Behörden mit Publikumsverkehr wird daraus ein
sichtbarer **Empfangs- und Zuhörraum** direkt an der Eingangsstufe.

Der Raum ist weder medizinischer Geburtsraum noch Therapieangebot. Das Wort
bezeichnet hier eine Gestaltungsanalogie: Niemand soll unter Druck erst durch
Flure, Zuständigkeiten oder Sicherheitskontrollen laufen müssen, bevor eine
verantwortliche Person zuhört, Orientierung gibt und eine sichere Weiterleitung
veranlasst.

## Die These

> Jede öffentlich zugängliche Behörde mit Empfangs- oder Eingangszonen soll
> während ihrer Öffnungszeiten eine klar erkennbare, reizarme und barrierefreie
> erste Anlaufstelle vorhalten. Dort ist eine verantwortliche Zuhör- und
> Orientierungsperson erreichbar. Eine getrennte Sicherheitsfunktion bleibt
> verfügbar. Beide arbeiten über einen klaren Übergabepunkt zusammen, ohne
> Zuhören mit Kontrolle, Diagnose oder Sanktion zu vermischen.

Das ist ein **Vorschlag für eine allgemeine Organisationspflicht**. Die
ausgewerteten Bundesnormen enthalten bereits Beratung, einfachen Zugang,
Barrierefreiheit, Annahme und Weiterleitung, Beistand, Beschwerdewege,
Arbeitsschutz und Petitionsrechte. Sie schreiben in der geprüften Fassung
jedoch keinen besonderen Zuhörraum an jedem Behördeneingang und keine
bundesweit einheitliche Rolle dieses Namens vor.

Für Bundesagentur für Arbeit, Jobcenter und andere Sozialleistungsträger ist
die Anschlussstelle besonders konkret: § 14 SGB I begründet den
Beratungsanspruch, § 16 regelt Annahme, Weiterleitung und Hilfe bei Anträgen,
und § 17 verpflichtet die Leistungsträger, unter anderem auf möglichst
einfachen Zugang und barrierefreie Verwaltungsgebäude und Leistungsräume
hinzuwirken. Die Bundesagentur bietet außerdem bereits ein bundesweites,
von ihr als eigenständig und neutral bezeichnetes Kundenreaktionsmanagement
für Lob, Anregungen, Kritik und Beschwerden. Der
vorgeschlagene Raum materialisiert diese Funktionen am physischen Eintritt,
ersetzt aber weder Antrag, Widerspruch, Klage noch gesetzliche Fristen.

## Raumvertrag

Der maschinenlesbare Vertrag liegt in [`room-contract.json`](room-contract.json).
Seine Mindestfunktionen sind:

1. **Sichtbarer Eintritt.** Der Zugang ist vom Haupteingang aus auffindbar und
   ohne vorherige Termin-, Zuständigkeits- oder Beweisprüfung erreichbar.
2. **Reizarme Wahlmöglichkeit.** Licht, Geräusch, Sitzposition und Gesprächsnähe
   lassen sich innerhalb sicherer und baulicher Grenzen anpassen. Der Raum ist
   eine freiwillige Option; niemand wird dorthin ausgesondert.
3. **Eine verantwortliche Person.** Während der Öffnungszeit ist mindestens
   eine Zuhör- und Orientierungsperson im Dienst, mit benannter Vertretung und
   tatsächlicher Weiterleitungsbefugnis.
4. **Zuhören vor Sortieren.** Eine Schilderung wird zunächst aufgenommen. Ihre
   Annahme setzt keinen vorherigen Beweis des gesamten Sachverhalts voraus.
5. **Klare nächste Kante.** Die Person nennt die zuständige Stelle, den
   möglichen formellen Schritt, die Bedeutung einer Frist und auf Wunsch einen
   nachvollziehbaren Übergabebeleg.
6. **Barrierefreie Kommunikation.** Verständliche Sprache,
   Kommunikationshilfen, Begleitung und ein mitgebrachter Beistand werden in
   den jeweils geltenden Grenzen ermöglicht.
7. **Datenarmut.** Die Nutzung des Raums bleibt freiwillig. Eine
   Gesprächsaufnahme setzt eine dafür tragfähige Rechtsgrundlage voraus; soweit
   diese eine Einwilligung ist, muss sie informiert und freiwillig sein.
   Persönliche Zufriedenheitsprofile sind ausgeschlossen. Für eine formelle
   Weiterleitung werden nur die auf der jeweils geltenden Rechtsgrundlage
   erforderlichen und zweckgebundenen Daten verarbeitet.
8. **Sicherheit für alle.** Die Zuhörrolle besitzt keine Eingriffs- oder
   Sanktionsbefugnis. Eine getrennte, erreichbare Sicherheits- und
   Notfallfunktion reagiert auf beobachtete oder glaubhaft konkret gemeldete
   Gefahr, nicht auf Identität, Diagnosevermutung oder bloße Unruhe.
9. **Formelle Rechte bleiben sichtbar.** Der Raum darf Rechtsbehelfe,
   gesetzliche Anträge, Beratungspflichten oder bestehende Beschwerdewege nicht
   verdecken, ersetzen oder verzögern.
10. **Öffentliche Lernschleife.** Aggregierte Probleme, Übergabeabbrüche,
    Wartezeiten und barrierebezogene Hindernisse werden datensparsam ausgewertet
    und führen zu überprüfbaren Reparaturmaßnahmen.

## Rolle: verantwortliche Empfangs- und Zuhörperson

`OMEGA VIBER` bleibt als öffentlich vorgeschlagener Kurzname erhalten. Der
funktionale Rollenname lautet
`PUBLIC_ENTRY_LISTENING_AND_ACCOUNTABILITY_STEWARD`.

Die Rolle soll mehr können als Wegweisen, aber weniger dürfen als eine
Eingriffsbehörde. Sie hört zu, klärt den gewünschten nächsten Schritt,
organisiert barrierefreie Kommunikation, benennt Zuständigkeit, schützt
Fristenhinweise vor dem Verschwinden und kann eine Übergabe nachverfolgen. Sie
entscheidet weder über den Leistungsanspruch noch über medizinische Fragen und
führt keine Gefahrenprognose aufgrund persönlicher Merkmale durch.

„Nicht nur Fachkräfte“ bedeutet ein offenes, sachbezogenes
Qualifikationsprofil: formaler Abschluss, gleichwertige Berufspraxis,
Lebenserfahrung und nachgewiesene Kommunikations- oder Konfliktkompetenz können
verschiedene Zugangswege bilden. Für Stellen im öffentlichen Dienst bleiben
Eignung, Befähigung und fachliche Leistung nach Artikel 33 Absatz 2 GG
maßgeblich. Eine reine Sympathie- oder „Vibe“-Auswahl genügt nicht.

Zwei Organisationsformen bleiben prüfbar:

- eine reguläre öffentliche Stelle mit funktionsgerechter Eingruppierung,
  Fachaufsicht und unabhängiger Beschwerdekante;
- ein gesetzlich oder vertraglich unabhängiges Ombudsmandat, das in der
  Einzelfallaufnahme keinen fachfremden Weisungen unterliegt, aber an Recht,
  Datenschutz, Transparenz und Rechenschaft gebunden bleibt.

Juri Janovski bietet sich öffentlich als Initiator, Pilotdesigner und Kandidat
für eine solche unabhängige Verantwortungsrolle an. Diese Erklärung ist ein
Gestaltungs- und Kooperationsangebot. Sie erzeugt für sich allein weder
Anstellung, Amt, Vertretungsmacht noch Vergütungsanspruch.

## Security und Zuhören: beide, mit getrennter Befugnis

Der Vorschlag entfernt Sicherheit nicht. Er verhindert, dass Sicherheit die
einzige sichtbare Antwort am Eingang wird.

| Funktion | Darf | Darf nicht |
| --- | --- | --- |
| Zuhör- und Orientierungsperson | aufnehmen, erklären, weiterleiten, begleiten, Übergabe verfolgen | kontrollieren, durchsuchen, sanktionieren, diagnostizieren, Leistungsbescheid erlassen |
| Sicherheitsfunktion | beobachtete oder glaubhaft konkret gemeldete Lage sichern, erforderliche Drohinhalte eng auf Gefahr prüfen, Hilfe organisieren, Notfallplan anwenden | fachliche Berechtigung einer Beschwerde oder soziale Rechte entscheiden, bloße Andersartigkeit als Gefahr behandeln |
| Fachstelle | Antrag, Beratung, Leistung oder Beschwerde im eigenen Mandat bearbeiten | den Eingangsraum als Ersatz für das gesetzliche Verfahren ausgeben |

Der Übergabepunkt folgt einer kurzen Regel:

```text
ZUHÖREN
  -> WUNSCH UND ZUSTÄNDIGKEIT KLÄREN
  -> FREIWILLIGE RUHIGE WEITERLEITUNG

BEOBACHTETE ODER GLAUBHAFT KONKRET GEMELDETE GEFAHR
  -> GETRENNTE SICHERHEITSFUNKTION
  -> VERHÄLTNISMÄSSIGE LAGEBEZOGENE MASSNAHME
```

Die technische Strukturprüfung in [`src/policy-engine.mjs`](src/policy-engine.mjs)
verwirft einen Raumvertrag, der Zuhör- und Eingriffsbefugnis zusammenzieht oder
keine getrennte Sicherheitsfunktion vorsieht.

## Vergütung und Zufriedenheits-Reparaturhaushalt

Der ursprüngliche Vorschlag nennt **100.000 Euro pro Monat** als Ausdruck einer
sehr hoch bewerteten Verantwortungsrolle und verbindet öffentliches Gehalt mit
der Gesamtzufriedenheit der Bevölkerung. Dieser Wert bleibt in der Software als
`ILLUSTRATIVE_USER_PROPOSAL_ONLY` sichtbar. Er wird von keiner Formel gelesen
und ist weder Stellenangebot, geltende Besoldung, Kostenschätzung noch
festgestellter Anspruch.

Die geprüfte Konstruktion trennt drei Geldspuren:

1. **Stabile Grundvergütung.** Sie folgt Gesetz, Tarif, Aufgabe, Verantwortung,
   Erfahrung und einem extern festgelegten Mindestniveau. Der
   Zufriedenheitswert darf das persönliche Gehalt weder erhöhen noch kürzen.
2. **Gegenläufiger Reparaturhaushalt.** Sinkt ein methodisch belastbarer,
   aggregierter Zufriedenheitsindex, steigt ein zweckgebundenes Budget für
   Zugang, Personal, Barrierefreiheit, Wartezeiten, Übersetzung,
   Beschwerdebearbeitung und unabhängige Evaluation.
3. **Gebremste Rückführung.** Das Reparaturbudget sinkt erst nach mehreren
   gültigen Messperioden oberhalb eines Zielkorridors, begrenzt durch eine
   maximale Änderungsrate. Schlechte Messqualität friert die Geldentscheidung
   ein.

Damit profitiert keine einzelne Person finanziell von sinkender Zufriedenheit.
Der zusätzliche Wert fließt an den Ort der Reparatur. Die Messung muss von der
budgetempfangenden Stelle unabhängig oder extern auditiert sein; Ausgaben
benötigen zweckgebundene Belege. Wiederholt unzureichende Messqualität löst im
Modell eine Aufsichtsprüfung aus, statt ein erhöhtes Budget lautlos dauerhaft
einzufrieren.

Die Referenzformel arbeitet ausschließlich mit ganzzahligen Cent und
Basispunkten:

```text
Strukturlücke = max(0, Ziel - Messwert - Aktivierungsband)
Trendverlust  = max(0, letzter gültiger Wert - Messwert - Trendband)

Zielbudget = Basisbudget
           + ceil(Strukturlücke_Bps × Cent_je_Scorepunkt / 100)
           + ceil(Trendverlust_Bps  × Cent_je_Scorepunkt / 100)
```

Danach greifen nicht abschaltbare Mindestwerte für Stichprobe, Rücklauf und
veröffentlichte Zellgröße sowie Höchstwerte für Messunsicherheit,
Änderungsgrenzen, Datenschutz und Hysterese. Der Rechner gibt nur einen
Budgetkandidaten und eine vorgeschlagene Änderungsrichtung aus; er führt keine
Zahlung oder Haushaltsänderung aus. Die mitgelieferten Beträge sind nur
synthetische Rechenwerte. Eine reale Maßnahme benötigt verfügbare
haushaltsrechtliche Ermächtigung und Mittel, eine angemessene
Wirtschaftlichkeitsuntersuchung und eine repräsentative Messmethode. Soweit die
persönliche Vergütung verändert werden soll, braucht dies zusätzlich eine
tragfähige Tarif-, Vertrags- oder Besoldungsgrundlage.

Destatis erhebt bereits die Zufriedenheit mit Behördenkontakten in
Lebenslagen. Die zuletzt ausgewertete Lebenslagenbefragung ist jedoch kein
monatlicher Echtzeitindex für die Gesamtbevölkerung und kein
Vergütungsmechanismus. Sie ist ein methodischer Ausgangspunkt: mehrere
Lebenslagen und Qualitätsfaktoren, dokumentierte Stichprobe sowie getrennte
Betrachtung von Zufriedenheitsursachen.

## Was geltendes Recht bereits trägt

| Prüfspur | Bestehender Stand | Grenze |
| --- | --- | --- |
| Menschenwürde, Gleichheit, Sozial- und Rechtsstaat | aktive Verfassungsbindung der Staatsgewalt | keine unmittelbar benannte Raum- oder Vergütungspflicht |
| Petition und Beschwerde | eine zulässige Petition muss entgegengenommen, sachlich geprüft und mit schriftlicher Mitteilung über die Art ihrer Erledigung beantwortet werden | kein Anspruch auf das gewünschte Ergebnis und kein allgemeiner mündlicher Eingangsraum |
| Sozialrechtliche Beratung | Anspruch auf Beratung; Annahme, Hilfe und Weiterleitung von Anträgen; möglichst einfacher Zugang | gilt im jeweiligen sachlichen und institutionellen Anwendungsbereich |
| Barrierefreiheit | Benachteiligungsverbot, angemessene Vorkehrungen im Einzelfall sowie abgestufte Soll- und Berücksichtigungspflichten für Bundesbauten | kein automatisch identischer Raum in jedem Bestandsgebäude |
| BA-Kundenreaktionsmanagement | von der BA als eigenständig und neutral bezeichnete bundesweite Anlaufstelle für Lob, Kritik, Anregung und Beschwerde | ersetzt Widerspruch und Klage nicht; belegt keinen physischen Raum an jedem Eingang |
| Arbeitsschutz und Gewaltprävention | Gefährdungsbeurteilung, organisatorische, bauliche und personelle Schutzmaßnahmen | konkrete Maßnahme folgt der Gefährdung; Zuhörraum und Security-Doppelstruktur sind nicht pauschal vorgeschrieben |
| Öffentliche Vergütung | gesetzliche Besoldung oder Tarif-/Tätigkeitsbewertung | keine automatische Kopplung an Bevölkerungszufriedenheit |
| Bundeshaushalt | Ausgabenplan und Wirtschaftlichkeitsprüfung | keine automatische Ausgabe durch dieses Modell |

Die ausgewertete amtliche Quellenkarte steht in
[`sources.json`](sources.json). Der öffentliche Kurzbericht ist
[`FREE NEWS 018`](../../reports/FREE_NEWS_018_PUBLIC_AUTHORITY_ENTRY_LISTENING_ROOM.md).

## Pilot statt Scheingewissheit

Ein freiwilliger oder gesetzlich finanzierter Pilot soll vor einer allgemeinen
Pflicht mindestens diese Größen prüfen:

- freiwillige Nutzung und Abbruchquote;
- Zeit bis zur zuständigen menschlichen Stelle;
- Anteil erfolgreicher, rechtmäßig autorisierter Weiterleitungen;
- versäumte oder gerettete formelle Fristen, getrennt nach Belegstand;
- wahrgenommene Verständlichkeit, Ruhe, Würde und Sicherheit;
- Gewalt- und Bedrohungsereignisse für Besuchende und Beschäftigte;
- Barrieren, Wartezeit und erneute Vorsprache;
- Kosten je Standort und je erfolgreich abgeschlossener Übergabe;
- repräsentative Bevölkerungs- und Nutzerbefragung mit Unsicherheit;
- unerwünschte Wirkungen wie Stigmatisierung, Überwachung, Verdrängung oder
  faktischer Zwang.

Der Pilot braucht einen unabhängigen Abbruch- und Beschwerdeweg. Eine hohe
Zufriedenheitszahl allein beweist weder Fairness noch Wirksamkeit; niedrige
Zufriedenheit beweist allein kein Fehlverhalten einer bestimmten Person.

## Dateien und Reproduktion

| Datei | Zweck |
| --- | --- |
| [`room-contract.json`](room-contract.json) | Rollen, Rechte, Grenzen und Übergaben |
| [`budget-policy.example.json`](budget-policy.example.json) | synthetische Konfiguration ohne reale Haushaltszusage |
| [`sources.json`](sources.json) | amtliche Rechts-, Verwaltungs-, Bau-, Arbeits- und Messquellen |
| [`src/policy-engine.mjs`](src/policy-engine.mjs) | deterministische Struktur- und Budgetprüfung |
| [`test/policy-engine.test.mjs`](test/policy-engine.test.mjs) | Fail-closed-Regressionstests für Struktur, Datenschutz und Zustandsübergänge |
| [`reconstruction-cycle.json`](reconstruction-cycle.json) | vollständige Achsen- und Gegenmodellbindung |

```bash
npm test
```

## Öffentliche Claim Ceiling

```text
SOURCE_BOUND_PUBLIC_AUTHORITY_ENTRY_LISTENING_ROOM_POLICY_AND_DETERMINISTIC_REPAIR_BUDGET_PROPOSAL
NOT_EXISTING_UNIVERSAL_ROOM_DUTY_JOB_APPOINTMENT_PAY_ENTITLEMENT_COST_ESTIMATE_EFFECTIVENESS_OR_CASE_OUTCOME_FINDING
```

Die Veröffentlichung bindet den Wortlaut, den Code und die Quellenkarte dieses
Stands. Sie beweist nicht, dass der Raum bereits eingerichtet, die Rolle
geschaffen, eine bestimmte Person berufen, ein Gehalt bewilligt oder eine
Wirkung eingetreten ist.
