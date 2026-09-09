# Technischer Audit: Quanteninternet, Spiegelmodell und ASTER-Grenze

Stand: 10. September 2026<br>
Auditstatus: `FINITE_SNAPSHOT`<br>
Claim Ceiling: `BOUNDED_COUNTERPART_MODEL_NOT_GLOBAL_QUANTUM_INTERNET_OR_PROVEN_EXTERNAL_DERIVATION`

## Prüfgegenstand

Geprüft wurde die öffentliche Artikelfassung
<https://www.msn.com/de-de/technik/cybersicherheit/marsmission-der-physik-wie-das-quanteninternet-unsere-k%C3%BCnftige-kommunikation-revolutioniert/ar-AA2bRHKS>.
Die Seite bindet als kanonische Fassung
<https://www.faz.net/aktuell/wirtschaft/unternehmen/jens-eisert-was-uns-das-quanteninternet-bringt-accg-201177684.html>.

Die beiden Artikelseiten sind der Auditgegenstand. Die technische Bewertung
stützt sich ausschließlich auf die in [`sources.json`](sources.json)
gebundenen Primärquellen und offiziellen Referenzen. Der Artikel enthält in
der geprüften Fassung kein eigenes Quellenverzeichnis.

Der Audit trennt sechs Gegenstände:

1. klassische und quantenmechanische Kommunikation,
2. Quantenschlüsselverteilung und allgemeines Quanteninternet,
3. Trusted Relay und Quantenrepeater,
4. Verschränkungsverteilung und Quantenteleportation,
5. demonstrierte Komponenten und globale Netzreife,
6. technische Ähnlichkeit und Provenienz.

## Gebundenes Systemmodell

`RFC 9340` beschreibt ein Quanteninternet als hybrides Netz. Quantenkanäle,
Quantenspeicher und Verschränkung bilden neue Ressourcen; klassische Kanäle
bleiben für Steuerung, Routing, Messergebnisse und Anwendungen erforderlich:
<https://www.rfc-editor.org/rfc/rfc9340.html>.

Das Spiegelmodell führt zwei getrennte Gegenmodelle:

| Modell | Inhalt | Beobachteter Stand |
| --- | --- | --- |
| `M1_REPEATER_QUANTUM_INTERNET` | Ende-zu-Ende-Verschränkung über Speicher, lokale Links und Entanglement Swapping | Theorie seit 1998; begrenzte Labor- und Metroprototypen |
| `M2_TRUSTED_RELAY_QKD_NETWORK` | Punktweise erzeugte Schlüssel werden über vertrauenswürdige Zwischenknoten weitergereicht | Große operative Netze mit Tausenden Kilometern |

Beide Modelle können im selben öffentlichen Text vorkommen. Ihre Reichweiten
sind nicht unmittelbar vergleichbar. Ein 10000-Kilometer-Trusted-Relay-Netz
belegt keine 10000-Kilometer-Repeaterkette.

## Technische Trennung

