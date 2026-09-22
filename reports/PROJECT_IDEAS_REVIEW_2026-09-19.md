# HALVETH: Was fehlt zwischen Idee, Prototyp und öffentlichem Projekt?

Stand: 19. September 2026 · `FINITE_SNAPSHOT`

**Der größte nächste Nutzen liegt in den Verbindungen:** vorhandene Kerne
verständlich zeigen, ihre Übergabeformate zusammenführen und jede sichtbare
Funktion mit einem passenden Laufbeleg versehen.

## Konkrete Ergebnisse

1. **Atomic Legal ist weiter als das alte Konzeptpapier vermuten lässt.**
   Rust-Core und CasePacket V1 sind vorhanden. Die produktive Verbindung
   zur Oberfläche und zum Export bleibt offen. [Geprüfter Stand](ATOMIC_LEGAL_READINESS_2026-09-19.md).
2. **Der Projektbestand braucht getrennte Identitäten.** Ein Projekt kann
   mehrere Arbeitskopien haben; zwei lokale Repositories können denselben
   Remote verwenden. Ordnerzahlen sind deshalb keine Anzahl neuer Produkte.
3. **Die Einstiege brauchen eine einzige Bestandsquelle.** Mehrere Seiten
   nannten abweichende Zahlen. Sie verweisen jetzt auf
   [denselben Katalog](../catalog/branches.json).
4. **Neue Ideen brauchen ein Abnahmekriterium.** Die
   [Roadmap](TECHNOLOGY_ROADMAP_2026-09-19.md) enthält sechs konkrete Vorhaben,
   ihre Abhängigkeiten und jeweils überprüfbare nächste Ergebnisse.
5. **Die bestehende Lizenzregel muss auch im Wegweiser sichtbar sein.** Die
   [Nutzungsübersicht](../wiki/Rechte-und-Nutzung.md) verweist jetzt auf den
   vorhandenen prospektiven PIRL-2.0-Wechsel und die fortbestehenden
   historischen Freigaben. Diese Redaktion erteilt keine neuen Rechte.

## Was tatsächlich betrachtet wurde

| Bezugsgröße | Umfang | Bedeutung |
| --- | ---: | --- |
| Einträge auf der betrachteten lokalen Dokumente-Ebene | 119 | 108 Verzeichnisse und 11 Dateien; drei Verzeichnisverweise ausgeschlossen |
| Records in der frisch gelesenen Projektregistry | 39 | 36 verschiedene deklarierte Pfade |
| Genau auflösbare Registry-Records | 34 | Fünf Pfade haben Kodierungsabweichungen; passende Verzeichniskandidaten existieren |
| Git-Arbeitsverzeichnisse aus Registry und oberster Dokumente-Ebene | 46 | Metadatenbeobachtung, keine vollständige Inhaltsprüfung |
| Verschiedene Git-Common-Dirs in dieser Auswahl | 36 | Dedupliziert lokale Repository-Identitäten, keine Produktzahl |
| Sichtbare öffentliche Account-Repositories beim GitHub-Abruf | 8 | Öffentlicher Account-Snapshot; keine Aussage über private oder fremde Repositories |

Ausgewählte Status-/Architekturtexte und die Atomic-Legal-Quellen wurden
inhaltlich geprüft. Die breite Inventur betrachtete Pfade, Git-Metadaten und
vorhandene Statusquellen. Verschachtelte, nicht registrierte Repositories
wurden nicht vollständig rekursiv gesucht. Metadatenfehler, unbekannter
Publikationsstatus und Datenklassen bleiben im lokalen Inventar sichtbar.

Die Registry selbst wurde bei dieser Prüfung nicht umgeschrieben. Die fünf
Pfadkorrekturen benötigen eine gezielte Übernahme; ein öffentliches
Roadmap-Dokument repariert keinen lokalen Registry-Eintrag.

## Ideen mit konkretem technischen Nutzen

- **CasePacket-Verbindung:** einmal strukturiert erfassen, anschließend mit
  erhaltenen Quellen, Gegenargumenten und Unbekanntem weitergeben.
- **Demo mit echtem Eingabebezug:** eine sichtbare Änderung muss aus dem
  tatsächlich gebundenen Kernlauf stammen.
- **Projektregister mit mehreren Ebenen:** Projekt, Repository,
  Arbeitsverzeichnis und Veröffentlichung getrennt adressieren.
- **Gemeinsamer Übergabebeleg:** einen referenziellen Auftrag für Rachel,
  LUCINET und Research entwickeln und seine Lesbarkeit in getrennten
  Testkonsumenten nachweisen; Zustände und Buchungen bleiben getrennt.
- **Wiederherstellungsprobe:** Erfolg an einem synthetischen Restore messen,
  statt aus der Existenz eines Backup-Skripts abzuleiten.
- **Reproduzierbarer Demo-Einstieg:** ein Befehl, benannte Eingabe, erwartete
  Ausgabe und offene Grenze pro ausführbarem öffentlichen Modul.

## Was dieser GitHub-Beitrag materialisiert

Die Roadmap liegt als [strukturierte Datei](../catalog/technology-roadmap.json)
vor. Ein [Generator](../scripts/build-technology-roadmap.mjs) erzeugt die
lesbare Ansicht und bindet die Astzahl an den aktuellen Katalog. CI prüft
IDs, Referenzen, Abhängigkeiten und die Aktualität der erzeugten Datei.
Diese Strukturprüfung ersetzt keine fachliche Abnahme der Vorhaben.

```text
npm run build:roadmap
npm run check:roadmap
npm test
```

Der lokale Vollbestand, sensible Quellen und historische Archive bleiben
getrennt. Hier erscheinen neue, geprüfte Zusammenfassungen und Code für die
öffentliche Roadmap. Die sechs Vorhaben sind durch diese Veröffentlichung
noch nicht als vollständige Produktintegration umgesetzt.

**English summary:** This review found an existing local legal core and
CasePacket contract, incomplete integration seams, stale navigation counts,
and a need to distinguish projects from worktrees and releases. The public
deliverable is a generated, testable technology roadmap with six bounded
next steps; private project metadata and source code remain outside it.

Lizenz der neuen Inhalte: [HALVETH PIRL 2.0](../LICENSE-HALVETH-PIRL-2.0.md)
gemäß [LICENSES.md](../LICENSES.md).
