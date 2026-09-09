# Gebaute Release-Artefakte

Der Quellstand dieses Astes erzeugt für Release `v0.9.0` drei öffentliche
Dokumente:

| Artefakt | Buildquelle | Rolle |
| --- | --- | --- |
| `JURI_WACHSMALSTIFT_FRIEDENSHELM_AUDIT.pdf` | `build_pdf.py` | zwölfseitiger Deep-Research-Audit |
| `JURI_WACHSMALSTIFT_FRIEDENSHELM_OPERATING_REVIEW.pptx` | `build_presentations.mjs` | sieben Folien zu Belegen, Gates und Pilot |
| `JURI_WACHSMALSTIFT_FRIEDENSHELM_MARKET_TRENDS.pptx` | `build_presentations.mjs` | sieben Folien zur qualitativen Vergleichs- und Wirkungskarte |

Die Binaries liegen nicht im Git-Tree. Vor einem Release werden sie gebaut,
vollständig gerendert, visuell geprüft, mit SHA-256 versehen und zusammen mit
dem Quell-Snapshot als GitHub-Release-Assets veröffentlicht.

## Rollen und Rechte

Die Texte, Zusammenstellungen und eigene Konzeptillustration in den drei
Artefakten stehen, soweit Juri Janovski darüber verfügen darf, unter der
[Juri Public-Interest Research Permission 1.0](../../LICENSE-JURI-PUBLIC-INTEREST.md).
Nichtkommerzielle gemeinwohlorientierte Nutzung ist unter deren Bedingungen
erlaubt. Werbung, Verkaufsförderung und andere kommerzielle Verwertung
benötigen, soweit gesetzlich eine Erlaubnis erforderlich ist, eine vorherige
schriftliche Vereinbarung. Kontakt: [juri@halveth.de](mailto:juri@halveth.de).

Die Buildprogramme stehen nach der pfadbezogenen
[Lizenzkarte](../../LICENSES.md) unter MIT. Importierte Präsentationsvorlagen,
verlinkte Quellen, Tatsachen, allgemeine Ideen, Namen und Rechte anderer werden
nicht neu lizenziert.

## Reproduktion

```powershell
python branches/wax-crayon-peace-helmet-audit/build_pdf.py
node branches/wax-crayon-peace-helmet-audit/build_presentations.mjs
node --test branches/wax-crayon-peace-helmet-audit/test/marker-protocol.test.mjs
```

Der PDF-Builder verwendet ReportLab. Der Präsentationsbuilder verwendet
`@oai/artifact-tool` und die in seiner Konfiguration bezeichneten
Referenzvorlagen. Ein erfolgreicher Build ist ein Dateiereignis; die
Freigabe als Release bleibt ein eigener, versionierter Schritt.
