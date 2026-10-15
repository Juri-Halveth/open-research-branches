# Technikfortsetzung: vom Suchhinweis zur prüfbaren Quelle

**Stand:** 15. Oktober 2026 · **Basis:** Commit `4b96bc02857439806312387aa0f29e8e472cc13f` · **Status:** `FINITE_SNAPSHOT_WITH_REOPEN_TRIGGER`

## Wo dieser Forschungsast stand

Die interaktive Karte und der [Querverbindungsnachtrag](QUERVERBINDUNGEN_ROMANOVA_WIDOW_WINDOWS_KRISEN_2026-10-15.md) unterscheiden bereits Fiktion, Wortähnlichkeit, Politik, Archivspur und materielle Vergleichsbehauptung. Die ursprünglichen zwölf Quellen und dreizehn Claims in [`audit.json`](audit.json) bleiben als eigener Snapshot erhalten. Die offene technische Kante war der Übergang von einem **Fundort** zu einem **identifizierten Dokument**, weiter zu einer **genau gelesenen Passage** und erst dann zu einer **belegten Relation**. Eine URL oder ein Hash alleine schließt diesen Übergang nicht.

Die ältere [projektweite Technologie-Roadmap](../../reports/TECHNOLOGY_ROADMAP_2026-09-19.md) führt sechs Arbeitspakete zu CasePacket, Demo-Laufzeit, Portfolio-Identität, Receipts, Recovery und Demo-Einstiegen. Sie ist auf einen September-Quellstand gebunden und wurde hier **nicht** als heutiger Gesamtstatus aller 35 Katalogäste neu geprüft. Für den aktuellen Black-Widow-Ast wurde der Quellenübergang ausgewählt.

## Jetzt materialisiert: Source-Trail v1

[`source-trail.json`](source-trail.json) hält sechs öffentliche Quellen, drei ausdrücklich typisierte Dokumentbeziehungen und drei offene Fragen. [`source-trail.mjs`](source-trail.mjs) prüft ohne Netzabruf die Struktur: IDs, Datumswerte, HTTPS-Fundorte, Lesetiefe, Endpunkte, azyklische Beziehungen und Wiederöffnungstrigger. Der erste Lauf ergibt **6 Quellen, 3 Relationen, 3 offene Fragen, 0 vollständig geprüfte Dokument-Captures**. V1 akzeptiert deshalb keinen Inhalts-Hash ohne einen eigenen Byte-Capture-Vertrag. `0` ist hier die Zahl *dieses Pakets*, keine Aussage über die Welt oder über ungelesene Archive.

```sh
node branches/black-widow-world-audit/source-trail.mjs
node --test branches/black-widow-world-audit/source-trail.test.mjs
```