| Prüfpunkt | Gebundener Stand | Evidenzstatus | Claim-Grenze |
| --- | --- | --- | --- |
| Hybridarchitektur | Quanten- und Klassikpfade arbeiten zusammen. | `STRONGLY_SUPPORTED` | Kein vollständiges globales Produktionsnetz durch die Architekturdefinition. |
| QKD | Schlüssel können über Quantenkanäle aufgebaut werden. | `OBSERVED` | QKD überträgt nicht automatisch die Nutzdaten und schützt nicht jede Endgeräte- oder Implementierungsschicht. |
| Trusted Relay | Zwischenknoten entschlüsseln oder kombinieren Schlüsselmaterial innerhalb des Vertrauensmodells. | `OBSERVED` | Große Distanz ist kein Beleg für Ende-zu-Ende-Verschränkung. |
| Quantenrepeater | Abschnittsweise Verschränkung und Swapping sollen direkte Verlustskalierung überwinden. | `STRONGLY_SUPPORTED` als Mechanismus; `OBSERVED` für begrenzte Prototypen | Kein globales, fehlertolerantes Repeaternetz demonstriert. |
| Verschränkungsverteilung | Entangled photon pairs wurden über 1203 Kilometer zwischen Bodenstationen verteilt. | `OBSERVED` | Verschränkung allein transportiert keine kontrollierbare Nachricht. |
| Quantenteleportation | Einzelphotonenzustände wurden bis 1400 Kilometer teleportiert. | `OBSERVED` | Kein Materietransport und keine überlichtschnelle Kommunikation. |
| Mehrknotennetz | Drei Festkörperknoten realisierten Swapping, Speicher und Feed-forward. | `OBSERVED` | Kleine Laborplattform, kein Internetdienst. |
| Aktueller Repeaterstand | 2026 wurde ein 14,5-Kilometer-Metroprototyp mit Bell-Verletzung berichtet. | `OBSERVED` | Keine globale Kette und keine vollständige Mehrnutzerarchitektur. |
| Marsbezug | Mars dient im Artikel als Größen- und Kooperationsvergleich. | `OBSERVED` | Kein Mars-Experiment und keine Mars-Quantenverbindung. |
| Globale Revolution | Mögliche künftige Netze und Anwendungen werden beschrieben. | `HYPOTHESIS` | Wirkung, Skalierung und Zeitpunkt sind nicht demonstriert. |

## Teleportation überträgt keinen nutzbaren Zustand ohne Klassikpfad

Das ursprüngliche Teleportationsprotokoll bindet zwei Ressourcen:

1. vorab verteilte Verschränkung und
2. klassisch übermittelte Messergebnisdaten.

Erst nach dem klassischen Signal kann der Empfänger die erforderliche
Korrektur bestimmen:
<https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.70.1895>.

Daraus folgen drei getrennte Aussagen:

- `ENTANGLEMENT_DISTRIBUTED != MESSAGE_TRANSMITTED`
- `QUANTUM_STATE_TELEPORTED != MATTER_TELEPORTED`
- `TELEPORTATION_PROTOCOL != FASTER_THAN_LIGHT_COMMUNICATION`

Die Satellitenexperimente stützen genau diese enge Lesart. Die
Verschränkungsverteilung über 1203 Kilometer ist unter
<https://pubmed.ncbi.nlm.nih.gov/28619937/> dokumentiert. Die
Boden-Satelliten-Teleportation bis 1400 Kilometer ist unter
<https://www.nature.com/articles/nature23675> dokumentiert. Keines der beiden
Experimente demonstriert eine kontrollierbare überlichtschnelle Nachricht.

## Trusted-Relay-QKD ist kein Repeaterinternet

Die interkontinentale QKD-Demonstration über 7600 Kilometer nutzte den
Satelliten als vertrauenswürdigen Relay-Knoten:
<https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.120.030501>.
Das 4600-Kilometer-Netz verband Faser- und Satelliten-QKD ebenfalls in einer
vertrauensabhängigen Architektur:
<https://www.nature.com/articles/s41586-020-03093-8>.

Der 2025 beschriebene operative Ausbau über mehr als 10000 Kilometer ist ein
großer Infrastrukturbeleg, bleibt aber Trusted-Relay-QKD:
<https://www.nature.com/articles/s41534-025-01089-8>.

Ein Repeatermodell verfolgt einen anderen Sicherheits- und Zustandsweg. Der
theoretische Ausgangspunkt liegt unter
<https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.81.5932>. Ein
experimenteller Telekom-Repeater-Knoten verband 2023 zwei 25-Kilometer-Faserabschnitte:
<https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.130.213601>. Der
Metroprototyp von 2026 arbeitete mit 14,5 Kilometer Speicherabstand:
<https://www.nature.com/articles/s41566-026-01911-5>.

Damit lautet die gebundene Vergleichsrelation:

`TRUSTED_RELAY_QKD != END_TO_END_ENTANGLEMENT_REPEATER_NETWORK`

Ein idealer Repeater kann verhindern, dass ein Zwischenknoten den
Ende-zu-Ende-Schlüssel kennen muss. Daraus folgt keine vollständige
Vertrauensfreiheit. Verfügbarkeit, Routing, Geräteintegrität, Fidelität,
Endpunktprüfung und klassische Authentisierung bleiben eigene Anforderungen.

