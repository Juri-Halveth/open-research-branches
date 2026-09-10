# FREE NEWS 021 · 21 Tage bis zur Verfügbarkeit: Staking verständlich erklären

Von Juri Janovski · HALVETH Open Research · Quellenstand: 10. September 2026

**Wer Token delegiert, sollte die Folgen für ihre Verfügbarkeit vor der Entscheidung erkennen können.** Ein sichtbarer Kontostand beantwortet nicht, welcher Teil sofort transferierbar ist. Dieser Bericht vergleicht die veröffentlichten Ausstiegsregeln von fünf Netzwerken und formuliert konkrete Verbesserungen für Wallets und Dokumentation.

## DAG: Eine überprüfbare Abweichung zwischen zwei Quellen

Constellations [Unstaking-Anleitung](https://docs.constellationnetwork.io/network-intro/dag-delegation/managing-delegated-positions/withdraw-unstake-a-delegation) beschreibt 21 Tage ab bestätigtem Unstaking. Anschließend sollen Stake und angesammelte Rewards automatisch und ohne Unstaking-/Empfangsgebühr zurückkehren. Für IntegrationNet wird ausdrücklich eine abweichende Testfrist genannt.

Die ebenfalls erreichbare [Metanomics-Seite](https://docs.constellationnetwork.io/network-intro/white-papers/metanomics), Abschnitt „Unwinding a Delegated Position“, nennt dagegen 30 Tage ohne weitere Rewards. **Die beiden gegenwärtig erreichbaren Dokumente enthalten unterschiedliche Zeitangaben.** Ein früherer Entwurfsstand oder eine Änderung könnte dies erklären; Zeitpunkt, Geltungsbereich und Migration sind hier nicht nachgewiesen.

Die [Delegationsübersicht](https://docs.constellationnetwork.io/network-intro/dag-delegation) stellt einen Validatorwechsel ohne Wartezeit neben einen vollständigen Ausstieg mit 21 Tagen. Die dortige Formulierung „No Lock-up Period“ bezieht sich auf den Validatorwechsel. Diese Unterscheidung sollte auch in kurzen Hinweisen unmittelbar lesbar sein. Als Zweck des Ausstiegszeitraums nennt die Quelle geordnete Liquiditätsveränderungen. Daraus folgt noch keine technische Herleitung, warum gerade 21 Tage notwendig sind.

Eine gesonderte [technische Integrationsanleitung](https://docs.constellationnetwork.io/network-apis/integration-guides/delegated-staking) beschreibt ausstehende Auszahlungen ohne weitere Rewards und eine Schätzung über den Epoch-Fortschritt. Sie trägt zugleich einen IntegrationNet-Hinweis. Dieser Dokumentationsstand wird deshalb nicht als Live-Messung einer konkreten Mainnet-Position ausgegeben.

## Vergleich der regulären Ausstiege

| Netzwerk | Veröffentlichter Zeitrahmen | Wann wieder verfügbar? | Quelle |
| --- | --- | --- | --- |
| Constellation DAG | Nutzeranleitung: 21 Tage; Metanomics-Seite: 30 Tage | Laut Nutzeranleitung automatische Rückgabe nach bestätigtem Ausstieg und Wartezeit; konkreten Vorgang getrennt prüfen. | [DAG-Anleitung](https://docs.constellationnetwork.io/network-intro/dag-delegation/managing-delegated-positions/withdraw-unstake-a-delegation), [Metanomics](https://docs.constellationnetwork.io/network-intro/white-papers/metanomics) |
| Native FET | 21 Tage | Nach angenommener Undelegation; die Wallet zeigt laufende Positionen und Resttage unter „Unbonding Delegations“. | [Fetch-/ASI-Wallet-Anleitung](https://network.fetch.ai/docs/guides/network/how-to-stake) |
| Cosmos Hub ATOM | 21 Tage / drei Wochen | Nach dem durch die Unbond-Transaktion gestarteten Zeitraum. Die Aussage gilt für den Hub, nicht automatisch für jede Cosmos-SDK-Chain. | [Cosmos Hub FAQ](https://docs.cosmos.network/hub/latest/delegators/delegator-faq) |
| Ethereum ETH | Variable Exit-Warteschlange; beim regulären freiwilligen Exit danach 256 Epochen, etwa 27,3 Stunden, bis zur Auszahlungsberechtigung; anschließend Sweep | Automatische Übertragung an die hinterlegte Withdrawal-Adresse. Die Gesamtdauer ist keine feste 21-Tage-Frist. | [Launchpad](https://launchpad.ethereum.org/withdrawals), [Ethereum-Auszahlungen](https://ethereum.org/staking/withdrawals/) |
| Solana SOL | Abhängig von Epochengrenzen und Übergangskapazität; eine Epoche dauert ungefähr zwei Tage | Deaktivierter Stake muss „inactive“ sein und anschließend abgehoben werden; zusätzliche Kontolockups gesondert prüfen. | [Solana Staking FAQ](https://solana.com/staking) |

Für FET begründet die Wallet-Anleitung den Zeitraum mit Netzwerksicherheit. Der [Redelegation-Guide](https://network.fetch.ai/docs/guides/network/re-delegating-staked-fet-token) beschreibt den Verzicht auf Staking-Rewards während des Unbondings. Ein Wechsel des Validators und eine frei verfügbare Auszahlung sind unterschiedliche Vorgänge.

Liquid Staking und der Verkauf eines Staking-Anteils haben eigene Markt-, Liquiditäts- und Anbieterrisiken. Sie sind keine garantierte Sofortauszahlung zum Nennwert und keine rückwirkende Aufhebung einer bereits begonnenen Sperrfrist. [Ethereum-Auszahlungen](https://ethereum.org/staking/withdrawals/)

## Was ein Bestätigungsdialog zeigt

Eine Vorschau mit einer Wartezeit oder einem geschätzten Freigabedatum belegt die sichtbare Information in diesem Dialog. Ob der Nutzer danach signiert hat, ob die Transaktion angenommen wurde und wann eine Position freigegeben wird, benötigt den zugehörigen Vorgangsbeleg. Das ursprüngliche Staking-Datum startet nicht automatisch den späteren Unbonding-Zeitraum.

Für eine konkrete Rekonstruktion genügen zunächst Netzwerk, Wallet-Version, Transaktionsreferenz, bestätigter Start und angezeigte Abschlusszeit. Die öffentlich zugängliche heutige Anleitung ersetzt keine Rekonstruktion der damals angezeigten Vorabinformation. Persönliche Bestände und Originalscreenshots werden hier nicht veröffentlicht.

## Vorschlag: Verfügbarkeit vor Ertrag erklären

Folgende Produktverbesserungen werden als Gestaltungsforderungen vorgeschlagen:

1. Vor dem ersten Staking die Ausstiegsdauer und deren Startpunkt in derselben Ansicht wie die Bestätigung zeigen.
2. „Sofort verfügbar“, „delegiert“ und „im Ausstieg“ mit jeweils eigenem Betrag darstellen.
3. Validatorwechsel und Auszahlung als unterschiedliche Aktionen benennen.
4. Rewards während der Wartezeit, Gebühren, mögliche zusätzliche Lockups und erforderliche letzte Schritte sichtbar machen.
5. Feste Zeiten, Schätzungen und Warteschlangen klar unterscheiden; die zugrunde liegende Regelversion verlinken.
6. Widersprüchliche Dokumentation mit Datum und Änderungsverlauf auflösen und einen zuständigen Beschwerdekanal anbieten.

## Beschwerde und rechtliche Prüfung

Constellation nennt in seinen [Terms of Service](https://constellationnetwork.io/terms-of-service/) `info@constellationnetwork.io` als Kontakt für Beschwerden über die Website beziehungsweise Informationen zum Service. Das ist ein verifizierter erster schriftlicher Kontakt, keine Zusage, dass diese Stelle eine Protokollfrist verkürzen kann. Eine sachbezogene Anfrage sollte um Weiterleitung an die verantwortliche Produkt-, Dokumentations- und Beschwerdestelle bitten.

Bei anwendbarem deutschem Vertragsrecht kommen insbesondere die Einbeziehung von AGB und ihre Verständlichkeit in Betracht. Eine 21-Tage-Regel allein stellt noch keinen festgestellten Rechtsverstoß dar. Vertragspartner, vereinbarte Leistung, anwendbares Recht und konkrete Darstellung müssen zugeordnet werden. [§ 305 BGB](https://www.gesetze-im-internet.de/bgb/__305.html), [§ 307 BGB](https://www.gesetze-im-internet.de/bgb/__307.html)

Die auf der ESMA-Seite veröffentlichte Antwort der Europäischen Kommission unterscheidet direktes Staking von verwahrendem Staking-as-a-Service. Eine Walletansicht identifiziert deshalb für sich keinen beaufsichtigten Verwahrdienstleister. [ESMA Q&A 2067](https://www.esma.europa.eu/publications-data/questions-answers/2067)

Eine Beschwerde kann um Erklärung, dokumentierten Ausstiegsstatus, Korrektur der Hinweise und Prüfung tatsächlicher Nachteile bitten. Schadensersatz verlangt eine passende Grundlage und verursachte Schäden; Unternehmens- oder Protokollanteile entstehen nicht allein durch eine Wartefrist. [§ 280 BGB](https://www.gesetze-im-internet.de/bgb/__280.html)

## Umfang und Fortsetzung

Dies ist eine endliche Dokumentationsprüfung von fünf Netzwerken. Gegenstand sind öffentlich zugängliche Dokumentationsquellen. Produktiver Code, Gesamtprotokollsicherheit, historische individuelle Aufklärung und tatsächliche Auszahlungen waren nicht Gegenstand dieser Prüfung. Weitere Netzwerke lassen sich mit denselben Feldern ergänzen. Eine Korrektur der Quellen, eine offizielle Antwort oder ein konkreter Transaktionsbeleg eröffnet die passende nächste Prüfung.

[Projekt und strukturierte Quellen](../branches/staking-unbonding-transparency-review/README.md) · [Digitale Plattformen](../wiki/Digitale-Plattformen.md) · [Diskussion](https://github.com/Juri-Halveth/open-research-branches/discussions) · [Lizenzkarte](../LICENSES.md)
