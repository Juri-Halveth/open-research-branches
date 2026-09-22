# HALVETH · Technologie-Roadmap

Stand: **2026-09-19** · Beobachtungszeit: `2026-09-18T22:58:20.778Z`

Review-Basis: `a9acbd61e532e8c6229d592fdc1cab041e7e4be2`

Endlicher Abgleich des öffentlichen Research-Quellstands mit ausgewählten lokalen Projektquellen und Metadaten. Quellenprüfung, lokale Tests, öffentliche Demonstration und produktive Integration bleiben getrennt. Dies ist keine vollständige Produkt-, Sicherheits- oder Neuheitsprüfung.

Der [Projektkatalog](../catalog/branches.json) führt **29 Forschungs- und Softwareäste**. Diese Roadmap enthält **6 Arbeitspakete**.

## Was die Zustände bedeuten

Die Zustände sind deklarierte Reviewstände. Sie sind keine Laufzeit-Zertifizierung, Rechtsbewertung oder Zusage einer vollständigen Bestandsaufnahme. Dieser endliche Review lässt weitere Quellen und offene Fragen zu.

- `SOURCE_REVIEWED_GAP`: Lücke aus der Quellenprüfung.
- `SYNTHETIC_DEMO`: Synthetische Demonstration.
- `PROPOSED`: Vorgeschlagen.
- `PUBLIC_MODULE`: Öffentliches Modul.

## Arbeitspakete

<a id="item-CASEPACKET-BRIDGE"></a>

### Vorhandenen CasePacket-Vertrag mit dem Atomic-Core verbinden

**ID:** `CASEPACKET-BRIDGE` · **Reviewstand:** `SOURCE_REVIEWED_GAP` (Lücke aus der Quellenprüfung)

**Ausgangsstand:** Der Vertrag halveth.case\_packet.v1 besteht bereits. Ein produktiver Snapshot-Issuer und die kontrollierte Verbindung zum JSON-Renderer fehlen im geprüften Quellstand; das Exportflag ist false.

**Nächster Schritt:** Eine eigene Integrationsaufgabe am bestehenden V1-Vertrag umsetzen: Quelle, ausgewählte Projektion und Exportfreigabe explizit binden.

**Abnahmekriterien:**

- Ein synthetischer Fall durchläuft Atomic-Core, Snapshot, CasePacket und JSON-Renderer mit nachprüfbaren Quellversionen.
- Gegenargumente, Unbekanntes und Projektion bleiben im Roundtrip erhalten; ausgeschlossene Daten sind im Export abwesend.
- Fehlende oder nicht passende Exportfreigabe erzeugt kein exportierbares Paket. Strukturvalidierung bleibt von rechtlicher Bewertung getrennt.

**Abhängigkeiten:** Keine deklariert.

