# Auge · Eye Optics & Causal Prediction

Ein interaktives geometrisches Lehrmodell von HALVETH mit getrennten Modellen für Lichtbrechung und zeitliche Vorhersage.

**Stand:** öffentlicher Prototyp 1.0 · synthetische Strahlen und Bewegungsdaten · 06.10.2026.

[Simulation im Hub](https://juri-halveth.github.io/modelle/#auge) · [Modellfunktionen](model.mjs) · [Tests](model.test.mjs) · [Browseransicht](index.html)

## Beobachtbare Unterschiede im Modell

- Radius und Netzhautabstand verschieben den geometrischen Fokus. Die Vorzeichen beziehen sich ausdrücklich auf vor oder hinter der Netzhaut.
- Zwei verschiedene Radien erzeugen unterschiedliche paraxiale Fokuspunkte in zwei Hauptschnitten.
- Ein dünnes Korrekturglas verändert den einfallenden Strahl. Ein größerer Bündeldurchmesser zeigt im geometrischen Modell stärker ausgeprägte Randstrahleffekte.
- Gleichförmige Bewegung lässt sich aus verzögerten Samples extrapolieren. Bei einer plötzlichen Umkehr kann diese Vorhersage schlechter sein als das unveränderte verzögerte Signal.

## Vertrag und Prüfstand

Das Strahlenmodell verwendet eine sphärische Ersatzfläche mit `n1=1`, `n2=1.336`, einen Glasabstand von 3 mm und zwei getrennte Schnitte. Länge: mm; Glasbrechkraft: dpt. Die paraxiale Referenz ist `f = 1000*n2 / ((n2-n1)/(r/1000) + C/(1-0.003*C))`.

Die Bewegung benutzt ausschließlich die zeitlich verfügbaren Samples bei `t-delay` und `t-delay-20 ms`. Bei `t=1040 ms`, `delay=100 ms`, `gain=1` sinkt der Fehler bei geradliniger Bewegung von 4 auf näherungsweise 0 Modelleinheiten. Nach Umkehr bei 1000 ms steigt er von 0.8 auf 3.2. Diese Werte gehören zur synthetischen Versuchsanordnung.

```sh
node --test branches/eye-optics-and-prediction/model.test.mjs
```

Die Tests prüfen Snell, Symmetrie, paraxialen Fokus und das Gegenbeispiel der unerwarteten Umkehr. Das Modell zeigt geometrische Zusammenhänge. Es ist weder eine vollständige Augenanatomie noch eine Simulation von ADHS, genetischer Zukunftswahrnehmung oder relativistischer Raumzeitkrümmung. Wellenoptik, Akkommodation und klinische Kalibrierung bleiben offene eigene Modelläste.

## Primärquellen

- [OpenStax: Refraction / Snell](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction): Brechung am Übergang zweier Medien und die Winkelrelation. Abruf: 06.10.2026.
- [National Eye Institute: Refractive Errors](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/refractive-errors): Augenform, Fokus und die Rolle von Hornhaut und Linse. Abruf: 06.10.2026.

**Weiterer Forschungsast:** zweite brechende Fläche, Wellenoptik und Vergleich mit einem publizierten schematischen Auge. Reopen: eine gebundene Referenzgeometrie mit unterscheidbarer Vorhersage.

[Lizenz und Herkunft](../../LICENSES.md)