Die Kante `S/2023/683 RESPONDS_TO S/2023/661` ist aus dem Wortlaut der [iranischen Antwort](https://digitallibrary.un.org/record/4021527/files/S_2023_683-EN.pdf) überprüfbar. Der [UN-Bericht S/2023/975](https://digitallibrary.un.org/record/4030378/files/S_2023_975-EN.pdf) berichtet über die Einreichungen. Der Bericht wird dadurch nicht als zweite unabhängige Untersuchung derselben Drohnenteile gezählt. Ein Validatorpass bestätigt nur diese deklarierte Struktur, nicht die Herkunft eines Bauteils oder die Wahrheit einer Parteibehauptung.

## Was „Deep Web“ hier praktisch bringt

Der produktive Einstieg sind öffentlich erreichbare **Datenbanken und Findmittel**, deren einzelne Datensätze eine allgemeine Websuche oft nicht sinnvoll erschließt. Das [Bundesarchiv erklärt zu invenio](https://www.bundesarchiv.de/im-archiv-recherchieren/archivgut-recherchieren/recherchesysteme/invenio/), dass online recherchierbare Beschreibungen nicht automatisch uneingeschränkten Zugang zum Archivgut bedeuten. Der [NARA-Katalog](https://www.archives.gov/research/catalog/help/using) unterscheidet Archivbeschreibungen und digitale Objekte. Deshalb speichert der Trail für einen neuen Fund getrennt:

1. **Suchoberfläche und Suchbegriff** mit Abrufdatum;
2. **stabile Signatur oder Dokument-ID** und Beschreibungsebene;
3. **Zugangsstatus**: Beschreibung, digitales Original, Lesesaal oder gesperrt;
4. **tatsächlich gelesener Textbereich** und erst bei rechtmäßigem Capture dessen Bytes/Hash;
5. **Relation** zur Forschungsfrage, Gegenquelle und kleinsten nächsten Unterscheider.

Für Rosenholz/SIRA fehlt hier weiterhin eine konkrete, frei prüfbare Einzelsignatur. Der Archivführer ist ein **Rechercheweg**, nicht das vermisste Original.

## Was eine Darknet-Recherche zusätzlich verlangen würde

[Tor beschreibt Onion Services](https://community.torproject.org/onion-services/overview/index.html) als Dienste mit einer eigenen Adress- und Authentisierungslogik. Das sagt noch nichts über die Echtheit eines dort angebotenen Dokuments. Ein relevanter öffentlicher Onion-Dienst müsste zuerst über eine **vom Betreiber selbst veröffentlichte Adresse**, einen benannten Forschungsgegenstand, zulässigen Zugriff und einen dokumentierten Capture gebunden werden. Danach gelten dieselben Quellenfragen wie im offenen Web: Wer hat das Dokument erstellt? Ist es Original, Kopie oder Behauptung? Wann wurde es beobachtet? Welche unabhängige Gegenquelle gibt es?

Der aktuelle öffentliche Source-Trail enthält **keine Onion-Adresse, keinen Tor-Crawler und keinen automatischen Abruf**. Seine `Q_ONION_RELEVANCE` bleibt `NO_TARGET_BOUND`. Ein gesperrtes Archiv oder ein authentifizierungspflichtiger Dienst wird nicht durch technische Umgehung zum Beleg. Rechtmäßig zugängliche neue Quellen können später als gesonderter, datierter Datensatz aufgenommen werden; private Rohdaten bleiben außerhalb dieses öffentlichen Repositories.

## Mehr-Apertur-Prüfstand für den nächsten Schritt

| Forschungsachse | Zustand | Engster offener Punkt |
| --- | --- | --- |
| `SOURCE` | `MATERIAL_CANDIDATE` | Exakte Archivsignatur bzw. identifizierbares Bauteil-Capture fehlt. |
| `DEFINITION` | `STABLE` | Fundort, Dokument, Textpassage und Beleg sind getrennt definiert. |
| `MECHANISM` | `UNKNOWN` | Weder Archiv-Wiederherstellung noch Lieferkette sind in diesem Trail neu rekonstruiert. |
| `COUNTERHYPOTHESIS` | `STABLE` | Parteiquellen, Spiegelungen und bloße Wortähnlichkeit bleiben Gegenmodelle. |
| `OBSERVATION` | `MATERIAL_CANDIDATE` | Suchauszug versus vollständiger Originaltext ist noch zu unterscheiden. |
| `MATERIALIZATION_BRIDGE` | `MATERIAL_CANDIDATE` | Ein rechtmäßiger, reproduzierbarer Capture mit Umfang und Rechten fehlt. |
| `IMPACT` | `UNKNOWN` | Kein neuer historischer oder institutioneller Effekt aus dem Tool bewiesen. |
| `UNKNOWN_FRONTIER` | `STABLE` | Reopen-Trigger stehen pro Frage im Datensatz. |

| Kandidat | Tiefe 1 | Tiefe 2 | Tiefe 3 | Tiefe 4 / Grenze |
| --- | --- | --- | --- | --- |
| `SOURCE` | Fundort | Dokument-ID | Originalpassage | unabhängig prüfbares Original: offen |
| `OBSERVATION` | Link | Suchauszug | vollständiges Lesen | dokumentierter Capture: offen |
| `MATERIALIZATION_BRIDGE` | Exportrecht | Capture-Vertrag | Byte- und Kontextprüfung | reproduzierbare Gegenprüfung: offen |

**Diagonaler Paargraph:** `SOURCE × OBSERVATION` verlangt dieselbe Dokument-ID für den gelesenen Text; `SOURCE × MATERIALIZATION_BRIDGE` verlangt einen erlaubten Originalzugang statt nur einen Katalogtreffer; `OBSERVATION × MATERIALIZATION_BRIDGE` verlangt die genaue Fassung der erfassten Bytes. Das sind alle drei ungeordneten Paare der drei materiellen Kandidaten. Ihre Reihenfolge ist eine **Suchheuristik**: zuerst `SOURCE`, dann `OBSERVATION`, dann `MATERIALIZATION_BRIDGE`; sie bewertet keine historische Wahrheit.

**Nächster produktiver Prüfpfad:** Eine konkrete öffentliche Einzelsignatur im Bundesarchiv oder ein separat provenienzierte Bauteiluntersuchung mit Bild, Kennung und Erwerbskette öffnet den passenden Datensatz. Bis dahin bleibt der gesunde Elternstand der Quellenkarte erhalten. Der Source-Trail ist ein lokaler, read-only Strukturbaustein; eine spätere automatische Beschaffung, Tor-Integration oder externe Veröffentlichung benötigt einen eigenen gebundenen Scope.
