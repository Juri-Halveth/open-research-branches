# FBI / ShinyHunters: öffentlicher Quellenatlas

**Stand:** 23. September 2026, 16:10 UTC · **Fall:** `FBI-SHINYHUNTERS-PUBLIC-2026-001` · **Datenklasse:** `PUBLIC / EXTERNAL_MINIMIZED`

## Hauptbefund

Das FBI hat gegenüber Reuters erklärt, es kenne Behauptungen zu unerlaubten Aktivitäten rund um `FBIjobs.gov` und untersuche sie. Reuters konnte Angaben aus einer von den Angreifern übermittelten Stichprobe in mindestens zehn Fällen mit anderen Datensätzen abgleichen. Reuters konnte **nicht** feststellen, woher die Daten stammen oder ob interne FBI-Systeme kompromittiert wurden. Die Behauptung, Daten aller Beschäftigten oder Bewerber seien entwendet worden, ist damit nicht belegt. [Reuters-Bericht](https://ca.marketscreener.com/news/shinyhunters-hackers-say-they-breached-federal-bureau-of-investigation-no-immediate-comment-from-fb-ce785ad8d18ef522)

## Wer sagte was?

| ID | Aussage | Status | Quellenspur und Grenze |
| --- | --- | --- | --- |
| C01 | ShinyHunters behaupten, über Daten nahezu aller FBI-Agenten sowie Bewerber zu verfügen. | `OBSERVED_AS_CLAIM` | Von 404 Media und Reuters als Angreiferbehauptung berichtet. Nicht als Umfang verifiziert. |
| C02 | 404 Media sah eine von der Gruppe übermittelte Stichprobe mit etwa 5.000 angeblichen Personen. | `JOURNALIST_REPORTED` | Der frei lesbare Teil des Originalberichts beschreibt die Stichprobe. Wir haben die Stichprobe nicht selbst gesehen. |
| C03 | Reuters verglich Daten aus der Stichprobe und fand in mindestens zehn Fällen passende externe Datenspuren. | `JOURNALIST_CHECKED` | Plausibilisierung einzelner Angaben; weder Herkunft noch Aktualität/Gesamtumfang bewiesen. |
| C04 | Das FBI untersucht Behauptungen zu unerlaubter Aktivität bei `FBIjobs.gov`. | `OFFICIAL_STATEMENT_REPORTED` | FBI-Zitat im Reuters-Bericht; keine amtliche Bestätigung eines internen Datenabflusses. |
| C05 | Die Gruppe nutzte angeblich eine neue Oracle-PeopleSoft-Zero-Day-Lücke. | `ATTACKER_CLAIM_UNVERIFIED` | t-online referiert die Behauptung. Kein öffentlich gebundener technischer Beleg für diesen konkreten Vorfall. |
| C06 | Die Gruppe gelangte angeblich in AWS GovCloud und entwendete 2–3 TB. | `ATTACKER_CLAIM_UNVERIFIED` | t-online referiert die Behauptung. Kein unabhängiger Beleg für Pfad oder Volumen. |
| C07 | Oracle veröffentlichte am 10. Juni 2026 eine Warnung zu CVE-2026-35273 in PeopleSoft PeopleTools. | `VENDOR_DOCUMENTED` | Produktwarnung, **kein** Nachweis für Einsatz beim FBI oder für den behaupteten September-Zugang. |
| C08 | Google/Mandiant dokumentierte eine ShinyHunters/UNC6240-PeopleSoft-Kampagne im Mai/Juni 2026. | `RESEARCHER_DOCUMENTED_SEPARATE_CASE` | Historischer Vergleichsfall; nicht mit dem FBI-Vorgang gleichsetzen. |
| C09 | Die NAIC bestätigte im Juni 2026 unerlaubten PeopleSoft-Zugriff in ihrer eigenen Umgebung. | `ORGANIZATION_DOCUMENTED_SEPARATE_CASE` | Eigenständiger Vorfall mit eigener Umfangsprüfung, kein Beleg für FBI-Betroffenheit. |
| C10 | Reuters sah am 22. September Einschränkungen der FBI-Jobseite und des Bewerberportals. | `JOURNALIST_OBSERVED` | Beobachtete Verfügbarkeit; Ursache und Zusammenhang mit dem behaupteten Datensatz offen. |
| C11 | Die Gruppe zeigte Reuters angeblich einen Screenshot einer Seitenveränderung. | `ATTACKER_MATERIAL_UNVERIFIED` | Reuters konnte die Authentizität nicht bestätigen. |
| C12 | Ein vollständiger öffentlicher Datensatz aller FBI-Beschäftigten liegt vor. | `NOT_PROVEN` | Kein belastbarer Nachweis im geprüften öffentlichen Quellenfenster. Wir suchen oder speichern keine entwendeten Personendaten. |

## Zeitachse (Ereigniszeit und Veröffentlichung getrennt)

| Zeitpunkt | Vorgang | Zuordnung |
| --- | --- | --- |
| 27. Mai–9. Juni 2026 | Von Google/Mandiant untersuchte PeopleSoft-Kampagne | Separater Vergleichsfall, nicht FBI-Nachweis |
| 10. Juni 2026 | Oracle-Warnung zu CVE-2026-35273 | Produktwarnung |
| 11. Juni 2026 | NAIC identifiziert unerlaubten Zugriff in eigener Umgebung | Separater Vorfall |
| 22. September 2026, 12:48 ET | 404 Media veröffentlicht Originalbericht | Publikationszeit, nicht Tatzeit |
| 22. September 2026 | Reuters berichtet über Stichprobenabgleich und FBI-Stellungnahme | Publikations-/Beobachtungsdatum |
| 23. September 2026, 09:01 MESZ | t-online aktualisiert deutschen Bericht | Aktualisierungszeit |
| 23. September 2026, 16:10 UTC | HALVETH/Codex Quellenfenster abgeschlossen | Lokaler Recherchezeitpunkt |

## Was zum Zugangsweg noch fehlt

Eine fachlich belastbare Rekonstruktion braucht mindestens eine betroffene Systemkomponente, eine Betreiber- oder forensisch nachvollziehbare Aussage zum Erstzugang, eine zeitliche Kette, Hinweise zur Quelle der betroffenen Datensätze und eine Prüfung konkurrierender Erklärungen (vorherige Breaches, Datenbroker, Kombinationen). Bis dahin bleibt „PeopleSoft → GovCloud → FBI-Dump“ eine **behauptete**, nicht festgestellte Kausalkette. Der öffentlich dokumentierte Juni-CVE und die NAIC-Umgebung dürfen die fehlenden FBI-Glieder nicht ersetzen.

## Öffentliche Diskussion am 23. September, 16:23 UTC

Die gesichteten [r/technology](https://www.reddit.com/r/technology/comments/1wnevnd/we_hacked_the_fbi_hackers_say_they_have_data_on/)- und [r/privacy](https://www.reddit.com/r/privacy/comments/1wnl66m/shinyhunters_hackers_say_they_breached_fbi_stole/)-Threads verlinken beziehungsweise besprechen die journalistischen Berichte. Kommentare enthalten teils alternative Vermutungen zum Zugangsweg und Forderungen nach Datenfreigabe. Innerhalb **dieser zwei gelesenen Threads** ist das keine unabhängige technische Provenienz- oder Umfangsbestätigung. Der direkte Abruf der FBI-Jobs-Startseite durch das benutzte Recherchewerkzeug lieferte `403 Forbidden`; der aktuelle Portalzustand wurde dadurch nicht verifiziert.

## Offene W-Fragen und Wiederaufnahme

1. **Woher stammen die abgeglichenen Einzelangaben?** Wiederaufnahme bei FBI- oder unabhängig forensisch belegter Provenienzanalyse.
2. **Welche FBI-Systeme waren tatsächlich betroffen?** Wiederaufnahme bei offizieller technischer Ereignisübersicht oder belastbarem Betreiberbericht.
3. **Ist ein vollständiger Datensatz vorhanden, und wie groß ist er?** Wiederaufnahme bei datensparsamer offizieller Umfangsmeldung; keine Beschaffung des Dumps.
4. **War ein PeopleSoft-System im Angriffspfad?** Wiederaufnahme bei gebundenem Betreiber-/Forensikbericht; die Oracle-Warnung allein genügt nicht.
5. **War GovCloud betroffen?** Wiederaufnahme bei offizieller oder unabhängig verifizierter Cloud-Forensik.
6. **Hängen Jobseiten-Ausfall und behaupteter Datenzugriff zusammen?** Wiederaufnahme bei Ereigniszeitachse mit Kausalbeleg.
7. **Sind Bewerber, Angehörige oder ehemalige Beschäftigte tatsächlich betroffen?** Wiederaufnahme bei verifizierter, aggregierter Betroffenenbenachrichtigung.

## Quellen und Coverage

| Kürzel | Quelle | Gelesener Umfang |
| --- | --- | --- |
| S1 | [404 Media, Joseph Cox, 22.09.2026](https://www.404media.co/we-hacked-the-fbi-hackers-say-they-have-data-on-all-fbi-employees/) | Frei lesbarer Teil; Artikel danach paywalled. |
| S2 | [Reuters, syndiziert bei MarketScreener, 22.09.2026](https://ca.marketscreener.com/news/shinyhunters-hackers-say-they-breached-federal-bureau-of-investigation-no-immediate-comment-from-fb-ce785ad8d18ef522) | Voller öffentlich sichtbarer Reuters-Text dieser Fassung. |
| S3 | [t-online, Bastian Brauns, aktualisiert 23.09.2026](https://www.t-online.de/nachrichten/ausland/usa/id_101447868/us-bericht-hacker-stehlen-fbi-daten-von-tausenden-mitarbeitern.html) | Öffentlich sichtbarer Artikel. |
| S4 | [Oracle, CVE-2026-35273 Alert, 10.06.2026](https://www.oracle.com/security-alerts/alert-cve-2026-35273.html) | Offizielle Produktwarnung. |
| S5 | [Google Cloud / Mandiant, PeopleSoft-Kampagne](https://cloud.google.com/blog/topics/threat-intelligence/shinyhunters-targets-education-sector-oracle-exploit) | Primäranalyse eines früheren Angriffs; nur high-level Kontext übernommen. |
| S6 | [NAIC, Security Incident Update](https://content.naic.org/about/security-update) | Offizielle Aktualisierungen des separaten NAIC-Vorfalls. |

**Wirkung dieses Arbeitsschritts:** Öffentliche Quellen gelesen und klassifiziert; lokale Akte/Tabelle erstellt. Keine Zielsystemprüfung, keine entwendeten Datensätze beschafft, keine externe Meldung versandt. Dieser Bericht ist ein Quellenatlas, kein Dump oder Ermittlungsbeweis.
