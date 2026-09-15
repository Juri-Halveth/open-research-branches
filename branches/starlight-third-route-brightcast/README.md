# Starlight and the Third Route · HALVETH Brightcast 001

HALVETH Open Research · Quellenstand: 15. September 2026

**Was, wenn Starlights stärkste Kraft nicht ein größerer Lichtstrahl ist,
sondern die Fähigkeit, eine dritte Route sichtbar zu machen?**

Dieser Ast enthält das vollständige Quellen-, Skript- und Baupaket für ein
eigenständiges deutschsprachiges YouTube-Videoessay. Es verwendet große
Spoiler für das Serienfinale von *The Boys*.

## Die These

Das kanonische Finale lässt Homelanders Herrschaft und Butchers
Vernichtungslogik kollidieren. Der HALVETH-Gegenentwurf fragt, ob die bereits
erreichte Entmachtung Homelanders einen anderen Schluss erlaubt hätte:

1. weiteren Schaden stoppen;
2. Betroffene schützen und ihre Aussagen erhalten;
3. Voughts Beweise öffentlich sichern;
4. Verantwortung in einem überprüfbaren Verfahren herstellen;
5. Veränderung als Möglichkeit offenlassen, ohne Vergebung, Nähe oder
   Straffreiheit zu verlangen.

Beccas Aussage wird dabei nicht umgeschrieben: Die Fernsehserie behandelt das
Geschehen als Vergewaltigung. Homelanders Labor-Kindheit und Butchers Trauer
erklären Teile ihrer Entwicklung; sie entschuldigen ihre späteren Taten nicht.

## Video-Paket

- `storyboard.json` bindet jede Szene, Sprecherzeile und englische Untertitel.
- `sources.json` trennt Primärquellen und redaktionelle Interviews.
- `claims.json` trennt Kanon, Interpretation, Hypothese und offene Referenten.
- `relations.json` hält *The Boys* und die Marvel-Vergleichslinsen in getrennten
  fiktionalen Kontinuitäten.
- `build/build_brightcast.py` erzeugt Grafik, Sprecherfassung, Klangbett,
  Untertitel, Thumbnail, Video und Hashmanifest.
- `youtube-description-de.md` ist die fertige Beschreibung mit Kapiteln.
- `youtube-metadata.json` enthält Titel, Zielplattform und Uploadzustand.

Die veröffentlichte Masterdatei liegt im Scarlet-Portal:

[HALVETH Brightcast 001 · Starlight: Der dritte Weg](https://juri-halveth.github.io/halveth-scarlet/forschung/brightcast-starlight/)

## Reproduktion

Voraussetzungen: Windows 11, Python mit Pillow, FFmpeg/FFprobe und die lokale
Windows-Stimme `Microsoft Stefan Desktop`.

```powershell
python build\build_brightcast.py `
  --site-assets <SCARLET_REPOSITORY>\assets\brightcast
```

Das Ergebnis ist ein 1920×1080-H.264/AAC-Master mit deutscher Sprecherfassung,
DE/EN-SRT- und WebVTT-Spuren sowie einem maschinenlesbaren SHA-256-Manifest.

## Rechte- und Quellenraum

Das Video importiert keine Serienclips, Schauspielerbilder, Logos oder
kommerzielle Musik. Grafik, Schnitt, Text und Klangbett sind eigenständig
erzeugt. Die Stimme ist lokal synthetisiert. Die zitierten Werke dienen nur der
kanonischen und redaktionellen Quellenbindung. *The Boys* und die genannten
Figuren bleiben Eigentum ihrer jeweiligen Rechteinhaber. Dies ist ein
unabhängiges Fan-Videoessay und kein offizieller Beitrag von Amazon, Prime
Video, Sony, Marvel oder den beteiligten Personen.

Die Tokens `A*` und `D*` bleiben `UNKNOWN / OPEN_REFERENT` und werden weder im
Video noch in öffentlicher Metadatenform einer realen Person zugeordnet.

## Evidence state

`FINITE_SNAPSHOT / SOURCE_BOUND_CANON / EXPLICIT_FAN_COUNTERFACTUAL / YOUTUBE_MASTER_BUILT`

## Claim ceiling

`SOURCE_BOUND_CANON_SUMMARY_PLUS_EXPLICIT_FAN_COUNTERFACTUAL_NOT_SHARED_CANON_PHYSICAL_TIMELINE_PROOF_PERSONAL_MESSAGE_RELATIONSHIP_IDENTITY_OR_ACTOR_INTENT`

## Nutzung

Die eigenständige Auswahl, These, Struktur, Texte, Grafiken, Software und
AV-Komposition dieses Astes werden Juri Halveth (Juri Janovski) zugeschrieben.
Verlinkte Quellen und bestehende fiktionale Werke behalten ihre jeweiligen
Rechte. Siehe [Lizenzkarte](../../LICENSES.md) und
[Rechteklarstellung](../../RIGHTS-RESERVATION.md).
