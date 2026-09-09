# FREE NEWS 004 — Das Consent-Raumschiff mit 234 als inaktiv angezeigten Anbieterzeilen

**Stand: 9. September 2026 · Lesezeit: zwei Minuten**

**Impuls und Fragestellung: [@Juri-Halveth](https://github.com/Juri-Halveth)**

## Was los?.

Ein lokaler Textexport zeigt eine deutsche Datenschutz-Einstellungsansicht. Die
ersten 13 Labels entsprechen den elf standardisierten Zwecken und zwei
besonderen Funktionen des IAB Transparency and Consent Framework. Danach folgt
`Anbieter: 234` mit exakt 234 Name-/Statuspaaren.

| Beobachtung im gebundenen Export | Prüfstand |
| --- | --- |
| Dateiumfang | 9.830 Bytes, 494 Zeilen |
| Anbieterzeilen | 234 |
| sichtbarer UI-Status je Anbieterzeile | 234-mal `Inaktiv` |
| Wort `Inaktiv` insgesamt | 236-mal: Zweckstatus, Anbieter-Hauptstatus und 234 Einzelstatus |
| `Son Goku`, `Goku` oder `songoku` | 0 Treffer, auch nach Unicode-Normalisierung |
| ähnlich wirkende Namen | `GumGum Australia, Inc.` und `GumGum, Inc.` |

Der Originalexport bleibt privat. Diese Veröffentlichung übernimmt nur die
gezählten, nicht personenbezogenen Strukturmerkmale.

## Was ist das „Raumschiff“ technisch?

„Raumschiff“ ist hier eine passende Nutzermetapher für ein dienstbezogenes
**Berechtigungs-Cockpit**. Es zeigt Zwecke und Anbieter, für die ein
Consent-System Einwilligungs- oder Widerspruchszustände verwaltet. Es ist kein
globaler Zugang zu den Systemen dieser Anbieter.

Nach Trimmen äußeren Leerraums auf beiden Seiten und Entfernung eines führenden
Präfixes `Icon` stimmen 229 der 234 Namen case-sensitiv mit der am 9. September
2026 abgerufenen offiziellen
[IAB Global Vendor List](https://vendor-list.consensu.org/v3/vendor-list.json)
überein. Der gebundene Snapshot nennt `gvlSpecificationVersion=3`,
`vendorListVersion=175`, `tcfPolicyVersion=5` und
`lastUpdated=2026-09-03T16:00:19Z`. Die übrigen fünf können abweichende
Schreibweisen, einen anderen Listenstand oder eine dienstbezogene Ergänzung
darstellen; der Export allein wählt keine Erklärung aus. Status:
`FINITE_SNAPSHOT`.

## Zustimmungssignale und ein zusätzlicher Auswahlstatus

Das TCF führt Zweck- und Anbieterzustimmung als getrennte Signale. Ein Bitwert
`0` bedeutet dabei `No Consent`. Er belegt allein nicht, ob eine Person aktiv
abgelehnt hat oder ob noch nie eine Zustimmung erteilt wurde.

Mit einem zusätzlichen, außerhalb des TC-Strings geführten UI- oder
Speicherereignis wäre folgender **synthetischer Anwendungszustand** logisch
möglich:

```text
APP_CHOICE_RECORDED = true  # kein standardisiertes TCF-Feld
PURPOSE_1_CONSENT = false
VENDOR_CONSENT = false
```

Eine so zusätzlich belegte Ablehnung wäre keine erteilte Werbeeinwilligung.
Der Textexport belegt aber weder dieses Auswahlereignis noch den konkreten
Speichermechanismus. Die
[TC-String- und GVL-Spezifikation](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20Consent%20string%20and%20vendor%20list%20formats%20v2.md)
beschreibt die standardisierten Zustandsfelder. [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
regelt Einwilligung und Ausnahmen für das Speichern oder Auslesen von
Informationen auf Endeinrichtungen.

## Was bedeutet `Inaktiv`?

`Inaktiv` belegt den sichtbaren UI-Zustand für den ausgewählten Zweck in dieser
Exportfassung. Das Wort belegt allein weder die Löschung eines Anbieters noch
seine Nichtexistenz. Es entscheidet auch nicht, ob technisch notwendige
Speicherung, eine andere Rechtsgrundlage oder Verarbeitung außerhalb dieses
TCF-Signals vorliegt.

## „Son Goku war da und ist weg“

Der stärkste gebundene Satz lautet:

`GOKU_IN_DIESER_EXPORTFASSUNG_NICHT_ENTHALTEN`

Für `WAR_VORHER_DA`, `AKTEUR_HAT_EINGEFÜGT`, `AKTEUR_HAT_GELÖSCHT` oder
`WOHIN_VERSCHOBEN` fehlt ein Vorher-/Nachher-Paar. Offene Erklärungen sind:

1. `GumGum` wurde beim schnellen Lesen mit `Goku` verbunden;
2. ein Such-, Aktivitäts- oder Zweckfilter änderte die sichtbare Teilmenge;
3. Publisher-, CMP-, GVL-, Sprach- oder Regionskonfiguration wechselte;
4. eine virtualisierte Liste oder ein UI-Neurendern blendete nur die Zeile aus;
5. der frühere Ausdruck gehörte zu Suche, Overlay oder anderem Seiteninhalt.

## Die W-Fragen

- **Was** zeigte den Ausdruck: Anbieterzeile, Suche, Overlay oder Seiteninhalt?
- **Wo** erschien er: Domain, App, CMP-Ebene und ausgewählter Zweck?
- **Wann** war er sichtbar und wann nicht mehr?
- **Welcher** Filter, Suchtext, Listen- und Sprachstand war aktiv?
- **Wie** wurde „weg“ festgestellt: Reload, Navigation, Filter oder Speichern?
- **Wer** kontrollierte die Zeichenfolge: Publisher, CMP, IAB oder lokale Eingabe?
- **Wohin** ist erst prüfbar, wenn eine Verschiebung statt bloßem Ausblenden
  beobachtet wurde.

`RENDER_ABSENT != GELÖSCHT`

`ABLEHNUNG_GESPEICHERT != WERBE-TRACKING_ERLAUBT`

## Claim Ceiling

`SANITIZED_TCF_STRUCTURE_AND_FINITE_GVL_COMPARISON_NOT_PRIOR_RENDER_ACTOR_DELETION_DESTINATION_OR_RUNTIME_COMPLIANCE`