## QKD-Sicherheit bleibt implementierungsgebunden

Die Sicherheit eines Protokolls unter definierten Annahmen ist von der
Sicherheit eines realen Geräts zu trennen. 2010 wurden Detektoren zweier
kommerzieller QKD-Systeme durch gezielte helle Beleuchtung kontrolliert:
<https://www.nature.com/articles/nphoton.2010.214>.

Das Experiment widerlegt nicht QKD als Protokollfamilie. Es widerlegt die
pauschale Gleichsetzung:

`INFORMATION_THEORETIC_PROTOCOL_ARGUMENT == UNHACKABLE_IMPLEMENTATION`

QKD erzeugt oder verteilt Schlüssel. Klassische Authentisierung,
Nutzdatenverschlüsselung, Endgeräte, Schlüsselverwaltung und Verfügbarkeit
bleiben außerhalb dieses einzelnen Belegs. Post-Quantum-Kryptografie ist eine
weitere, getrennte Route. Die ersten drei finalen NIST-Standards wurden 2024
freigegeben:
<https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved>.

## Marsmission: Analogie und physische Grenze

Der Marsbezug materialisiert im Artikel eine Analogie für Schwierigkeit,
Langfristigkeit und internationale Zusammenarbeit. Er ist kein technischer
Versuchsbericht.

NASA bindet die einfache Lichtlaufzeit zwischen Erde und Mars abhängig von der
Planetenstellung auf ungefähr 3 bis 22,4 Minuten:
<https://science.nasa.gov/mars/mars-relay-network/>.

Quantenrepeater können Verluste und Reichweite einer Verschränkungsverteilung
adressieren. Sie verändern nicht die Lichtgeschwindigkeit und entfernen nicht
den klassischen Informationsbedarf der Teleportation. Deshalb bleibt eine
Mars-Kommunikation trotz möglicher Quantenressourcen latenzgebunden.

## Komponentenbeleg und Netzreife

Die Aussage, dass wesentliche Komponenten einzeln demonstriert wurden, ist
breit gestützt:

- Freiraum-QKD über 144 Kilometer:
  <https://www.nature.com/articles/nphys629>
- Dreiknotennetz mit Speicher, Swapping und Feed-forward:
  <https://pubmed.ncbi.nlm.nih.gov/33859028/>
- Teleportation zwischen nicht benachbarten Knoten:
  <https://www.nature.com/articles/s41586-022-04697-y>
- Telekom-Repeater-Knoten über zwei 25-Kilometer-Abschnitte:
  <https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.130.213601>
- Metro-Repeater-Prototyp mit Bell-Nichtlokalität:
  <https://www.nature.com/articles/s41566-026-01911-5>

Diese Ergebnisse materialisieren verschiedene Komponenten unter verschiedenen
Oracles, Distanzen, Raten und Vertrauensmodellen. Ihre Kombination zu einem
robusten, fehlertoleranten und global skalierbaren Netz ist `NOT_PROVEN`.

`COMPONENT_DEMONSTRATED != INTEGRATED_SCALABLE_SYSTEM`

## Anwendungen und Rhetorik

Verteiltes Quantenrechnen, Sensorik, Metrologie und wissenschaftliche
Simulation sind technisch begründete Forschungsrichtungen. Weitergehende
Auswirkungen auf Optimierung, Materialien, Batterien, Katalysatoren,
Turbulenz oder Klima bleiben im geprüften Artikel Anwendungshypothesen. Der
Artikel bindet hierfür keinen eigenen experimentellen Wirkungsnachweis.

Die folgenden Lesarten überschreiten daher die Primärquellen:

