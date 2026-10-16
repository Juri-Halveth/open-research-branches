# LUCINET / NOAA: vor den Zielstunden gebundener Tide-Datenstand

**Protokollstand:** 16. Oktober 2026 UTC · **Zustand:** vor dem ersten hier geplanten NOAA-GET fixierter Prüfvertrag. Dieses Dokument hält eine künftige Messkante offen. Erst ein späterer, separat geprüfter Receipt darf Ergebnisse ergänzen.

## Feste Zielmenge

| Station | NOAA-ID | Zielstunden UTC |
| --- | --- | --- |
| Eastport | `8410140` | 18. Oktober 2026 00:00 bis 19. Oktober 23:00 |
| The Battery | `8518750` | 18. Oktober 2026 00:00 bis 19. Oktober 23:00 |
| San Francisco | `9414290` | 18. Oktober 2026 00:00 bis 19. Oktober 23:00 |

Je Station ist genau **ein** öffentlicher, nur lesender [NOAA-CO-OPS-GET](https://api.tidesandcurrents.noaa.gov/api/prod/) vor `2026-10-18T00:00:00Z` vorgesehen: `product=predictions`, `interval=h`, `begin_date=20261018`, `end_date=20261019`, `datum=MLLW`, `time_zone=gmt`, `units=metric`, `format=json`, `application=LUCINET_benchmark`. Die Reihenfolge ist Eastport, The Battery, San Francisco. Keine Wiederholung oder Ersatzstation nach Einsicht in Antworten. HTTP-Fehler und fehlende Werte bleiben im Nenner der drei geplanten Abrufe.

Der lokale Erfassungsreceipt soll pro Versuch die exakte URL, Start-/Endzeit, HTTP-Status, Response-Header `Date` (falls vorhanden), rohe Antwortbytes, Länge und SHA-256 enthalten. `Date` ist ein Server-Header, keine qualifizierte Zeitbestätigung. Die Publikation von Plan- und Antwort-Digests vor dem ersten Zielzeitpunkt kann eine öffentlich prüfbare **as-of-Spur** schaffen; sie beweist weder die Unveränderlichkeit der NOAA-Quelle noch Urheberschaft.

## Vorab festgelegte Auswertung

Eine Antwort ist für eine Station gültig, wenn sie HTTP 200 und genau 48 lückenlose stündliche GMT-Zeitpunkte mit endlichen numerischen Tide-Werten für die obige Zielmenge enthält. Ein JSON-Fehler trotz HTTP 200 ist ungültig. Ungültige Stationen bleiben ausgeschlossen, ohne Nachabruf oder stillen Ersatz.

**Track A – echte Vorab-Tide-Baseline:** Der jetzt gespeicherte Tide-Wert für jede Zielstunde wird später mit `product=hourly_height` derselben Station, desselben Datums, Datumsbezugs und derselben Einheit verglichen. Erst nach Verfügbarkeit der verifizierten NOAA-Pegel werden Vorzeichenfehler, MAE und RMSE pro Station und gepoolt über gültige Paare berechnet. Fehlstunden, Qualitätsflags und vorläufige/verifizierte Produktstände sind sichtbar zu berichten. Die spätere Pegelantwort wird getrennt gehasht; keine spätere NOAA-Tide-Version ersetzt den hier gesicherten Eingang.

**Track B – bedingte rollierende Rekonstruktion:** Die vier bereits beschriebenen Formeln M1, M2, Tide-only und `R1(i)=Tide(i)+H(i−1)−Tide(i−1)` bleiben unverändert; der [2024er Prüfbericht](LUCINET_NOAA_2024_REPLICATION_2026-10-16.md) enthält Auswahlregel, Indizes und Ausschlusslogik. Wenn die späteren verifizierten Pegelstunden 0–31 vollständig und qualitätsgeprüft vorliegen, können die Ziele 8–31 mit jeweiligem echtem Vorgängerwert nachgerechnet werden. Diese Rechnung benutzt einen **später gesicherten verifizierten Vorgängerwert**. Sie ist damit eine fixierte bedingte Formelprobe, keine belegte live abgegebene R1-/M1-/M2-Prognose. Eine operative Echtzeitprobe bräuchte separat archivierte vorläufige Messwerte jeweils **vor** ihrer Zielstunde.

Die 2025er und 2024er historischen Fenster dienten der Entwicklung und Replikation der Formeln; diese drei Stationen sind dieselben. Zielzeit und Tide-Vintage sind neu, die Stationenpopulation und Quellenfamilie nicht unabhängig. Der künftige Vergleich ist offen: Die Formeln können besser oder schlechter ausfallen, und ein NOAA-Ausfall kann die auswertbare Menge verkleinern.

**Claim Ceiling:** Bis zu einem Antwortreceipt gibt es nur einen Plan. Danach liegt für gültige Antworten ein vor den Zielstunden gesicherter Tide-Datenstand vor; ein Fehlermaß oder Modellleistungsbeleg entsteht erst mit gebundenen späteren Pegeln und der getrennten Auswertung.
