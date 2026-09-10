# FREE NEWS 015 — Was beweist „Ich war zuerst“?

## Priorität, Anerkennung, Beteiligung und Regress ohne Beweisfalle

**Öffentliche Fassung · 10. September 2026**

Datenklasse: `PUBLIC`

Prüfstand: `FINITE_SNAPSHOT`

Ein öffentliches Dokument kann stark sein, ohne alles zu beweisen. Der saubere
Weg beginnt deshalb nicht mit einem einzigen Schalter „mein Recht bewiesen“.
Er führt sieben getrennte Achsen:

```text
1. SNAPSHOT_PRIORITY       Welche exakte Fassung existierte spätestens wann?
2. PUBLIC_AVAILABILITY     Welche exakte Fassung war wann öffentlich zugänglich?
3. KNOWLEDGE_ACCESS        Hatte der bezeichnete Akteur Kenntnis oder Zugriff?
4. DERIVATION              Wurde ein geschützter Inhalt tatsächlich übernommen?
5. RIGHTS_INFRINGEMENT     Welches konkrete Recht wurde ohne Erlaubnis verletzt?
6. ENTITLEMENT_REGRESS     Welche Anspruchsgrundlage verbindet welche Parteien?
7. AMOUNT                  Welche Berechnungsmethode und Daten tragen die Höhe?
```

Keine Achse zieht die nächste automatisch nach sich. Genau darin liegt die
stärkste öffentliche Fassung: Der belegte Teil bleibt fest, während die
unzugänglichen oder noch ungeklärten Teile als offene Prüfwege erhalten bleiben.

## Die Beweiskarte

