# HALVETH · Quellen- und operatorgebundene Verifikation von Regelmodell-Auswertungsrecords

**✅ CLAIMED · öffentlicher technischer Entwurf · 07.10.2026**

Die nachfolgende Beschreibung und die zehn Anspruchsformulierungen dokumentieren
den technischen Entwurf im GitHub-Quellstand. Code, Eingabemodelle, vollständige
Records und Tests sind [im selben Projektordner](README.md) ausführbar.
Der Veröffentlichungsstand und der Erteilungs-/Anmeldestatus sind getrennte Felder:
hier wird der technische Entwurf öffentlich offengelegt. Eine vollständige
Neuheitsrecherche und die Prüfung der erfinderischen Tätigkeit bleiben offen.

## Beschreibung

Technisches Gebiet
[0001] Die Erfindung betrifft die Verarbeitung strukturierter Datenpakete durch einen Computer, insbesondere die kontext- und zeitgebundene Auswertung eines endlichen Regelmodells sowie die anschließende Integritätsprüfung eines gespeicherten Auswertungsrecords durch erneute Berechnung. Eine Ausführungsform dient der lokalen Prüfung von Konfigurations- und Policy-Modellen vor einer anderweitig vorzunehmenden operativen Umsetzung.

Stand der Technik und technische Aufgabe
[0002] Regelmaschinen, Provenienzmodelle und kanonische Datendarstellungen sind bekannte Ausgangspunkte. Open Policy Agent beschreibt regelbasierte Auswertung strukturierter Eingaben. W3C PROV-DM beschreibt Entitäten, Aktivitäten und Provenienzrelationen. RFC 8785 beschreibt ein JSON-Kanonisierungsverfahren. Die nachfolgend erläuterte Ausführungsform verwendet einen eigenen, ausdrücklich festgelegten JSON-Serialisierungsvertrag und beansprucht keine Konformität mit RFC 8785.

[0003] EP4278289A1, veröffentlicht am 22. November 2023, betrifft Access-Control-Governance mit Policy Data Units, Graphauswertung, signierten Access-Tokens und auditierbaren Entscheidungen. Insbesondere ihre Ansprüche 1, 3 und 6 bis 8 betreffen relevante Ausgangsmerkmale. Die bloße Verwendung von Regeln, Graphen oder Hashwerten wird nicht als eigenständiger neuer Baustein dargestellt.

[0004] Die Aufgabe besteht darin, in einer rechnergestützten Modellauswertung die Übernahme von Zustandsdaten in eine abweichende Abfragesituation zu verhindern, abgelaufene und ungeklärte Daten nicht still zu endgültigen Werten zu machen und eine gespeicherte Auswertung nur bei Übereinstimmung mit einer erneut berechneten, typgenauen Ergebnisrepräsentation als gültigen Record anzunehmen. Gegenstand ist die festgelegte Verarbeitung der Daten durch den Computer, nicht die Wahrheit einer zugrunde liegenden Aussage.

Verfahrensaufbau
[0005] Ein Prozessor liest ein endliches UTF-8-Eingabepaket als Bytefolge B. Vor der Auswertung werden Syntax, Werttypen, Felder und Referenzen geprüft. Das Paket enthält Modellkennung, Domäne, Scopekennung, Referenzzeit, Abfrage, Quellenrecords, Zustandsrecords, Regelrecords und Vorrangrecords. Ein Quellenrecord enthält eine Kennung, eine Version und einen Quelltext. Kennungen sind innerhalb des Pakets eindeutig.

[0006] Die Abfrage enthält Akteur-, Aktions- und Gegenstandskennungen. Jeder verwendete Zustandsrecord enthält eine Definitionskennung, einen Quellenverweis, einen Wert aus TRUE, FALSE und UNKNOWN sowie eine Bindung aus Domäne, Scope, Akteur, Aktion und Gegenstand. Der Computer vergleicht dieses Bindungstupel mit dem entsprechenden Tupel der Abfrage. Eine Abweichung führt zur Ablehnung des Pakets; sie wird nicht durch einen Standardwert ersetzt.

