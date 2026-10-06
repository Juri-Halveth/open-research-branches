# π · Potenzen, Vorzeichen und offene Dynamik

**Mathematischer Prüfstand · 06.10.2026 · reelle Domäne, sofern angegeben.**

Klammern und Operatoren legen den Ausdruck fest. Die folgenden Terme sind
eindeutige Beispiele; sie ersetzen keine noch ungeklärte Operatorfolge.

| Ausdruck | Bedeutung oder Wert |
| --- | --- |
| `π^π` | ungefähr `36.462159607207` |
| `π^(-π)` | ungefähr `0.027425693123` |
| `-(π^π)` | ungefähr `-36.462159607207` |
| `π^π · π^(-π)` | mathematisch exakt `1`, gleiche positive Basis |
| `(-π)^π` | im üblichen reellen Potenzbegriff nicht definiert |

Für positive Basis gilt `a^b = exp(b · ln(a))`. Daraus folgt die
Kehrwertbeziehung der beiden positiven π-Potenzen. Bei negativer Basis und
irrationalem Exponenten ist dieser reelle Ausdruck nicht definiert. Eine
komplexe Fortsetzung benötigt die Domäne und eine Logarithmus-Zweigwahl.

## Reproduzieren

```python
import math

print(f"{math.pi ** math.pi:.12f}")
print(f"{math.pi ** (-math.pi):.12f}")
print(f"{-(math.pi ** math.pi):.12f}")
print((math.pi ** math.pi) * (math.pi ** (-math.pi)))
```

Die Dezimalwerte sind gerundete Gleitkommaergebnisse. Ein numerischer
Roundtrip auf ungefähr eins ist keine neue Beweisgrundlage für die exakte
Potenzidentität. [Python: math](https://docs.python.org/3/library/math.html)

## Von einem Term zu einer Dynamik

Eine chaotische Dynamik benötigt eine Zustandsmenge, Iterationsregel wie
`x_(n+1) = f(x_n)`, Parameter, Anfangszustände und einen passenden Prüfvertrag.
Ein statischer Term oder eine unklare Zeichenfolge belegt sie nicht.

`OBSERVED`: Die Beispielrechnung ist im angegebenen Gleitkommamodell
wiederholbar. `UNKNOWN`: eine noch nicht definierte Iterationsregel.
`NOT_PROVEN`: chaotische Dynamik durch diese einzelnen Potenzen.

Nächster Vergleich: zwei ausdrücklich definierte Kandidaten mit denselben
Anfangszuständen und derselben Metrik prüfen. Reopen: eine eindeutige neue
Iterationsregel oder ein unterscheidendes Gegenbeispiel.

[CLAIMED und Mitclaim](Claim-und-Mitclaim.md) ·
[FEGEFEUER-Modell](../branches/fegefeuer-provenance-transducer/README.md) ·
[Lizenzkarte](../LICENSES.md)
