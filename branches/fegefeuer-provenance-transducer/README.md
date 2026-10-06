# FEGEFEUER · Provenienzgebundener Zustands-Transduktor

Ein ausführbarer lokaler Softwareprototyp von HALVETH: Ereignisse aufnehmen, Herkunft erhalten, Kandidaten prüfen und ausgewählte Zustandsänderungen mit Delta und Receipt übernehmen.

**Stand:** öffentlicher Prototyp 0.1 · synthetische Tests · 06.10.2026. Der Kern arbeitet ausschließlich im Speicher.

## Was umgesetzt ist

- Unveränderliche Ereignisbytes, Quelle, Ereignis-ID, Zeit und Kontext; gleiche Bytes dürfen zu verschiedenen Ereignissen gehören.
- Separate Kandidatenaufnahme, HOLD, RETURN und REOPEN. Aufnahme verändert den Arbeitskern erst beim expliziten Commit.
- Ein gebundener Demonstrationsoperator `ascii-upper-bytes-v1`, Vorher-/Nachher-Digests, Delta und append-only Receipts.
- Gerichtete Graphsuche mit Front, Tiefen- und Mengenbudget. Unbekannte Nachbarschaft und eine bekannte leere Nachbarschaft bleiben getrennt.
- Ausgabe als neuer Keim mit Vorgängerbezug.

## Mathematischer Vertrag

Für eine feste Nachbarschaft mit höchstens 25 Nachfolgern pro Knoten gilt bei einem Keim:

`|Front_d| <= 25^d` und `|Archiv_d| <= (25^(d+1)-1)/24`.

Das kumulative Aufnahme-Archiv wächst monoton. Die aktive Front darf kleiner werden. Auf einem endlichen, vollständig bekannten und unbegrenzten Graphen führt die Frontsuche zum kleinsten erreichbaren Abschluss. Ein Budgetende liefert einen endlichen Ausschnitt und zurückgestellte Kanten. Der Prototyp behauptet keine Konvergenz beliebiger Transformatoren und keinen physikalischen Attraktor.

## Code und Wiederholung

[Kern](fegefeuer_core.py) · [17 Tests](test_fegefeuer_core.py)

```sh
python -m unittest discover -s branches/fegefeuer-provenance-transducer -p 'test_*.py' -v
```

Die Tests prüfen Zyklen, gemeinsame Nachfolger, die 25er-Baumgrenze, unbekannte Nachbarschaft, Ereignisidentität, Stale-Patch-Abweisung und Provenienz. Ein lokaler Pass belegt diese kodierten Invarianten. Beobachtungen eines fremden Systems gehören zu einem separaten Prüfvertrag.

**Weiterer Forschungsast:** Operatorfamilien, dauerhafte Speicherung und konkurrierende Commits. Reopen: ein definierter neuer Operator oder ein reproduzierbares Gegenbeispiel.

[Modelle im Hub](https://juri-halveth.github.io/modelle/#fegefeuer) · [Lizenz und Herkunft](../../LICENSES.md)
