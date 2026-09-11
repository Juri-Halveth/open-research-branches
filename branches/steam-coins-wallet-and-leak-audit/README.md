# Steam Coins, Wallet und der gemeldete Achievement-Leak

[Forschungsraum](../../README.md) · [Themenwiki](../../wiki/Home.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions)

**Alias-Redaktion: 11.09.2026.** Aktuelle Namensführung: [HALVETH!!!](../../PUBLIC-NAME.md). Der bisherige Quellenstand bleibt erhalten.

HALVETH!!! · Öffentlicher Quellenaudit · 10. September 2026

## Ergebnis

Im untersuchten Inventar ist ein digitales Sammelinventar erkennbar. Der ausgewählte Gegenstand gehört zum Spiel **Coins** von **CoinsDev**, veröffentlicht am 2. August 2024. Die Produktseite beschreibt ein Sammelspiel mit zeitabhängigen Zufallsgegenständen und Community-Market-Handel. Das ist ein konkreter Ansatzpunkt für eine Untersuchung von Ausgabe, Knappheit, Gebühren und Verbrauchertransparenz. Die Bezeichnung „Coin“ allein legt dabei keine technische Währungsform fest. [S01](https://store.steampowered.com/app/3083090/Coins/)

Die untersuchten Quellen belegen eine von Steam und dem Spieleentwickler verwaltete Gegenstandsökonomie. Sie liefern keinen Nachweis eines bislang geheimen, von Valve geschaffenen Bitcoin-ähnlichen Netzwerks. Der ebenfalls angesprochene Bericht über öffentlich gewordene Achievement-Listen betrifft eine andere Datenfunktion. Eine Verbindung zwischen diesem Vorfall, dem Coins-Inventar und der Entstehung dieses Audits ist im untersuchten Material nicht belegt.

Der Nutzen dieses Berichts liegt in nachprüfbaren Unterscheidungen: Was ist ein Gegenstand, was ein Guthaben, was ein Preisangebot, was ein vollzogener Verkauf und wer kann die Regeln ändern? Die offene Forschungsfrage lautet: **Wie verständlich und fair werden handelbare Zufallsgegenstände gegenüber ihren Nutzern beschrieben?**

## 1. Was der Inventarausschnitt tatsächlich zeigt

Grundlage ist ein vom Auftraggeber bereitgestellter Bildausschnitt. Er zeigt den App-Bezug `3083090`, den Spielnamen `Coins` und den ausgewählten Titel `Arsenic Alchemy Coin`. Im Beschreibungstext steht dagegen `Antimony`. Diese unterschiedlichen Stoffnamen sind eine direkt lesbare Inkonsistenz. Ein Übertragungs- oder Beschreibungsfehler wäre eine mögliche Erklärung; seine Ursache wurde nicht ermittelt.

Außerdem erscheinen `10/11 Alchemy Collection`, aktuell eingeschränkte Handel-/Markt-Tags und die Ankündigung einer Freigabe zum **11.09.2026, 02:00:00**. Die Zeitzone ist im Ausschnitt nicht gebunden. Der Zeitpunkt wird deshalb unverändert wiedergegeben. Er ist eine Anzeige im gelieferten Bild und keine nachträglich durchgeführte Liveprüfung der Kontofreigabe.

| Lesbares Merkmal | Zulässige Aussage | Noch offene Frage |
| --- | --- | --- |
| App-ID und Spielname | Zuordnung zum sichtbaren Coins-Inventar | Vollständiger aktueller App- und Kontostand |
| Arsenic / Antimony | Titel und Beschreibung verwenden verschiedene Namen | Welches Metadatum soll korrigiert werden? |
| Freigabedatum und eingeschränkte Tags | Im Bild besteht eine zeitbezogene Einschränkung | Welche weiteren Handelsbedingungen gelten dann? |
| Gestapelte Gegenstände | Eine Anzeige kann mehrere Einheiten zusammenfassen | Welche Zähllogik verwendet die Gesamtanzeige? |

Der Ausschnitt zeigt weder einen ausgeführten Verkauf noch einen erzielten Erlös, ein Orderbuch, eine Blockchain-Adresse oder eine globale Ausgabeobergrenze. Private Kontokennung, Rohbild und Bestandsmengen werden nicht veröffentlicht. Die minimierte Beobachtungsdatei hält den Bilddigest und die hier verwendeten Merkmale fest.

## 2. Eine öffentlich dokumentierte Entwicklung

| Datum | Öffentlich dokumentiertes Ereignis | Bedeutung für die Untersuchung |
| --- | --- | --- |
| 30.09.2010 | Valve stellt Steam Wallet vor | Bezahlfunktion für Steam und Spiele wurde öffentlich angekündigt. |
| 12.12.2012 | Valve startet den Community Market als Beta | Gegenstände können für Steam-Guthaben verkauft werden. |
| 02.08.2024 | Veröffentlichung von Coins durch CoinsDev | Der untersuchte Spielkontext ist datierbar. |
| 08./09.09.2026 | Medien berichten über aufgetauchte Achievement-Listen | Getrennter Nachrichten- und Sicherheitskontext. |
| 10.09.2026 | Quellenstand dieses Audits | Endlicher Prüfstand; spätere Änderungen bleiben möglich. |

Die historischen Valve-Mitteilungen sind öffentliche Erstquellen für Wallet und Market. Sie stützen keine Darstellung eines seit zwanzig Jahren ungenutzten Geheimprotokolls. Ob einzelne Nutzer diese Funktionen kannten, ist eine andere Frage und wurde hier nicht erhoben. [S03](https://store.steampowered.com/news/4406/), [S04](https://store.steampowered.com/oldnews/9594)

## 3. Vier verschiedene digitale Objekte

| Objekt | Dokumentierte Funktion | Kontrolle und Übertragbarkeit |
| --- | --- | --- |
| Coins-Spielgegenstand | Sammelobjekt innerhalb einer App | Ausgabe und Handelsfähigkeit hängen von Entwicklerkonfiguration und Steam-Regeln ab. |
| Steam Wallet | Vorausbezahltes Guthaben für zulässige Steam-Nutzungen | Kontogebunden; vertragliche Nutzungs- und Erstattungsbedingungen. |
| Steam Points | Belohnungs- und Profilfunktionen | Points-Shop-Gegenstände sind kontogebunden und nicht marktfähig. |
| Bitcoin | Übertragungen in einem öffentlich überprüfbaren Netzwerk | Private Schlüssel autorisieren Transaktionen; Netzwerkregeln und Konsens sichern das gemeinsame Register. |

Steam dokumentiert persistente Spielerinventare als Entwicklerdienst. In der Schema-Dokumentation sind unter anderem Kennungen sowie die getrennten Eigenschaften `tradable` und `marketable` beschrieben. Daraus folgt eine plausible Plattformarchitektur für solche Gegenstände. Die Dokumentation verrät jedoch nicht die vollständige aktuelle Coins-Konfiguration, Gesamtauflage oder Verteilung. [S07](https://partner.steamgames.com/doc/features/inventory), [S08](https://partner.steamgames.com/doc/features/inventory/schema)

Valve beschreibt Wallet-Guthaben im Nutzungsvertrag als vorausbezahlt und beschränkt seine Übertragung und Verwendung. Das ist die von Valve formulierte Vertragsgrundlage; zwingende gesetzliche Rechte werden damit nicht pauschal ausgeschlossen. [S05](https://store.steampowered.com/subscriber_agreement/)

Steam Points sind wiederum ein eigenes Belohnungssystem. Guthabenaufladungen und Community-Market-Käufe verdienen nach der Points-Erklärung keine Points; Points-Shop-Gegenstände können nicht gehandelt oder am Market verkauft werden. [S06](https://store.steampowered.com/points/howitworks/?l=english)

Für Bitcoin beschreibt die Projektdokumentation ein gemeinsam geprüftes Transaktionsregister, Schlüssel und Netzwerkbestätigung. Keine der gelesenen Coins-Quellen weist einen entsprechenden eigenen Konsensmechanismus nach. Ein Marktpreis, ein Münzbild oder eine begrenzte Anzeige ersetzt diese technische Verbindung nicht. [S12](https://bitcoin.org/en/how-it-works)

## 4. Handelbarkeit, Erlös und Auszahlung

Nach der Steam-Market-FAQ werden Käufe und Verkäufe mit Wallet-Guthaben abgewickelt. Verkaufserlöse lassen sich über diese Funktion nicht auf ein Bankkonto, an Drittanbieter oder auf ein anderes Steam-Konto auszahlen beziehungsweise übertragen. Ein eingestelltes Angebot ist außerdem noch kein abgeschlossener Handel. Die FAQ nennt eine allgemeine Steam-Transaktionsgebühr; eine zusätzliche **Coins-spezifische** Gebühr wurde für diesen Bericht nicht verifiziert. [S09](https://help.steampowered.com/en/faqs/view/61F0-72B7-9A18-C70B)

Davon zu unterscheiden ist die Erstattung unbenutzten, direkt bei Steam gekauften Wallet-Guthabens: Die Erstattungsrichtlinie beschreibt dafür eine Antragsmöglichkeit innerhalb von vierzehn Tagen. Diese Regel ist keine allgemeine Auszahlung von Market-Verkaufserlösen. [S10](https://store.steampowered.com/steam_refunds/)

Auch ein erreichtes Freigabedatum entscheidet nicht allein über jeden Handel. Valve erläutert gesonderte Trade- und Market-Holds sowie weitere Konto- und Sicherheitsvoraussetzungen. Welche davon im vorgelegten Konto tatsächlich greifen, wurde nicht untersucht. [S11](https://help.steampowered.com/en/faqs/view/34A1-EA3F-83ED-54AB), [S17](https://help.steampowered.com/en/faqs/view/451E-96B3-D194-50FC)

Eine brauchbare Bestandsbewertung müsste mindestens die jetzt berechtigte Stückzahl, tatsächlich ausführbare Nachfrage, Gebühren, Wartezeit und das verwendbare Zielguthaben zusammenführen. Der höchste sichtbare Angebotspreis beantwortet diese Fragen nicht.

**Reines Rechenbeispiel:** Angenommen, jemand besitzt 100 gleiche Gegenstände. Angenommen, es gibt ausführbare Kaufinteressen nur für zehn Stück zu jeweils 0,05 Euro. Dann wären für diese zehn Stück insgesamt 0,50 Euro Käuferzahlung rechnerisch abgedeckt; für die übrigen 90 fehlt in diesem Beispiel eine Preisgrundlage. Die tatsächliche Netto-Gutschrift im Steam Wallet hängt von den Gebühren ab. Die Zahlen sind frei gewählt und beschreiben weder Coins-Kurse noch einen tatsächlichen Auftrag.

Damit ist auch die Frage „Warum kaufen nicht alle?“ ökonomisch verständlich: Menschen können den Sammelnutzen unterschiedlich bewerten, andere Verwendungsmöglichkeiten bevorzugen oder das Risiko fehlender Nachfrage anders einschätzen. Aus der Existenz einer Plattformfunktion folgt kein allgemeiner Kaufgrund und keine belastbare Kursprognose.

## 5. Zufallskäufe: ein konkreter Transparenzansatz

Die öffentliche Produktseite `2x Alchemy Coins` beschreibt ein Paket mit **zwei zufälligen Gegenständen aus einer Sammlung von elf Varianten**. Die beim Abruf sichtbare Kurzbeschreibung enthielt keine Einzelwahrscheinlichkeiten. Elf mögliche Varianten bedeuten deshalb nicht automatisch gleiche Chancen. Die Seite belegt auch nicht, dass jedes der elf Objekte dieselbe Häufigkeit oder Nachfrage besitzt. [S02](https://store.steampowered.com/itemstore/3083090/detail/206/)

Hier liegt eine sachlich prüfbare Kritik: Kaufende sollten vor einem Zufallskauf verstehen können, was sie erhalten können, wie häufig Varianten auftreten, welche Änderungen der Ausgabe möglich sind und was ein späterer Verkauf tatsächlich einbringt. Eine rechtliche Einordnung als Glücksspiel würde zusätzliche Tatsachen über Mechanismus, Gegenleistung, Gewinn und anwendbares Recht benötigen. Dieser Bericht fällt darüber kein Urteil.

Als freiwilliger Transparenzstandard werden vorgeschlagen:

- eine gut sichtbare Benennung von Spielentwickler, Plattform und zuständiger Korrekturstelle;
- ein getrenntes Feld für Item-Handel, Market-Verkauf und verwendbares Wallet-Guthaben;
- Wahrscheinlichkeiten je Zufallsvariante und ein nachvollziehbares Änderungsprotokoll;
- Informationen zur Ausgabe oder ausdrücklich benannte Grenzen des verfügbaren Wissens;
- Nettoerlösanzeige vor einer Verkaufsbestätigung und verständliche Freigabebedingungen;
- eine Korrekturprüfung für den sichtbaren Arsenic-/Antimony-Unterschied.

Dies sind Gestaltungsvorschläge dieses Audits. Sie setzen keine Zustimmung eines Unternehmens, Rechtsverletzung oder Vergütungszusage voraus.

## 6. Was über den gemeldeten Leak bekannt ist

Der genaue Text der eingereichten MSN-Adresse konnte bei den Abrufen nicht zuverlässig gewonnen werden. Die ursprüngliche Redaktion, ihre vollständige Formulierung und ihre Veröffentlichungsversion bleiben daher für **diesen konkreten Link** offen. Die Überschrift allein wird nicht als Volltextbeleg behandelt. [S18](https://www.msn.com/de-de/gaming/gaming-plattformen/steam-riesiger-leak-enth%C3%BCllt-wichtige-details-zu-unver%C3%B6ffentlichten-spielen/ar-AA2bRQIk)

Ein unabhängig gelesener, thematisch passender Gematsu-Bericht von Sal Romano erschien am 8. September 2026 um 21:18 Uhr EDT. Das entspricht dem 9. September um 01:18 Uhr UTC. Er berichtet, dass Achievement-Listen mehrerer kommender Spiele auf Exophase sichtbar wurden. Er verweist auf die Vermutung eines Problems mit der API-Sichtbarkeit bei Valve. Das ist eine berichtete Erklärung, kein von diesem Audit bestätigter technischer Ursachenbefund. [S13](https://www.gematsu.com/2026/09/persona-6-kingdom-hearts-iv-and-other-steam-achievements-surface-in-large-scale-leak)

Ein über den Suchindex zugänglicher Beitrag des als Exophase-Betreiber auftretenden Kontos `x3sphere` beschreibt automatisch erfasste Daten, die nach seiner Einschätzung privat sein sollten. Diese Selbstauskunft hat einen anderen Belegstatus als ein unabhängig untersuchter Originaltrace. Die konkrete absolute Beitragszeit konnte nicht sicher gebunden werden. [S14](https://www.resetera.com/threads/persona-6-and-other-unrevealed-achievement-lists-are-leaking-via-steam-walking-dead-tomb-raider-shrek-kh4-more.1627462/page-4?post=160223521)

Auch PC Gamer berichtete über den Vorgang und korrigierte eine vermutete Zuordnung nach einem Widerspruch. Das ist ein konkretes Beispiel dafür, warum passende Titel oder Ähnlichkeiten allein keine verlässliche Urheberzuordnung liefern. Es wurde keine Liste unveröffentlichter Inhalte übernommen. [S15](https://www.pcgamer.com/gaming-industry/steam-may-have-leaked-achievements-for-countless-forthcoming-pc-games-via-a-third-party-site-including-persona-6-ace-combat-8-and-even-some-unannounced-games/)

Valve führt Achievements als eigene dokumentierte Spielfunktion. Dass Inventare und Achievements beide auf Steam vorkommen, stellt noch keine Kausalverbindung zwischen ihnen her. [S16](https://partner.steamgames.com/doc/features/achievements)

## 7. Was eine Zuordnung verändern würde

| Prüfgegenstand | Erreichter Stand | Nächster geeigneter Beleg |
| --- | --- | --- |
| Öffentliches Coins-Sammel- und Handelssystem | Durch Store und Plattformdokumentation gestützt | Aktuelle Entwicklerangaben zu Ausgabe und Gebühren |
| Bitcoin-ähnlicher Coins-Netzwerkmechanismus | Im untersuchten Material nicht nachgewiesen | Öffentliches Protokoll mit Register, Signatur- und Konsensregeln |
| Gemeldete Achievement-Offenlegung | Durch Medienbericht und Betreiberäußerung beschrieben | Öffentliche technische Stellungnahme von Valve oder Exophase |
| Verursachung des Leaks durch den Auftraggeber | Nicht durch das vorliegende Material belegt | Frühere zuordenbare Originalunterlagen mit konkretem Ereignisbezug |
| Frühere eigene Coins-Forschung | Im begrenzten lokalen Suchumfang kein passender Vorbericht gefunden | Konkrete frühere Datei, Veröffentlichungsadresse oder Commit |
| Marktwert des gezeigten Bestands | Nicht berechnet | Zeitgebundene ausführbare Nachfrage, Berechtigungen und Nettoerlöse |

Die lokale Suche umfasste ausgewählte Textbestände und die verfügbare öffentliche Repository-Historie. Der gefundene ältere Steam-Bericht betrifft **How to Fish**, eine andere App. Er wird als thematischer Vorgänger verlinkt, nicht zum Coins-Beleg umgedeutet: [FREE NEWS 005](../../reports/FREE_NEWS_005_HOW_TO_FISH_IDENTITY_AND_CREATION.md).

Die Quellenarbeiten mehrerer Assistenten sind eine gemeinsame Recherche unter demselben Auftrag. Ihre Anzahl erzeugt keine unabhängigen Bestätigungen. Offene Fragen bleiben im maschinenlesbaren Claim-Register erhalten. Für die Fortsetzung genügen öffentliche Korrekturen, rechtmäßig bereitgestellte Originale oder freiwillige Entwicklerauskünfte; ein Nachstellen des Leaks gehört nicht zu dieser Arbeit.

## 8. Veröffentlichung, Nachnutzung und Reproduktion

**HALVETH!!! ist der benannte Autor und Herausgeber dieses neuen Audits.** Diese Zuordnung bezieht sich auf den vorliegenden Bericht und seine eigenen Ableitungen. Rechte an Steam, Coins, fremden Texten oder allgemeinem Wissen werden dadurch nicht übertragen. Die neue Veröffentlichung begründet auch keine rückwirkende Beteiligung an fremden Entwicklungen.

Für die ausdrücklich bezeichneten neuen Dateien gilt die [Juri Public-Interest Research Permission 1.0](../../LICENSE-JURI-PUBLIC-INTEREST.md). Die genaue Pfadzuordnung steht in [LICENSES.md](../../LICENSES.md). Die Erlaubnis gilt für eigene Inhalte innerhalb dieser Zuordnung; verlinkte Quellen behalten ihre jeweiligen Rechte. Der öffentliche Kontakt des Projekts steht im [Repository-README](../../README.md).

Der Release ergänzt Quelltext, eine lesbare PDF, SHA-256-Prüfsummen und einen Git-Snapshot. Ein Hash bindet Dateibytes. Er beweist für sich keine ursprüngliche Erfindung, keine unabhängige historische Zeit und keinen Geldanspruch. Der Bericht bleibt ein datierter Quellenstand mit ausdrücklich offenen Punkten.

Die Dateien dieses Astes sind:

- `sources.json`: Quellen, Abrufart und begrenzte Aussagefunktion;
- `claims.json`: einzelne Aussagen, Status und Wiederaufnahmebedingungen;
- `public-observation.json`: minimierte Bildbeobachtung ohne Kontodaten;
- `reconstruction-cycle.json`: endlicher Forschungszyklus und sichere Fortsetzung;
- `build_pdf.py`: eigener PDF-Generator mit Quellen- und Dateidigest-Anhang.

Reproduktion unter Windows mit Python, ReportLab und den im Generator benannten Segoe-UI- und Consolas-Schriften. Bytegleiche Wiederholungen gelten für dieselben Eingaben, Schriften und Bibliotheksversionen:

```text
python branches/steam-coins-wallet-and-leak-audit/build_pdf.py
```

Die vollständige URL-Liste mit Quellenrollen und Veröffentlichungsdaten steht in [sources.json](sources.json). Dieser Bericht wurde am 10. September 2026 anhand der dort beschriebenen Abrufe erstellt.