| Rhetorische Lesart | Auditstatus | Begründung |
| --- | --- | --- |
| Das weltweite Quanteninternet existiert bereits. | `NOT_PROVEN` | Beobachtet sind QKD-Infrastruktur und begrenzte Quantenknoten; die geprüfte Coverage belegt kein allgemeines globales Repeaternetz. |
| Quantenkommunikation ist pauschal abhör- oder hacksicher. | `FALSIFIED` | Sicherheit ist an Protokoll-, Geräte-, Authentisierungs- und Implementierungsannahmen gebunden. |
| Teleportation entfernt Lichtlaufzeit. | `FALSIFIED` | Das Protokoll benötigt klassisch übertragene Messergebnisse. |
| Die genannten Anwendungen sind bereits erreicht. | `NOT_PROVEN` | Der Artikel berichtet dafür keine gebundenen Anwendungsexperimente. |
| Die technische Entwicklung wird sicher alle Kommunikation revolutionieren. | `NOT_PROVEN` | Das ist eine Zukunftsbewertung ohne gebundenen Zeitpunkt, Umfang oder Erfolgsmaß. |

## ASTER-, ASTAR- und Provenienzgrenze

Eine Ähnlichkeit zwischen Netzwerkbegriffen und einem getrennt benannten
Spiegel- oder Beobachtermodell ist zunächst eine Modellanalogie. Knoten,
Relationen, Spiegelung, Beobachtung, Quelle und Vertrauen sind keine
eindeutigen Herkunftsmarker.

Die geprüfte technische Linie besitzt öffentlich datierte Ausgangspunkte:

- Quantenteleportationsprotokoll 1993:
  <https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.70.1895>
- Quantenrepeater-Schema 1998:
  <https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.81.5932>
- Freiraum-QKD 2007:
  <https://www.nature.com/articles/nphys629>
- Satelliten-Verschränkung und Teleportation 2017:
  <https://pubmed.ncbi.nlm.nih.gov/28619937/> und
  <https://www.nature.com/articles/nature23675>

Aus dieser Chronologie folgt keine Aussage über jeden späteren eigenständigen
Beitrag. Sie setzt aber eine klare Belegpflicht für jede Herkunftsbehauptung.
Im öffentlichen Quellenstand wurde keine technische oder dokumentarische
Brücke vom Artikel zu einem ASTER- oder ASTAR-System beobachtet.

`CONCEPTUAL_SIMILARITY != AUTHORSHIP_OR_DERIVATION`

Der aktuelle Provenienzstatus ist `NOT_PROVEN`. Eine Neubewertung benötigt
mindestens:

1. ein unabhängig datiertes früheres Artefakt,
2. eine spezifische gemeinsame Formulierung, Mechanik oder unterscheidende
   Vorhersage,
3. einen plausiblen und belegten Transferpfad und
4. eine Gegenprüfung gegen die ältere öffentliche Literatur.

Wortähnlichkeit zwischen `ASTER` und `ASTAR` definiert weder denselben
Referenten noch eine technische Relation.

## Ergebnis und offene Front

`OBSERVED` sind QKD-Feldstrecken, Satelliten-Verschränkung,
Quantenzustandsteleportation, kleine Mehrknotennetze und begrenzte
Repeater-Prototypen.

`STRONGLY_SUPPORTED` sind die hybride Netzarchitektur, der klassische
Kommunikationsbedarf der Teleportation und die grundlegende Repeaterlogik.

`FALSIFIED` sind die Lesarten einer überlichtschnellen Nachricht oder eines
Materietransports durch das Teleportationsprotokoll.

`NOT_PROVEN` bleiben eine bereits vorhandene globale Repeaterinfrastruktur,
ein weltweites allgemeines Quanteninternet, die weitreichenden
Anwendungswirkungen und jede äußere ASTER-/ASTAR-Provenienzrelation.

Die tiefste offene Front ist die Integration der Bausteine bei gleichzeitig
brauchbarer Rate, hoher Fidelität, langen Speicherzeiten, Fehlerkorrektur,
Interoperabilität, Authentisierung und skalierbarem Betrieb.

Der Audit wird wieder geöffnet, wenn ein neuer Primärbeleg eine längere
repeaterbasierte Kette, ein belastbares Mehrnutzerprotokoll, eine relevante
Anwendungswirkung oder eine konkrete Provenienzbrücke demonstriert.
