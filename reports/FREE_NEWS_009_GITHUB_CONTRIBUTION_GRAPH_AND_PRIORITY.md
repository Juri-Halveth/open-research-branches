# FREE NEWS 009 — Was bedeuten GitHub-Contributions?

## Grüne Felder, Aktivität und belastbare Provenienz

Stand: `2026-09-10`

Datenklasse: `PUBLIC_MINIMIZED_DERIVATIVE`

Prüfstand: `FINITE_SNAPSHOT`

## Die direkte Antwort

`Contributions` sind Aktivitäten, die GitHub nach seinen eigenen Kriterien
einem Profil zurechnet. Der Kalender ist eine visuelle Übersicht dieser
Aktivität im betrachteten Zeitraum. Ein Feld steht für einen Kalendertag:

- **leer** bedeutet für diesen Tag im angezeigten Kalender `0` gezählte
  Contributions;
- **grün** bedeutet mindestens `1` gezählte Contribution;
- mehrere zählende Ereignisse desselben Tages erhalten kein eigenes Feld,
  sondern werden in diesem Tagesfeld zusammengefasst;
- die Farbstufe zeigt die Aktivitätsmenge relativ zu den anderen Tagen des
  Kalenders. Dunkler bedeutet mehr gezählte Contributions, nicht bessere
  Arbeit.