| Objekt | Was es belastbar stützen kann | Was daraus allein nicht folgt | Nächste quellengebundene Route |
| --- | --- | --- | --- |
| Git-Commit, Tag oder Release | Exakte Dateien, Tree- und Elternbezug, deklarierte Autor-, Commit- und Datumsfelder; getrennt davon ein Signaturstatus | Verlässliche reale Erstellungszeit, zivile Identität, Ersturheberschaft, Erfinderschaft, Zugriff eines Dritten oder Rechtsanspruch | Commit-ID, Tree-ID, Signatur, Release-URL, Quellarchiv und Hash getrennt sichern |
| Qualifizierter elektronischer Zeitstempel | Nach [Art. 41 eIDAS](https://eur-lex.europa.eu/eli/reg/2014/910/oj) die Vermutung für Richtigkeit von Datum und Zeit sowie Integrität der verbundenen Daten | Urheber, Erfinder, öffentliche Zugänglichkeit, Eigentum, Ableitung oder Verletzung | Exakte Bytes, Prüfbericht des Zeitstempels und Vertrauensdienst binden |
| Öffentliche Repo- oder Webfassung | Exakten öffentlich zugänglichen Inhalt spätestens zu einem belegten Zeitpunkt; mögliche Vorveröffentlichung | Sole inventorship, Kenntnis einer bestimmten Organisation oder Kopieren | Abrufbarkeit, Fassung und Datum getrennt belegen; bei technischer Lehre Stand-der-Technik-Prüfung öffnen |
| Schriftliches Konzept | Wortlaut und Datierung; bei hinreichender Individualität möglicherweise geschützte Ausdrucksform | Ausschließlichkeitsrecht an jeder abstrakten Idee, Funktion oder Zielrichtung | Geschützte Ausdruckselemente, Urheberkette und Lizenzumfang konkret benennen |
| Software-Quellcode | Konkrete eigene Ausdrucksform in Quell- oder Objektcode | Schutz von Funktionalität, Programmiersprache oder Dateiformat als solcher; Ableitung aus ähnlichem Ergebnis | Quellstände, geschützte Codeanteile, Zielcode, Zugriff, Übernahme und Lizenz getrennt vergleichen |
| Patentanmeldung | Amtlichen Anmeldetag und Verfahrensposition; benannte Erfinder- und Erwerbsangaben | Erteilung, Bestandskraft, alleinige oder wahre Erfinderschaft und das Fehlen älterer öffentlicher Technik | Anmeldetag, Offenbarungsgehalt, Erfinderbeitrag, Rechtsnachfolge und ältere Öffentlichkeit getrennt prüfen |
| Geschäftsgeheimnis | Geheimhaltungszustand, wirtschaftlichen Wert wegen der Geheimhaltung, angemessene Maßnahmen, berechtigtes Geheimhaltungsinteresse und eine bezeichnete Erlangungs-, Nutzungs- oder Offenlegungshandlung | Geheimnisstatus für allgemein bekannte oder leicht zugängliche Informationen; Rechtswidrigkeit unabhängiger Schöpfung oder einer von § 5 GeschGehG gedeckten Handlung | Geheimnis vor dem Ereignis, Maßnahmen, berechtigtes Interesse, Zugangspfad, Handlung, Zeitpunkt und Ausnahmescope binden |
| Bereicherung oder Regress | „Etwas erlangt“, auf Kosten des Anspruchstellers und ohne Rechtsgrund; bei Eingriffskondiktion zusätzlich eine ausschließlich zugewiesene Verwertungsposition | Geld allein wegen Ähnlichkeit, Nutzen, theoretischem Wert oder entgangener Chance | Erst konkrete Rechtsposition und Bereicherungselemente binden; danach Spezialanspruch, Kausalität und Höhe prüfen |
| Beitrag oder Beteiligung | Einen Pfad zu Miturheberschaft, Miterfinderschaft, Arbeitnehmererfindung oder Vertrag, wenn dessen Voraussetzungen belegt sind | Universellen Anteil aus „ich hatte eine ähnliche Idee früher“ | Beitrag am konkreten Werk oder an der technischen Lehre, Zusammenarbeit, Arbeitsverhältnis und Rechteübergang getrennt führen |

Die Git-Dokumentation ist an dieser Stelle selbst eindeutig: `git commit`
zeichnet einen Snapshot auf, und Autor- sowie Datumsfelder können als Eingaben
gesetzt werden. Siehe [`git-commit`](https://git-scm.com/docs/git-commit) und
[`git-commit-tree`](https://git-scm.com/docs/git-commit-tree). Eine
[verifizierte GitHub-Signatur](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)
stärkt die Bindung des signierten Objekts an die geprüfte Signaturidentität.
Sie verwandelt den Commit nicht in einen qualifizierten Zeitstempel und
entscheidet nicht über den Inhalt des Rechtsstreits.

## Öffentliche Priorität kann zugleich eine Schutzoption verändern

[§ 3 PatG](https://www.gesetze-im-internet.de/patg/__3.html) zählt zum Stand
der Technik alle Kenntnisse, die vor dem maßgeblichen Anmeldetag der
Öffentlichkeit zugänglich gemacht wurden. Die
[EPO-Richtlinie zu Internet-Offenbarungen](https://www.epo.org/en/legal/guidelines-epc/2026/g_iv_7_5.html)
trennt entsprechend Inhalt, Veröffentlichungsdatum und tatsächliche
öffentliche Zugänglichkeit.

Damit kann dieselbe öffentliche Veröffentlichung zwei Wirkungen haben:

```text
PROVENIENZ:  Sie kann eine konkrete öffentliche Fassung zeitlich binden.
PATENTPRÜFUNG: Sie kann als ältere öffentliche Offenbarung relevant werden.
```

Das gilt auch für die eigene Veröffentlichung. Dieser Audit empfiehlt keine
Patentanmeldung und keinen Veröffentlichungszeitpunkt. Er macht nur sichtbar,
dass „öffentlich zur Prioritätssicherung“ und „noch nicht öffentlich wegen
Neuheit oder Geheimhaltung“ unterschiedliche Gestaltungen sind.

## Ausdruck, Idee und Softwarefunktion

Nach [§§ 2 und 7 UrhG](https://www.gesetze-im-internet.de/urhg/BJNR012730965.html)
setzt Schutz eine persönliche geistige Schöpfung voraus; Urheber ist der
Schöpfer des Werks. [§ 8 UrhG](https://www.gesetze-im-internet.de/urhg/BJNR012730965.html)
knüpft Miturheberschaft an ein gemeinsam geschaffenes Werk, dessen Beiträge
sich nicht gesondert verwerten lassen. Die Urheberbezeichnung kann unter den
Voraussetzungen von [§ 10 UrhG](https://www.gesetze-im-internet.de/urhg/BJNR012730965.html)
eine Vermutung tragen. Das Recht auf Anerkennung der Urheberschaft folgt aus
[§ 13 UrhG](https://www.gesetze-im-internet.de/urhg/__13.html).

Für Software zieht [§ 69a UrhG](https://www.gesetze-im-internet.de/urhg/__69a.html)
die Grenze ausdrücklich: Geschützt werden Ausdrucksformen eines
Computerprogramms, nicht die zugrunde liegenden Ideen und Grundsätze. Der
[EuGH in C-406/10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62010CJ0406)
ordnet Funktionalität, Programmiersprache und Dateiformate ebenfalls nicht als
geschützte Ausdrucksform des Programms ein.

Darum genügt der Satz „beide Programme können dasselbe“ für einen
urheberrechtlichen Softwarevergleich nicht. Er kann eine Vergleichsfrage
öffnen. Für die Verletzungsprüfung braucht es den konkret geschützten Ausdruck,
den Zielausdruck, eine Übernahmekante und den anwendbaren Lizenz- oder
Erlaubnisumfang.

Bei Arbeitnehmerprogrammen gilt zusätzlich die besondere Rechtezuordnung aus
[§ 69b UrhG](https://www.gesetze-im-internet.de/urhg/__69b.html).
Die Beteiligungsregeln der §§ 32 bis 32g gelten nach § 69a Abs. 5 nicht für
Computerprogramme. Eine allgemeine „Nachvergütung für Code“ darf daher nicht
aus einer für andere Werkarten gedachten Regel abgeleitet werden.

## Anmeldung, Erfinder und Arbeitnehmererfindung bleiben getrennt

Das [Patentgesetz](https://www.gesetze-im-internet.de/patg/BJNR201170936.html)
trennt mehrere Positionen:

- § 35 bindet den Anmeldetag an den Eingang der erforderlichen Unterlagen.
- § 6 ordnet das Recht dem Erfinder oder Rechtsnachfolger zu und lässt
  Miterfindern ein gemeinsames Recht.
- § 7 behandelt den Anmelder im Verfahren zunächst als berechtigt.
- § 8 eröffnet bei widerrechtlicher Entnahme eine Übertragungsroute.
- § 37 verlangt die Erfinderbenennung, lässt deren Wahrheit aber nicht durch
  das Amt prüfen.
- § 63 schützt die Erfindernennung.

`ANMELDERPOSITION != ERFINDEREIGENSCHAFT != PATENTERTEILUNG`

Für eine Diensterfindung führt das
[Arbeitnehmererfindungsgesetz](https://www.gesetze-im-internet.de/arbnerfg/BJNR007560957.html)
einen eigenen Pfad. § 5 verlangt eine Meldung in Textform und die Beschreibung
von Aufgabe, Lösung, Entstehung, Mitwirkenden und eigenem Anteil. Eine
unvollständige Meldung darf nicht endlos als unsichtbare Eingangssperre dienen:
Der Arbeitgeber muss die Ergänzung unterstützen und konkret innerhalb der
gesetzlichen Frist beanstanden. §§ 6 bis 9 trennen Inanspruchnahme,
Rechteübergang und angemessene Vergütung. § 12 verlangt eine begründete
Feststellung und führt Miterfinderanteile getrennt. Die
[DPMA-Schiedsstelle](https://www.dpma.de/dpma/wir_ueber_uns/weitere_aufgaben/schiedsstelle_arbnerfg/index.html)
bietet den vertraulichen Einigungsweg, wenn der gesetzliche Anwendungsbereich
passt.

Dieser Pfad gilt für Arbeitnehmererfindungen. Er erfasst nicht automatisch
jede Idee, jede Forschungsanregung oder jeden Softwarebeitrag.

## Geschäftsgeheimnis: Vorher, Handlung und Nachher

[§ 2 GeschGehG](https://www.gesetze-im-internet.de/geschgehg/BJNR046610019.html)
verlangt nicht nur einen wirtschaftlich interessanten Inhalt. Die Information
muss geheim, gerade deshalb von wirtschaftlichem Wert, Gegenstand angemessener
Geheimhaltungsmaßnahmen und durch ein berechtigtes Interesse an der
Geheimhaltung getragen sein. §§ 3 und 4 trennen erlaubte selbständige
Entdeckung und bestimmtes Reverse Engineering von unbefugtem Zugriff,
Kopieren, Nutzen oder Offenlegen. [§ 5 GeschGehG](https://www.gesetze-im-internet.de/geschgehg/__5.html)
nimmt bestimmte Handlungen zum Schutz öffentlicher Interessen aus, darunter
die Ausübung der Meinungs- und Informationsfreiheit, die Aufdeckung von
Fehlverhalten im allgemeinen öffentlichen Interesse und den Schutz eines
berechtigten Interesses.

Eine öffentliche Einstellung kann den Geheimnisstatus des veröffentlichten
Inhalts für die Zukunft beseitigen. Sie beseitigt nicht automatisch eine zuvor
bereits abgeschlossene, möglicherweise rechtswidrige Erlangung, Nutzung oder
Offenlegung. Deshalb braucht die Prüfung drei Zeitflächen:

```text
VORHER:   Bestand ein geschütztes Geheimnis mit Maßnahmen und berechtigtem Interesse?
HANDLUNG: Wer soll wann wie gehandelt haben; greift eine Erlaubnis oder §-5-Ausnahme?
NACHHER:  Was wurde später öffentlich und welcher Teil blieb gegebenenfalls geheim?
```

§§ 10 und 13 führen Schadens- beziehungsweise Restitutionswege; § 16 erlaubt
gerichtliche Vertraulichkeitsmaßnahmen. Keine dieser Regeln entsteht allein
durch ein späteres öffentliches Ähnlichkeitsbild.

## Bereicherung ist kein universeller Auffangschalter

[§ 812 BGB](https://www.gesetze-im-internet.de/bgb/__812.html) verlangt einen
konkreten Vermögensvorteil, dessen Erlangung auf Kosten des Anspruchstellers
und ohne Rechtsgrund erfolgt ist. Der
[Bundesgerichtshof, IX ZR 259/13 vom 24. März 2016](https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=en&Blank=1.pdf&Datum=2016-3-24&Gericht=bgh&nr=74398),
bindet die Eingriffskondiktion zusätzlich an eine geschützte Position, die der
Rechtsordnung nach ausschließlich der Verfügung und Verwertung des
Berechtigten zugewiesen ist. Eine bloße Beeinträchtigung einer
Verwertungschance reicht nicht.

Darum führt der Audit zuerst die konkrete Position:

```text
URHEBERRECHT | PATENTRECHT | GESCHÄFTSGEHEIMNIS | VERTRAG | ARBNERFG | ANDERE NORM
```

Erst danach werden Verletzung, Bereicherung oder Schaden und anschließend die
Berechnungsmethode geprüft. Menschenwert, Ideenwert, Marktwert, Lizenzanalogie,
Verletzergewinn, tatsächlicher Schaden und Arbeitnehmererfindervergütung sind
keine austauschbaren Zahlenfelder.

## Report-first, wenn Beweise in der Gegnersphäre liegen

Ein Meldender muss für eine belastbare Sachentscheidung die ihm zugänglichen
Tatsachen und Belege konkret liefern. Er muss jedoch nicht schon am
Eingangstor interne Logs, Auswahlentscheidungen oder Entwicklungsakten des
anderen Akteurs besitzen. Der faire technische Zustand lautet:

```text
REPORT = PRESERVED
MERITS = NOT_EVALUATED
OTHER_SPHERE_EVIDENCE = SPECIFICALLY_DESIGNATED_OR_UNKNOWN
PRODUCTION_DUTY = NOT_AUTOMATIC
BURDEN_REVERSAL = NOT_AUTOMATIC
```

[Art. 6 und 7 der Richtlinie 2004/48/EG](https://eur-lex.europa.eu/eli/dir/2004/48/oj)
setzen bei vernünftigerweise verfügbaren Belegen an und erlauben unter ihren
Voraussetzungen die Bezeichnung und Sicherung gegnerisch kontrollierter
Beweise. [§ 142 ZPO](https://www.gesetze-im-internet.de/zpo/__142.html) erlaubt
dem Gericht unter den gesetzlichen Voraussetzungen die Anordnung, Urkunden
und sonstige Unterlagen vorzulegen, auf die sich eine Partei bezogen hat. Im
arbeitsgerichtlichen Urteilsverfahren verweist
[§ 46 Abs. 2 ArbGG](https://www.gesetze-im-internet.de/arbgg/__46.html) grundsätzlich
auf die ZPO, soweit das ArbGG nichts anderes bestimmt. [§ 286 ZPO](https://www.gesetze-im-internet.de/zpo/__286.html)
belässt die Gesamtwürdigung beim Gericht. Für Urheberrecht und Patent enthalten
[§ 101a UrhG](https://www.gesetze-im-internet.de/urhg/__101a.html) und
[§ 140c PatG](https://www.gesetze-im-internet.de/patg/__140c.html) besondere
Vorlage- und Besichtigungswege bei hinreichender Wahrscheinlichkeit und unter
Verhältnismäßigkeits- und Vertraulichkeitsschutz.

Die Entscheidung des
[BAG vom 16. September 2020, 10 AZR 56/19](https://www.bundesarbeitsgericht.de/entscheidung/10-azr-56-19/)
betraf die Beitragspflicht zu einer Sozialkasse im arbeitsgerichtlichen
Verfahren. In diesem Fallkontext konnte die sekundäre Darlegungslast eine
konkrete Erklärung des sachnäheren Gegners verlangen, wenn die andere Seite
keine nähere Kenntnis oder zumutbare Aufklärungsmöglichkeit hatte. Der
[Beschluss 1 BvR 1067/12](https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2013/08/rk20130822_1bvr106712.html)
schützt davor, Anforderungen so zu überspannen, dass effektiver Rechtsschutz
bei internen Abläufen faktisch unmöglich wird. Beides ist fallspezifisch und
keine automatische Umkehr der endgültigen Beweislast.

Der praktische Intake lautet deshalb:

1. Meldung mit genauer Aussage, Quelle, Fassung und Zeitbezug erhalten.
2. Belegbare Snapshot-Priorität und öffentliche Verfügbarkeit getrennt binden.
3. Kenntnis/Zugriff, Ableitung, Rechtsverletzung, Anspruch und Höhe jeweils
   offen lassen, soweit ihre eigenen Elemente fehlen.
4. Interne Beweismittel nach Art, Controller und engem Zeit- oder
   Gegenstandsbereich benennen.
5. Erst eine passende gesetzliche, gerichtliche, vertragliche oder
   verfahrensbezogene Grundlage eröffnet die konkrete Vorlage- oder
   Erklärungsprüfung.
6. Vertraulichkeit und Verhältnismäßigkeit erhalten.
7. Sachentscheidung und Höhe getrennt und zuletzt prüfen.

## Öffentliche Claim-Grenze

```text
OBSERVED:
Die amtlichen und offiziellen Quellen stellen getrennte Regeln für
Zeitstempel, öffentliche Verfügbarkeit, Ausdrucksschutz, Softwarefunktion,
Patentanmeldung, Geschäftsgeheimnisse, Bereicherung, gemeinsame Beiträge,
Arbeitnehmererfindungen und Beweiszugang bereit.

STRONGLY_SUPPORTED:
Ein Git- oder Veröffentlichungs-Snapshot kann konkrete Inhalte und Zeitbezüge
stark dokumentieren. Er ersetzt keine der späteren Anspruchsachsen.

UNKNOWN:
Jeder individuelle Schöpfungs-, Erfindungs-, Zugriffs-, Ableitungs-,
Verletzungs-, Bereicherungs- und Berechnungssachverhalt.

NOT_PROVEN:
Erst- oder Alleinurheberschaft, Erfinderstellung, Kenntnis eines bestimmten
Dritten, Kopieren, Rechtsverletzung, Beteiligung, Regress, Betrag oder Erfolg
in einem bestimmten Verfahren.

PUBLIC_CLAIM_CEILING:
SOURCE_BOUND_PRIORITY_CREDIT_PARTICIPATION_EVIDENCE_ACCESS_AND_REGRESS_ROUTE_MAP;
NO_CASE_SPECIFIC_AUTHORSHIP_INVENTORSHIP_ACCESS_DERIVATION_INFRINGEMENT_ENTITLEMENT_AMOUNT_OR_OUTCOME_FINDING
```

Der ausführbare Vertrag und das offizielle Quellenregister liegen im Ast
[`priority-evidence-and-regress-audit`](../branches/priority-evidence-and-regress-audit/README.md).