**Quellen:** [LOCAL-CORE](#source-LOCAL-CORE), [PUBLIC-METHODS](#source-PUBLIC-METHODS)

<a id="item-LENS-RUNTIME"></a>

### Die Legal-Lens-Referenzoberfläche an eine echte Demo anbinden

**ID:** `LENS-RUNTIME` · **Reviewstand:** `SYNTHETIC_DEMO` (Synthetische Demonstration)

**Ausgangsstand:** Die aktuelle lokale HTML-/JS-Fassung zeigt feste Beispiele, ein schreibgeschütztes Feld und den Hinweis auf fehlende Rust-Anbindung. Der angezeigte Fixpunkt ist ein fester Titel.

**Nächster Schritt:** Eine kleine Demo mit synthetischen Eingaben gegen den gebundenen Core bauen; jede Ausgabe an den tatsächlichen Eingabedigest binden.

**Abnahmekriterien:**

- Zwei gezielt verschiedene Eingaben erzeugen die vom Kern erwarteten unterschiedlichen Ergebnisse.
- Fehlender oder fehlgeschlagener Kernlauf bleibt als Fehler sichtbar und fällt nicht auf eine erfolgreiche Fixture zurück.
- Tastatur, Fokus, mobile Ansicht und Bewegungsreduktion werden an der ausgeführten Demo geprüft.

**Abhängigkeiten:** [Vorhandenen CasePacket-Vertrag mit dem Atomic-Core verbinden](#item-CASEPACKET-BRIDGE)

**Quellen:** [LOCAL-CORE](#source-LOCAL-CORE)

<a id="item-PORTFOLIO-IDENTITY"></a>

### Projekt, Repository, Worktree und Veröffentlichung getrennt registrieren

**ID:** `PORTFOLIO-IDENTITY` · **Reviewstand:** `SOURCE_REVIEWED_GAP` (Lücke aus der Quellenprüfung)

**Ausgangsstand:** Mehrere Arbeitsverzeichnisse teilen sich ein Git-Repository; getrennte lokale Repositories können denselben Remote besitzen. Die lokale Registry deckt diese Ebenen derzeit nicht vollständig ab.

**Nächster Schritt:** Ein getrenntes Register mit stabiler Projekt-ID, Repository-ID, Arbeitskopie, Statusquelle und Veröffentlichungspunkt einführen; die fünf Pfadkorrekturen einzeln übernehmen.

**Abnahmekriterien:**

- Zwei Worktrees desselben Common-Dirs zählen als zwei Arbeitskopien eines Repositorys.
- Ein konfigurierter Remote wird erst nach einer erfolgreichen Remote-Beobachtung als Veröffentlichung geführt.
- Jeder unaufgelöste Pfad behält Fehlergrund und erneuten Prüftrigger; private Pfade bleiben im lokalen Register.

**Abhängigkeiten:** Keine deklariert.

**Quellen:** [LOCAL-PORTFOLIO](#source-LOCAL-PORTFOLIO), [PUBLIC-METHODS](#source-PUBLIC-METHODS)

<a id="item-RECEIPT-INTEROP"></a>

### Gemeinsame, lesbare Übergabebelege für Rachel, LUCINET und Research

**ID:** `RECEIPT-INTEROP` · **Reviewstand:** `PROPOSED` (Vorgeschlagen)

**Ausgangsstand:** Provenienzbelege und öffentliche Referenzen sind vorhanden. Ein neuer gemeinsamer Adapter mit nachgewiesenem Import-/Export-Roundtrip wurde in dieser Prüfung nicht ausgeführt.

**Nächster Schritt:** Einen ausschließlich referenziellen Auftrag mit Version, Statusquelle, Evidenz, offener Frage und nächster Handlung zwischen zwei lokalen Testkonsumenten austauschen.

**Abnahmekriterien:**

- Ein synthetischer Auftrag behält ID, Status und Quellenreferenz in beiden Konsumenten.
- Wiederholter Import erzeugt keinen doppelten Auftrag; fremde oder veraltete Versionen bleiben sichtbar zurückgestellt.
- Die Referenzansicht erzeugt keine Ledger-, Zahlungs- oder Runtime-Aktion; solche Aktionen besitzen getrennte Schnittstellen.

**Abhängigkeiten:** [Projekt, Repository, Worktree und Veröffentlichung getrennt registrieren](#item-PORTFOLIO-IDENTITY)

**Quellen:** [PUBLIC-PROVENANCE](#source-PUBLIC-PROVENANCE), [LOCAL-PORTFOLIO](#source-LOCAL-PORTFOLIO)

<a id="item-RECOVERY-ROUNDTRIP"></a>

### Wiederherstellung als überprüften Ablauf dokumentieren

**ID:** `RECOVERY-ROUNDTRIP` · **Reviewstand:** `PROPOSED` (Vorgeschlagen)

**Ausgangsstand:** Backup-/Recovery-Metadaten und Skriptpfade sind vorhanden. In dieser Prüfung wurde keine Wiederherstellung ausgeführt und kein Tresor geöffnet.

**Nächster Schritt:** Ein synthetisches Testprojekt in ein neues Verzeichnis sichern und wiederherstellen; Dateiinhalt, Dateiauswahl und Laufprotokoll vergleichen.

**Abnahmekriterien:**

- Quelldateien bleiben unverändert; Ziel ist ein eigens angelegtes Testverzeichnis.
- Absichtliches Fehlen einer Testdatei führt zu einem sichtbaren unvollständigen Ergebnis.
- Der Beleg trennt erfolgreiche Wiederherstellung von alleiniger Hashgleichheit und von ungetesteten externen Abhängigkeiten.

**Abhängigkeiten:** Keine deklariert.

**Quellen:** [LOCAL-PORTFOLIO](#source-LOCAL-PORTFOLIO), [PUBLIC-PROVENANCE](#source-PUBLIC-PROVENANCE)

<a id="item-PUBLIC-DEMO-INDEX"></a>

### Pro öffentlichen Prototyp einen reproduzierbaren Einstieg pflegen

**ID:** `PUBLIC-DEMO-INDEX` · **Reviewstand:** `PROPOSED` (Vorgeschlagen)

**Ausgangsstand:** Öffentliche Prototypen haben eigene Tests und READMEs. Harte Gesamtzahlen in mehreren Einstiegsseiten waren veraltet; sie wurden durch Verweise auf den Katalog ersetzt.

**Nächster Schritt:** Je ausführbarem Prototyp einen Demo-Befehl, erwartete Ausgabe, Testlauf und verbleibende Lücke im Katalog binden.

**Abnahmekriterien:**

- Jeder Demo-Befehl läuft mit synthetischen Daten in einem frischen Checkout.
- CI prüft Demo-Pfade und generierte Ansichten gegen denselben Katalog.
- Ein grüner Einzeltest wird nur seinem Modul und Quellstand zugerechnet.

**Abhängigkeiten:** Keine deklariert.

**Quellen:** [PUBLIC-METHODS](#source-PUBLIC-METHODS), [PUBLIC-PROVENANCE](#source-PUBLIC-PROVENANCE)

## Quellenbindung

<a id="source-LOCAL-CORE"></a>

### LOCAL-CORE

**Typ:** `PRIVATE_REVIEW` (Interne Prüfung mit öffentlicher Kurzbeschreibung)

Atomic-Legal-Core und zwei CasePacket-Crates lokal geprüft. 115 gezielte Rust-Tests bestanden. UI-Anbindung, produktiver Export und vollständiger Cross-Crate-End-to-End-Pfad bleiben offen. Der öffentliche Bericht ist eine neu geschriebene Zusammenfassung; private Originalquellen sind nicht Teil dieses Exports.

- [Atomic Legal: geprüfter Entwicklungsstand](../reports/ATOMIC_LEGAL_READINESS_2026-09-19.md)

<a id="source-PUBLIC-METHODS"></a>

### PUBLIC-METHODS

**Typ:** `PUBLIC_SOURCE` (Öffentliche Quelle)

Bereits veröffentlichte, getrennte Methoden für begrenztes Inventar, Referenzprüfung und Entscheidungsorientierung.

- [Inventarverfahren](../branches/bounded-knowledge-reuse-inventory/README.md)
- [Referenzprüfer](../branches/document-issue-reference-verifier/README.md)
- [Focus Kernel](../branches/focus-kernel/README.md)

<a id="source-PUBLIC-PROVENANCE"></a>

### PUBLIC-PROVENANCE

**Typ:** `PUBLIC_SOURCE` (Öffentliche Quelle)

Öffentliche Provenienz- und Veröffentlichungskonventionen mit gebundenem Umfang.

- [Provenienz](../PROVENANCE.md)
- [Publikationsregeln](../PUBLICATION_POLICY.md)
- [Research-Referenz](../reports/HALVETH_RESEARCH_2026-09-18.md)

<a id="source-LOCAL-PORTFOLIO"></a>

### LOCAL-PORTFOLIO

**Typ:** `PRIVATE_REVIEW` (Interne Prüfung mit öffentlicher Kurzbeschreibung)

Metadatenprüfung: 119 unmittelbar betrachtete Dokumente-/Ordnereinträge, 39 Registry-Records und 46 Git-Arbeitsverzeichnisse mit 36 verschiedenen Git-Common-Dirs. Fünf Registry-Pfade sind exakt nicht auflösbar; passende Verzeichnisse mit anderer Zeichenkodierung existieren. Zählungen haben unterschiedliche Bezugsgrößen. Inhalte privater Fallakten und Tresore wurden nicht übernommen.

- [Portfolio: Umfang und nächste Schritte](../reports/PROJECT_IDEAS_REVIEW_2026-09-19.md)

## Reproduzierbare Fassung

Dieser Bericht wird aus [technology-roadmap.json](../catalog/technology-roadmap.json) und dem [Projektkatalog](../catalog/branches.json) erzeugt. Die Prüfung bindet Datenstruktur, Referenzen und Berichtsfassung; die Quellenbewertung bleibt ein eigener Arbeitsschritt.

```sh
node scripts/build-technology-roadmap.mjs
node scripts/build-technology-roadmap.mjs --check
```

Für Datei und Fassung gilt die [Lizenzkarte](../LICENSES.md), einschließlich ihrer prospektiven HALVETH-2.0-Regel und der fortgeltenden historischen Freigaben.