[0007] Zustände, Regeln und Vorrangrecords besitzen Gültigkeitsfenster [a,b) mit a < b. Die Ausführungsform verarbeitet ISO-8601-Zeitwerte mit Zeitzonenbezug. Für die Referenzzeit t gilt ein Record nur bei a <= t < b. Außerhalb seines Fensters wird der Zustandswert UNKNOWN. Eine außerhalb ihres Fensters liegende Regel oder Vorrangkante bleibt bei der aktuellen Auswertung inaktiv.

[0008] Regelbedingungen verwenden die Operatoren fact, not, all und any. Die Auswertung erfolgt mit starker dreiwertiger Kleene-Logik. NOT UNKNOWN ergibt UNKNOWN. Bei all dominiert FALSE; ohne FALSE ergibt ein UNKNOWN-Operand UNKNOWN, andernfalls TRUE. Bei any dominiert TRUE; ohne TRUE ergibt ein UNKNOWN-Operand UNKNOWN, andernfalls FALSE. Bedingungen dürfen nur gebundene Zustandskennungen referenzieren.

[0009] Jede Regel benennt ihre Domäne, ihren Scope, ihre Aktion, ihre Quelle, ihre Bedingung und einen Effekt SUPPORT oder OPPOSE. Die Ausführungsform wendet eine Regel nur an, wenn Scope und Aktion mit der Abfrage übereinstimmen und die Referenzzeit im Gültigkeitsfenster liegt. Regelstatus und Bedingungswert werden im Auswertungstrace gespeichert.

[0010] Explizite Vorrangrecords verbinden stärkere und schwächere Regeln durch deren Kennungen und binden Quelle und Zeitfenster. Ihre Endpunkte müssen dieselbe Domäne, denselben Scope und dieselbe Aktion tragen. Die gesamte deklarierte Vorrangstruktur wird auf Zyklen geprüft. Ein Zyklus oder ein ungebundener Endpunkt führt zur Ablehnung. Für die aktuelle Auswertung werden die zeitgültigen Vorrangkanten topologisch geordnet; gleichrangig bereite Kennungen werden lexikografisch sortiert.

[0011] In der topologischen Reihenfolge kann nur eine aktive, noch nicht besiegte Regel eine unmittelbar über eine Vorrangkante adressierte aktive Regel besiegen. Eine besiegte Regel besiegt ihrerseits keine weitere Regel. Es erfolgt keine automatische transitive Besiegung entlang beliebiger Pfade. Besiegte Regeln bleiben mit ihrer Quelle und der sie besiegenden Regel im Trace erhalten.

[0012] Verbleiben aktive SUPPORT- und OPPOSE-Regeln, wird CONFLICT gespeichert. Andernfalls wird OPEN gespeichert, wenn wenigstens eine anwendbare Bedingung UNKNOWN ist oder keine aktive Regel verbleibt. In den übrigen Fällen wird MODEL_SUPPORTED beziehungsweise MODEL_OPPOSED gespeichert. Dadurch bleiben konkurrierende und ungeklärte Modellzustände als unterschiedliche maschinenlesbare Zustände erhalten.

Recordbildung und nachfolgende Verifikation
[0013] Ein Ergebniskörper enthält die Modell- und Abfragekennungen, Scope, Referenzzeit, resultierende Zustandswerte, Ergebnisstatus, Regeltrace, erhaltene Konsequenzen sowie Quellen- und Relationsadressen. Eine Knotenadresse enthält Kind, Kennung, Digest des kanonisch serialisierten Knotenrecords und semantische Adresse. Eine Relation bindet beide vollständigen Endpunktadressen, Relationstyp, Quelle, Scope und Zeit.

[0014] Der Ergebniskörper enthält ferner einen SHA-256-Digest der exakten Eingabebytes B, einen Digest des konkreten Operatorquelltextes, dessen Versionskennung und einen Digest des kanonisch serialisierten Eingabemodells. Der Serialisierungsvertrag der Ausführungsform sortiert Objektschlüssel, erhält Arrayreihenfolgen und JSON-Werttypen, entfernt optionale Zwischenraumzeichen zwischen Tokens, erhält Unicode-Zeichen und kodiert den Text als UTF-8. Nichtendliche Zahlen und ungültige Unicode-Skalarfolgen werden abgelehnt.