Die technische GitHub-Schnittstelle führt dafür je Tag unter anderem
`date`, `contributionCount`, `contributionLevel` und `color`. GitHub beschreibt
den Kalender selbst als visuelle Übersicht der Contribution-Aktivität:
[Contributions on your profile](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile) und
[ContributionCalendarDay](https://docs.github.com/en/graphql/reference/objects#contributioncalendarday).

`LEERES_FELD = NULL_BEITRÄGE_IM_ANGEZEIGTEN_GITHUB_KALENDER`

`GRÜNES_FELD >= EINE_ZÄHLENDE_GITHUB_AKTIVITÄT_AN_DIESEM_TAG`

Ein leeres Feld sagt damit nichts darüber aus, ob an diesem Tag außerhalb
GitHubs gedacht, recherchiert, entworfen, lokal programmiert oder in einem
nicht erfassten Branch gearbeitet wurde.

## Was GitHub tatsächlich zählt

Nach der aktuellen
[Profile contributions reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
zählen das Erstellen eines Repositorys und das Forken eines Repositorys immer.
Issues, Pull Requests, Reviews, Discussions, Antworten und Commits zählen nur,
wenn die jeweiligen GitHub-Kriterien erfüllt sind.

Bei Commits gehören dazu insbesondere:

- Die im Commit verwendete E-Mail-Adresse ist dem GitHub-Konto zugeordnet.
- Das Repository ist kein Fork.
- Der Commit liegt im Standardbranch oder im `gh-pages`-Branch.
- Zusätzlich besteht die von GitHub verlangte Verbindung zum Repository,
  etwa durch Mitarbeit, Organisationsmitgliedschaft, eigenen Fork, Issue oder
  Pull Request.

Darum kann eine lokal vorhandene Arbeit zunächst ohne grünes Feld bleiben.
GitHub nennt außerdem eine mögliche Verzögerung von bis zu 24 Stunden. Die
offizielle Fehlersuche nennt als häufige Ursachen eine nicht zugeordnete
Commit-E-Mail, einen anderen Branch oder einen Fork:
[Troubleshooting missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions).

Private Contributions können als Anzahl sichtbar gemacht werden, während
Repository und Einzelheiten für Außenstehende verborgen bleiben. Ein
öffentlich sichtbarer Tageswert muss daher nicht vollständig erklären, aus
welchem Projekt jede gezählte Aktivität stammt.

## Was der Graph nicht misst

Der Graph misst nach GitHubs Zählregeln **Aktivität**. Aus Anzahl, Farbe oder
Lücken folgen allein keine Aussagen über:

| Nicht gemessene Frage | Warum der Graph sie nicht beantwortet |
| --- | --- |
| Qualität | Eine große und eine kleine Änderung können jeweils als Aktivität zählen. |
| Schwierigkeit | GitHub bewertet im Kalender weder Forschungsaufwand noch technische Tiefe. |
| Urheberschaft eines Inhalts | Die Kontozurechnung einer Aktivität ersetzt keine Prüfung des konkreten Werks und seiner Entstehung. |
| erster Ideenzeitpunkt | Lokale, private oder mündliche Vorstufen können im Graph fehlen. |
| rechtliche Priorität | Eine Tagesfarbe bindet keinen vollständigen Inhalt, keine Uhrzeit und keinen Schutzrechtstatbestand. |
| Kopieren oder Verletzung | Ähnlichkeit und spätere Aktivität belegen keinen Zugang, keine Übernahme und keinen verletzenden Teil. |
| Patentfähigkeit | Contributions prüfen weder technische Lehre noch Neuheit, erfinderische Tätigkeit oder gewerbliche Anwendbarkeit. |
| Beteiligung oder Zahlung | Aktivität erzeugt ohne weitere Anspruchsgrundlage keinen Anteil und keine Vergütung. |

Ein stark gefüllter Kalender kann hohe Aktivität dokumentieren. Er ist weder
Rangliste noch Qualitätsgutachten, Eigentumsregister, Patentregister oder
Rechnung.

## Die stärkere Provenienzleiter

Für einen reproduzierbaren Veröffentlichungsstand ist der Contribution-Graph
nur ein Einstieg. Belastbarer ist eine Kette aus konkreten Objekten:

```text
COMMIT -> TREE -> ANNOTATED_TAG -> RELEASE -> SOURCE_ASSET_SHA256
```

| Anker | Was er bindet | Was offen bleibt |
| --- | --- | --- |
| Commit-ID | konkrete Änderung, Elternstand, Autor-/Commit-Metadaten und referenzierten Tree | reale Identität, vollständige Vorarbeit und rechtliche Bewertung |
| Tree-ID | Verzeichnis- und Dateiobjekte des gebundenen Repository-Zustands | Bedeutung, Qualität und Herkunft außerhalb dieses Trees |
| annotiertes Tag | eigenes Git-Tagobjekt mit Zielobjekt, Name, Tagger, Zeit und Nachricht | ohne geprüfte Signatur keine gesicherte reale Identität des Taggers |
| GitHub-Release | öffentliche Präsentation einer benannten Tag-Fassung mit Beschreibung und Assets | der Release-Eintrag bleibt Plattformmetadatum und kann bearbeitet werden |
| SHA-256 des Source-Assets | exakte Bytes des heruntergeladenen Quellpakets | Urheberschaft, Vollständigkeit der Weltgeschichte und Rechtsfolge |

Die stärkste öffentliche Fassung nennt deshalb mindestens:

1. vollständige Commit-ID und Tree-ID;
2. annotiertes Tag und das Objekt, auf das es zeigt;
3. Release-URL und Veröffentlichungszeitpunkt;
4. Dateiname, Bytelänge und SHA-256 jedes Source-Assets;
5. Lizenzstand und einen Inhaltspfad zur maßgeblichen Aussage;
6. bekannte Lücken, frühere Stände und Reopen-Trigger.

Ein DOI oder anderes dauerhaftes Archiv kann die Zitierbarkeit zusätzlich
verbessern. GitHub empfiehlt für Forschungsinhalte persistente Kennungen und
weist darauf hin, dass ein Repository eine Lizenz enthalten sollte, damit
Lesende seine Wiederverwendung einordnen können:
[Referencing and citing content](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content).

## Öffentlich ist nicht automatisch Open Source

Ein öffentliches Repository ist öffentlich lesbar und innerhalb der
GitHub-Funktionen forkbar. Weitergehende Rechte zum Nutzen, Ändern und
Verteilen ergeben sich aus der anwendbaren Lizenz. GitHub erklärt ausdrücklich,
dass ohne Lizenz grundsätzlich das normale Urheberrecht gilt, während eine
Open-Source-Lizenz die zusätzlichen Nutzungsrechte festlegt:
[Licensing a repository](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

Darum werden drei Fragen getrennt geführt:

```text
PUBLIC_VISIBILITY != OPEN_SOURCE_LICENSE != AUTHORSHIP_OR_PRIORITY
```

Auch eine Lizenz beantwortet nicht automatisch, wer eine Idee zuerst hatte.
Sie bestimmt den erlaubten Umgang mit dem Material, auf das sie anwendbar ist.
Bei gemischten Repositorys muss die Lizenzdatei oder Dateizuordnung deshalb
erkennen lassen, welche Regel für welchen Pfad und welche Fassung gilt.

## Veröffentlichung kann selbst Stand der Technik werden

Ein früher öffentlicher GitHub-Stand kann als datierte Vorveröffentlichung bei
einer späteren Herkunftsprüfung nützlich sein. Er kann bei einer technischen
Lehre zugleich die eigene Patentstrategie berühren. Nach dem
[Deutschen Patent- und Markenamt](https://www.dpma.de/patente/patentschutz/schutzvoraussetzungen/)
umfasst der Stand der Technik grundsätzlich alle Kenntnisse, die vor der
Anmeldung weltweit öffentlich zugänglich waren. Das kann auch die eigene
Veröffentlichung betreffen.

Vor der öffentlichen technischen Offenlegung sollten daher getrennt geprüft
werden:

- Soll der Stand nur zitiert und offen weiterentwickelt werden?
- Enthält er eine ausführbare technische Lehre, für die ein Schutzrecht
  erwogen wird?
- Welche Teile müssen für Provenienz sichtbar sein?
- Welche Teile bleiben bis zu einer Schutzrechts- oder Lizenzentscheidung
  nichtöffentlich?

`FRÜHE_VERÖFFENTLICHUNG` kann Provenienz stärken und zugleich patentrechtliche
Neuheit beeinflussen. Der Contribution-Graph entscheidet keine dieser beiden
Fragen.

## Ein sauberer öffentlicher Prüfstand

Für neue GitHub-Fassungen genügt ein kleiner, reproduzierbarer Receipt:

```text
REPOSITORY:        <owner>/<repo>
COMMIT:            <full commit object id>
TREE:              <full tree object id>
ANNOTATED_TAG:     <tag name + tag object id>
RELEASE:           <public release URL + timestamp>
SOURCE_ASSET:      <filename + bytes>
SOURCE_SHA256:     <64 hex characters>
LICENSE_SCOPE:     <license + exact paths/version>
CLAIM_SCOPE:       <what this snapshot establishes>
OPEN_EDGES:        <what remains unknown>
```

Der Receipt macht den veröffentlichten Stand wiederauffindbar. Er erhebt den
Graphen nicht zum Beweis für Aussagen, die seine Zählregeln nicht prüfen.

## Öffentliche Claim-Grenze

```text
OBSERVED:
GitHub stellt einen kalenderartigen Aktivitätsgraphen bereit und zählt
qualifizierende Ereignisse nach plattformeigenen Kriterien pro Tag.

STRONGLY_SUPPORTED:
Leer bedeutet im angezeigten Kalender null gezählte Contributions; grün
bedeutet mindestens eine. Mehrere Ereignisse desselben Tages werden in einem
Tagesfeld zusammengeführt und über Anzahl beziehungsweise relative Farbstufe
dargestellt.

UNKNOWN:
Nicht veröffentlichte Vorarbeit, vollständige Entstehungskette, Motivation,
Qualität, technischer Wert und jede außerhalb der GitHub-Zählung liegende
Aktivität.

NOT_PROVEN:
Urheberschaft, Ideenpriorität, fremder Zugriff, Kopieren, Rechtsverletzung,
Patentfähigkeit, Beteiligungsanspruch oder Zahlungsanspruch.

PUBLIC_CLAIM_CEILING:
SOURCE_BOUND_ACTIVITY_AND_PROVENANCE_GUIDANCE; NO_AUTOMATIC_QUALITY, AUTHORSHIP, PRIORITY, COPYING, INFRINGEMENT, PATENT, PARTICIPATION, OR_PAYMENT_CLAIM
```

## Datenschutz-Receipt

Diese Fassung enthält keinen Profil-Screenshot, keinen privaten Pfad, keine
E-Mail-Adresse, keinen Klarnamen, keine Rohkommunikation und keine verborgenen
Repository-Daten. Sie erklärt nur die GitHub-Zählung und eine öffentliche,
reproduzierbare Provenienzmethode.
