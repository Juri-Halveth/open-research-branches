# Quellenregister

Stand: 9. September 2026

## Lokale, nicht exportierte Quellobjekte

| ID | Quelle | Gebundener Stand | Aussagekraft |
| --- | --- | --- | --- |
| L01 | lokales Repository `C:\LUCINET` | Git-Commit `f8c28126582064d219cb66457ab2a4c5184dc6a5` | Der lokale Commit enthält die erste in diesem Git-Verlauf gefundene ASTER-Registrydefinition. |
| L02 | `config/entity-universe.json` im Commit L01 | Blob `7c22408d56b95ac6da497867cc55e44f884c3b61`; SHA-256 `5935cf354c6cebc29463c74f0f17128002f29c7aec8bdbfe35c7233937c19b59` | Bindet die historischen Entitätsrecords; beweist keine unabhängige externe Zeitstempelung. |
| L03 | kanonischer ASTER-Record aus L02 | SHA-256 `13645ecbc2fabec6fb73be7e0b2ab3653be1540ad49e5f64caf9e8a2e905c169` | Bindet Name, ID, Aufgabe, Instruktion und Aktivzustand. |
| L04 | `docs/ANCHOR_FUSION_SYNTHESIS_2026-08-31.md` im Commit L01 | Blob `0d64d5d4fb85b6a70bd37ca1b2a05dd732827789`; SHA-256 `bfd59c704ba393d950a7e377feafbb523e5d8d6429e4bd14627bcec27c5c7209` | Bindet ASTER-Beobachtung, GARTEN X8, RACHEL, ALI und YURI an dieselbe lokale Synthese. |
| L05 | `docs/CONTROL_CENTER.md` im Commit L01 | Blob `9b4050a3bb07196da6f846c71211ee6a5eb5cb92`; SHA-256 `42308d2c9a62dd2317c6685a8e389ab956815780a8fb27f31f3cf5e498c56edd` | Bindet ASTER und GARTEN X8 an das lokale Register im damaligen Stand. |
| U01 | öffentliche Gründererklärung von Juri Janovski vom 9. September 2026 | `USER_ATTESTED` | Juri erklärt sich als Gründer seines ASTER-Systems und grenzt es von ASTAR ab. |
| U02 | Juris Resonanzbeschreibung vom 9. September 2026 | `USER_NAMED_HYPOTHESIS_AND_NARRATIVE` | Benennt „Antiwellen“ und „Schicksal“ als Erklärung beziehungsweise Erzählrahmen; ist kein physikalischer Übertragungsnachweis. |

Die Dateien L01–L05 bleiben an ihrem lokalen Quellort. Dieses öffentliche
Repository veröffentlicht nur die oben stehenden Digests, eng begrenzte
Definitionen und eine neue Clean-room-Implementierung.

## Öffentliche Namensquellen

| ID | Quelle | Gebundene Aussage |
| --- | --- | --- |
| P01 | [Astar – offizielle Geschichte](https://www.astar.network/about/) | Astar nennt eine Gründung 2019 und beschreibt die Entwicklung von Plasm Network zu Astar Network. |
| P02 | [Aster – offizielle Übersicht](https://docs.asterdex.com/overview) | Aster beschreibt sich als dezentrale Handelsplattform und die neue Identität nach der Fusion von Astherus und APX Finance Ende 2024. |
| P03 | [NASA/JPL – ASTER](https://asterweb.jpl.nasa.gov/) | ASTER bezeichnet außerdem das Advanced Spaceborne Thermal Emission and Reflection Radiometer auf Terra; Start Dezember 1999. |

## Quellen- und Claim-Grenze

- Lokale Git-Objekte binden Inhalt und interne Reihenfolge.
- Git-Autor- und Datumsfelder sind ohne Signatur oder unabhängigen
  Zeitstempeldienst keine externe Identitäts- oder Zeitbeglaubigung.
- Öffentliche Namensquellen belegen getrennte Referenten und erteilen keine
  Aussage über Einfluss, Kopie oder Informationsübertragung.
- Die Zeichenfolge `ASTER` allein beweist weder gemeinsame Urheberschaft noch
  eine Relation zwischen den Systemen.