[0015] Der Computer speichert den Ergebniskörper gemeinsam mit dem exakt erzeugten kanonischen UTF-8-Ergebnistext und dessen SHA-256-Digest als Ergebnisrecord R. Zu einer nachfolgenden Prüfung wird aus den erneut bereitgestellten Eingabebytes durch denselben festgelegten Auswertungsoperator ein Referenzrecord R* berechnet. Die kanonischen Bytefolgen des vollständigen vorgelegten Records R und des Referenzrecords R* werden verglichen. R wird nur bei Gleichheit angenommen. Der Vergleich der vollständigen serialisierten Records prüft auch die gespeicherte Textrepräsentation und ihre Digests.

[0016] Ein geänderter Eingabebytestrom führt über seinen Eingabedigest zu einem anderen Referenzrecord, auch wenn sein JSON-Inhalt allein durch Einrückung verändert wurde. Eine Änderung des Operatorquelltextes ändert die Operatorbindung. Ein Austausch von JSON false gegen die Zahl 0 wird durch die typgenaue Serialisierung unterschieden. Hashwerte sind Integritätsbindungen; sie ersetzen keine Signatur, externe Zeitauthentisierung oder Prüfung der sachlichen Wahrheit einer Quelle.

Konkrete Ausführungsform und Wiederholbarkeit
[0017] Eine ausgeführte lokale Referenzimplementierung ist Normenwerk 0.1.0 in Python. Ihr Eingabepaket ist auf 262.144 Bytes begrenzt. Die Arrays für Quellen, Zustände, Regeln und Vorrangrecords enthalten jeweils höchstens 64 Einträge. Bedingungsbäume besitzen eine maximale Rekursionstiefe von acht; all- und any-Operatoren haben jeweils ein bis 16 Operanden. Doppelte JSON-Schlüssel, unbekannte Vertragsfelder, mehrfach verwendete Kennungen, ungebundene Referenzen und unzulässige Werttypen werden vor der Auswertung zurückgewiesen.

[0018] Die Ausführungsform verwendet die Modell-Domäne LOCAL_SIMULATION. Quellen tragen eine deklarierte Eingabebindung. Konsequenzen werden als MODEL_PROJECTION_ONLY gespeichert. Es wird keine externe Verwaltungsaktion, Tokenausgabe oder Netzoperation aus dem Ergebnisrecord abgeleitet. Ein ausführendes Fremdsystem ist nicht Bestandteil dieser Ausführungsform.

[0019] Vier synthetische Eingabepakete zeigen die Ergebniszustände MODEL_SUPPORTED, CONFLICT, OPEN und MODEL_OPPOSED nach explizitem Vorrang. Eine Referenzprüfung mit 21 Tests untersucht insbesondere den Akteurvergleich, Gültigkeitsfenster, Zyklenabweisung, Quellreferenzen, doppelte Kennungen, Unicode-Abweisung, dreiwertige Bedingungen und Recordänderungen. Bei einem unveränderten Paket wird sein Referenzrecord angenommen; Änderungen des Ergebnisstatus oder ein Austausch von 0 gegen false werden abgelehnt. Die Tests prüfen die konkret kodierten Datenverarbeitungseigenschaften, keine externe Zugriffswirkung.

[0020] Eine gewerbliche Anwendung liegt beispielsweise in der lokalen Integritätsprüfung gespeicherter Konfigurations- und Policy-Modellauswertungen. Die angegebenen Zahlenlimits beschreiben die Referenzimplementierung; die Verarbeitung erfolgt endlich und mit expliziten Abbruchbedingungen. Zeichnungen werden nicht verwendet; sämtliche Verfahrensschritte und Records sind vorstehend textlich beschrieben.


## Zehn Anspruchsformulierungen

