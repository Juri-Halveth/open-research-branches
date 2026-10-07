# Parabel, Perspektive und Invarianz

Das am 7. Oktober 2026 bereitgestellte Bild verbindet exakte Geometrie,
Perspektivenbeschreibung und eine ausdrücklich markierte Metapherebene.
Die folgenden Ableitungen führen diese Ebenen getrennt weiter.

## Geometrie

Für reelle `h`, `k` und `p != 0` ist

\[
(x-h)^2=4p(y-k)
\]

eine nicht entartete Parabel mit Scheitel `(h,k)`, Brennpunkt `(h,k+p)`
und Leitlinie `y=k-p`. Für einen Punkt auf der Kurve gilt

\[
\begin{aligned}
d(P,F)^2&=(x-h)^2+(y-k-p)^2\\
&=4p(y-k)+(y-k-p)^2\\
&=(y-k+p)^2=d(P,l)^2.
\end{aligned}
\]

Beide Entfernungen sind nicht negativ; daher folgt auch die Gleichheit
der Entfernungen. Die Funktionsform ist `y=a(x-h)^2+k`, mit `a=1/(4p)`.
`p>0` öffnet nach oben, `p<0` nach unten. `p=0` ist von diesem
nicht entarteten Parabelvertrag ausgeschlossen.

Die Symmetrie ist allgemein `f(h+u)=f(h-u)`. Daraus folgt bei `h=0`
`f(-x)=f(x)` für jedes `k`; die im Bild zusätzlich genannte Bedingung
`k=0` ist hinreichend, aber nicht erforderlich.

Alle nicht entarteten euklidischen Parabeln sind über geeignete
Ähnlichkeitstransformationen ähnlich. Eine beliebige Projektion,
Beschneidung oder verlustbehaftete Darstellung erhält dagegen nicht
automatisch Entfernungen oder die gesamte Kurve.

## Perspektive und Referent

Ein Koordinatenwechsel bindet Ausgangsraum, Zielraum und Abbildung.
Bei einem euklidischen Bezugssystemwechsel `x' = Qx + t`, mit
`Q^T Q = I`, bleiben paarweise Abstände erhalten. Koordinatenwerte
wechseln, während der durch den Vertrag gebundene geometrische Punkt
derselbe Referent sein kann.

Ein übereinstimmendes Merkmal identifiziert ein Objekt nicht allein:
Viele verschiedene Parabelpunkte haben denselben Abstand zu ihrem
Brennpunkt. Erhaltene Invarianten und eindeutige Identität bleiben daher
getrennte Prüfungen. Ebenso beweisen zwei Ansichten ohne Quellenbindung
nicht, dass sie dasselbe historische Ereignis zeigen.

## Metapher und nächster Prüfweg

Quelle, Spiegel, Beobachter und gebündelte Fragen bleiben als Designideen
sichtbar. Die dargestellten Pfeile erhalten durch ihr Aussehen weder
einen physikalischen Transferoperator noch einen Kausaltyp.

Für ein Optikmodell wäre eine nächste konkrete Erweiterung ein gebundener
Reflexionsvertrag: Fläche, Normale, Einfallsrichtung, Reflexionsoperator,
Einheit, Medium und Beobachtung. Die Parabelgeometrie liefert dafür einen
möglichen Modellbaustein; sie beweist noch keine gemessene Wirkung am Auge.

[Zeichen und Verwendung](SYMBOL_INTERPRETATION.md) ·
[Typisierte Zustandsbeobachtung](branches/security-impact-learning/STATE_OBSERVATION.md) ·
[Gemeinsamer Einstieg](UNIVERSAL_ENTRY.md)
