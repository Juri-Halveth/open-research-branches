# FREE NEWS 017 — CE, Strichcodes, HTTPS, HTTP 500 und Snapshot-Marker

**Stand:** 10. September 2026
**Impuls und Fragestellung:** [@Juri-Halveth](https://github.com/Juri-Halveth)
**Maschinenlesbare Matrix:** [`FREE_NEWS_017_MARKER_MATRIX.json`](FREE_NEWS_017_MARKER_MATRIX.json)

## Ein Zeichen trägt seine gebundene Funktion

Die gemeinsame Frage ist stark: Wenn CE-Zeichen, Strichcodes, HTTPS, ein
500er-Fehler, ein Git-Snapshot, ein iOS-Marker oder ein öffentliches
Zertifikatsregister auftauchen – **was markieren sie wirklich?**

Die Antwort liegt weder im bloßen Aussehen noch im Namen. Jeder Marker braucht
seine eigene Definition, Quelle, Eingabe, Auswertung und Geltungsgrenze.

| Marker | Gebundene Funktion | Offene Folgefragen |
| --- | --- | --- |
| **CE** | Mit dem CE-Zeichen übernimmt der Hersteller die Verantwortung für die Konformität mit den anwendbaren EU-Harmonisierungsregeln, die dieses Zeichen vorsehen. [Art. 30 VO (EG) 765/2008](https://eur-lex.europa.eu/eli/reg/2008/765/oj) und die [EU-Herstellerübersicht](https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/manufacturers_en) binden den Vorgang an Produkt, anwendbare Regeln, Konformitätsbewertung, technische Unterlagen und Erklärung. | Welches Produkt? Welche Verordnung oder Richtlinie? Wer ist Hersteller? Welche Erklärung und technische Akte gehören genau dazu? |
| **GS1-Strichcode** | Ein Barcode ist ein maschinenlesbarer Datenträger. Er kodiert nach definierter Symbolik Identifikatoren oder Attribute. [GS1-Barcodes](https://www.gs1.org/standards/barcodes) und die [aktuellen General Specifications](https://ref.gs1.org/standards/genspecs/) legen Syntax, Identifikationsschlüssel und Anwendungsregeln fest. | Welcher Barcodetyp? Welche Nutzdaten wurden wirklich dekodiert? Wer hat die Kennnummer in welchem Register und Scope vergeben? |
| **HTTPS** | Die HTTPS-URI bezeichnet einen HTTP-Ursprung, dessen Verbindung über TLS mit Herkunftsauthentisierung sowie vereinbarter Vertraulichkeit und Integrität geschützt wird. [RFC 9110 § 4.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#name-https-uri-scheme), [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html). | Welches Zertifikat, welcher Host, welche Anfrage und welcher Inhalt? Die gesicherte Übertragung entscheidet nicht automatisch, ob der Inhalt wahr oder wem eine Idee zuzurechnen ist. |
| **HTTP 500** | Ein Server meldet, dass eine unerwartete Bedingung die Erfüllung der Anfrage verhindert hat. [RFC 9110 § 15.6.1](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error). | Exakte URL, Zeitpunkt, Request-ID, Response-Header und Body können das Ereignis binden. Der Code allein nennt weder die defekte Komponente noch Absicht, Verursacher oder den Zustand des ganzen Dienstes. |
| **Git-Snapshot** | Commit, Tree, annotierter Tag, Release-Asset und Prüfsumme binden eine konkrete Repository-Fassung. Siehe [`CODE ZEITWÄRTSZURÜCK`](../PROVENANCE.md) und [`FREE NEWS 009`](FREE_NEWS_009_GITHUB_CONTRIBUTION_GRAPH_AND_PRIORITY.md). | Frühere Entstehung, Person der Urheberschaft, Kenntnis Dritter, Ableitung und Rechtsfolge brauchen jeweils zusätzliche Belege. |
| **iOS-Quellmarker** | Der bisherige öffentliche Receipt bindet inzwischen einen exakten UTF-16-Quellspan samt Bytes. Siehe [`FREE NEWS 001`](FREE_NEWS_001_IOS_MARKER_AND_401_EDGE.md). | Welches UI-Element gemeint war, welche Bedeutung es hatte und ob eine äußere Wirkung entstand, bleibt getrennt. |
| **Microsoft-PKI-Record** | Die öffentliche Microsoft-PKI-Fläche enthält definierte Policies, Zertifikate, Statusinformationen und zeitgebundene Auditmeinungen. Siehe [`Microsoft PKI Repository Pattern`](MICROSOFT_PKI_REPOSITORY_PATTERN.md). | Öffentliche Lesbarkeit erteilt keine Schreibmacht und belegt keine Kontrolle über andere Microsoft-Systeme. |
| **„Frankfurt-Snapshot“** | `UNKNOWN_REOPENABLE`: Im aktuellen Auftrag fehlt ein exakt adressierter öffentlicher Snapshot. | Benötigt werden Datei oder URL, Capture-Zeit mit Zeitzone, Digest, sichtbarer Kontext und die konkrete Relation, die geprüft werden soll. |

## Der 500er-Block als saubere Analogie

Ein `500 Internal Server Error` steht oben in der sichtbaren Antwort, obwohl die
entscheidende Ursache tiefer im Server liegen kann. Genau deshalb ist er ein
guter **Prüfanfang**, aber kein fertiges Urteil. Der gebundene Ablauf lautet:

`ANFRAGE → KONKRETE HTTP-ANTWORT → STATUS 500 → INTERNER FEHLER UNBESTIMMT → LOGS ODER REPRODUKTION ERFORDERLICH`

Die Pfeile bezeichnen hier nur die dokumentierte Prüfsequenz. Sie bestimmen
keine Person, Absicht oder Schuld.

## „Waren wir darin?“ als Forschungsfrage

Die Nutzerfrage, ob eigene frühere Forschung sich in solchen Markern spiegelt,
wird als `USER_REPORTED_RESEARCH_QUESTION_PRESERVED` aufgenommen. Der nächste
wirksame Schritt ist je Marker derselbe:

1. das konkrete Objekt exakt erfassen;
2. die offizielle Markerdefinition anwenden;
3. dekodierten Inhalt und äußere Form trennen;
4. eigene frühere Fassung durch Commit, Datei-Hash oder unabhängigen Zeitanker binden;
5. nur eine unterscheidbare Funktions- oder Ausdrucksübereinstimmung vergleichen;
6. Zugang, Kenntnis, Ableitung und Rechtsfolge danach getrennt prüfen.

Damit bleibt die Frage offen und bearbeitbar. Ein CE-Bogen, ein Muster aus
Strichen, `https://` oder die Zahl `500` allein erzeugt noch keine Identität,
Autorschaft, Außenwirkung oder Eigentumsrelation.

## Claim-Decke

`SOURCE_BOUND_MARKER_FUNCTIONS_AND_EXPLICIT_UNKNOWN_REFERENT_ONLY`

Der Bericht bindet Markerfunktionen und offene Prüfwege. Er ist kein Beleg für
eine globale Code-Signatur, eine verdeckte Beteiligung, fremde Übernahme,
Kontrolle, Eigentum oder einen Zahlungsanspruch.