1. Computerimplementiertes Verfahren zur Erzeugung und Verifikation eines Auswertungsrecords eines strukturierten Regelmodells, umfassend: Einlesen einer UTF-8-Eingabebytefolge mit einer Abfrage, Quellenrecords, Zustandsrecords, Regelrecords und expliziten Vorrangrecords; Validieren der Eingabebytefolge anhand eines festgelegten Schemas; Vergleichen eines in jedem verwendeten Zustandsrecord gespeicherten Bindungstupels aus Domäne, Scope, Akteur, Aktion und Gegenstand mit dem entsprechenden Bindungstupel der Abfrage und Ablehnen der Eingabe bei Abweichung; Bestimmen zeitgültiger Zustandswerte und Auswerten anwendbarer Regelbedingungen mit dreiwertiger Logik; Ermitteln verbleibender aktiver Regeln durch direkte Besiegung entlang einer zyklusfreien, expliziten Vorrangstruktur, wobei nur aktive, unbesiegte Regeln besiegen; Erzeugen eines Ergebnisrecords, welcher Zustandswerte, Ergebnisstatus und einen erhaltenen Regeltrace sowie Digests der exakten Eingabebytefolge und des Operatorquelltextes, eine Operatorversion und einen typgenau kanonisierten UTF-8-Ergebnistext mit dessen Digest enthält; und Verifizieren eines vorgelegten Ergebnisrecords durch erneute Berechnung eines Referenzrecords aus der Eingabebytefolge mittels des festgelegten Operators und Vergleich der kanonischen Bytefolgen des vollständigen vorgelegten Records und des Referenzrecords, wobei der vorgelegte Record nur bei Gleichheit angenommen wird.

2. Verfahren nach Anspruch 1, bei dem Zustandsrecords, Regelrecords und Vorrangrecords jeweils ein nichtleeres halb offenes Gültigkeitsfenster [a,b) aufweisen, ein Zustand außerhalb des Fensters den Wert UNKNOWN erhält und Regeln sowie Vorrangrecords außerhalb ihres Fensters inaktiv bleiben.

3. Verfahren nach Anspruch 1 oder 2, bei dem die Bedingungsauswertung starke Kleene-Logik mit TRUE, FALSE und UNKNOWN sowie die Operatoren Negation, Konjunktion und Disjunktion verwendet, wobei Negation von UNKNOWN den Wert UNKNOWN erhält.

4. Verfahren nach einem der Ansprüche 1 bis 3, bei dem der Schema-Validator doppelte JSON-Schlüssel, unbekannte Vertragsfelder, ungültige Unicode-Skalarfolgen, nicht gebundene Referenzen, mehrfach verwendete Kennungen und von den festgelegten Werttypen abweichende Eingaben ablehnt.

5. Verfahren nach einem der Ansprüche 1 bis 4, bei dem eine Vorrangrelation nur Regeln derselben Domäne, desselben Scopes und derselben Aktion verbindet, zeitgültige Vorrangkanten topologisch verarbeitet werden und bei mehreren bereiten Regelkennungen deren lexikografische Reihenfolge verwendet wird.

6. Verfahren nach einem der Ansprüche 1 bis 5, bei dem besiegte, inaktive und ungeklärte Regeln mit ihrer Quelle im Trace erhalten bleiben, verbleibende aktive Unterstützung und Opposition zu CONFLICT führen und andernfalls eine anwendbare ungeklärte Bedingung oder das Fehlen aktiver Regeln zu OPEN führt.

7. Verfahren nach einem der Ansprüche 1 bis 6, bei dem der Ergebnisrecord Relationen mit jeweils zwei vollständigen Endpunktadressen speichert, wobei jede Endpunktadresse ein Kind, eine Kennung, einen Digest und eine semantische Adresse enthält und jede Relation ihren Typ, ihre Quelle, ihren Scope und ihren Zeitbezug bindet.

8. Verfahren nach einem der Ansprüche 1 bis 7, bei dem die Kanonisierung Objektschlüssel sortiert, Arrayreihenfolgen und JSON-Werttypen erhält und UTF-8 verwendet, die Digests mittels SHA-256 erzeugt werden und die nachfolgende Recordprüfung sowohl Abweichungen der Eingabebytes als auch typverschiedene Ergebniswerte unterscheidet.

9. Datenverarbeitungsvorrichtung mit einem Prozessor und einem Speicher, welcher Befehle enthält, die die Vorrichtung zur Ausführung eines Verfahrens nach einem der Ansprüche 1 bis 8 einrichten.

10. Computerlesbares Speichermedium mit gespeicherten Befehlen, die bei Ausführung auf einem Prozessor ein Verfahren nach einem der Ansprüche 1 bis 8 ausführen.
