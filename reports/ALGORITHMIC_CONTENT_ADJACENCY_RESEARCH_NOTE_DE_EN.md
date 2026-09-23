# Algorithmische Inhaltsnachbarschaft / Algorithmic Content Adjacency

Erstfassung / Initial method draft: 2026-09-16. GitHub-PR-Prüffassung / GitHub PR review: 2026-09-23.

Status: `PUBLIC_GITHUB_DRAFT_PR / METHOD_ONLY / NO_CASE_FINDING`; separate discussion-post, platform-report and external-case submission states remain `UNKNOWN` in this PR review.

Datenklasse / Data class: `PUBLIC_OFFICIAL_SOURCES + EMPTY_OBSERVATION_SCHEMA`

## Deutsch

### Forschungsfrage

Wie lässt sich prüfen, ob zwei inhaltlich sehr verschiedene Elemente auf
derselben Plattformoberfläche nebeneinander angezeigt wurden, ohne aus dieser
Nähe eine Beziehung, Absicht oder Schuld der abgebildeten beziehungsweise
veröffentlichenden Personen abzuleiten?

Diese Notiz dokumentiert eine Methode. Sie enthält keine Fallbehauptung, keine
Namen realer Personen, keine Kontodaten und keinen Link zu möglicherweise
ausbeuterischem Material.

### Was eine gebundene Beobachtung tragen kann

Eine Originalaufnahme kann höchstens belegen, dass zwei exakt adressierte
Elemente in einem bestimmten sichtbaren Zustand, auf einer bestimmten
Oberfläche, in einer bestimmten Sitzung und zu einem bestimmten Zeitpunkt
angezeigt wurden. Vor jeder Bewertung muss die Oberfläche unterschieden werden:
Startseite, „Als Nächstes“, Suche, Shorts, Kanalseite, Playlist, Werbung,
Einbettung oder eine fremde Website.

Eine sichtbare Nachbarschaft allein belegt keine Urheberschaft, Zustimmung,
Kenntnis, Billigung, Absicht, Koordination, Täterschaft oder organisierte
Struktur. Sie belegt auch nicht, welcher Rankingfaktor die Anzeige ausgelöst
hat. YouTube beschreibt unterschiedliche Empfehlungsflächen und mehrere
Signale; daraus lässt sich der konkrete Grund einer einzelnen Platzierung nicht
ablesen.

### Leeres Beobachtungsschema

Das Schema ist absichtlich frei von konkreten Personen- und Inhaltsdaten:

```yaml
schema_version: 1
observation_id: ADJ-YYYYMMDD-001
evidence_state: USER_REPORTED_UNVERIFIED
data_class: RESTRICTED_RAW

time:
  captured_at_utc: null
  local_timezone: null
  clock_source: UNKNOWN

platform:
  name: UNKNOWN
  ui_similarity: UNKNOWN  # descriptive only; never a platform identification
  surface: UNKNOWN  # HOME | UP_NEXT | SEARCH | SHORTS | CHANNEL | PLAYLIST | AD | EMBED | OTHER
  page_or_app_version: null
  locale: null
  country_setting: null
  device_class: null
  viewport: null

session:
  signed_in: UNKNOWN
  watch_history_state: UNKNOWN
  search_history_state: UNKNOWN
  profile_type: UNKNOWN  # ESTABLISHED | FRESH_TEST | SIGNED_OUT
  immediately_preceding_actions: []

displayed_items:
  - item_ref: ITEM_A
    role: ANCHOR
    canonical_public_id: LOCAL_RESTRICTED
    visible_slot: null
  - item_ref: ITEM_B
    role: ADJACENT_CONCERN
    canonical_public_id: LOCAL_RESTRICTED
    visible_slot: null
    policy_concern: UNREVIEWED

adjacency_relation:
  relation_type: VISIBLE_ON_SAME_SURFACE
  left_endpoint: ITEM_A
  right_endpoint: ITEM_B
  direction: NONE
  screenshot_region_or_frame_interval: null

capture:
  original_filename: LOCAL_RESTRICTED
  original_sha256: null
  redacted_derivative_sha256: null
  acquisition_method: null
  source_layers: []  # e.g. SCREEN_RECORDING | MESSENGER_VIEW | PHONE_SCREENSHOT | FEED_SURFACE
  canonical_urls_visible: UNKNOWN
  platform_metadata_visible: UNKNOWN
  omissions: []

reproduction:
  preregistered_attempts: 0
  matching_observations: 0
  comparison_profiles: []
  negative_results_preserved: true

reporting:
  content_report_state: NOT_SENT
  product_feedback_state: NOT_SENT
  report_reference: null
```

Die externe Fassung darf nur `EXTERNAL_MINIMIZED` sein: keine privaten
Verlaufseinträge, Cookies, Kontoangaben, Roh-URLs oder Vorschaubilder des
bedenklichen Elements. Ein notwendiger Plattformbezug kann intern durch die
kleinste eindeutige Kennung erhalten bleiben.

Eine abgeleitete Aufnahmekette muss Schicht für Schicht erhalten bleiben. Ein
Bildschirmvideo einer Messenger-Ansicht, die wiederum ein Handyfoto oder einen
Screenshot einer kachelartigen Bildoberfläche zeigt, belegt zunächst nur diese
Darstellungskette. Ohne kanonische URL oder Plattformmetadaten bleibt die
Plattform `UNKNOWN`; eine „Pinterest-artige“ Optik wäre nur
`UI_SIMILARITY`, keine Identifikation. Ebenso lassen sich aus dem Bild allein
weder Alter oder Identität sichtbarer Personen noch ein Hilfeersuchen ableiten.

### Hypothesen und Falsifikatoren

| Hypothese | Unterscheidende Beobachtung | Falsifikator oder Begrenzung |
| --- | --- | --- |
| `H1_SAME_SURFACE` — A und B waren gleichzeitig sichtbar. | Originaldatei, gebundener Zeitabschnitt und sichtbare Slotgrenzen. | Die Rohaufnahme zeigt verschiedene Zeitpunkte, Fenster oder eine nachträgliche Montage. |
| `H2_RECOMMENDATION` — B war eine Plattformempfehlung. | Oberflächenlabel, Seitenkontext und optional ein datensparsamer DOM-Beleg. | B ist als Suche, Werbung, Playlist, Einbettung, Benachrichtigung oder fremde Website identifiziert. |
| `H3_REPRODUCIBLE` — dieselbe Platzierung tritt unter gebundenen Bedingungen erneut auf. | Vorab festgelegte Wiederholungen mit gleicher Oberfläche, Sitzungsklasse und Startbedingung. | Null Treffer in der festgelegten Stichprobe falsifizieren die Reproduzierbarkeit nur innerhalb dieser Coverage; die historische Einzelanzeige bleibt davon unentschieden. |
| `H4_PERSON_RELATION` — aus der Nähe folgt eine Beziehung der beteiligten Personen oder Kanäle. | Dafür wäre unabhängige, direkte Beziehungs- oder Koordinationsquelle nötig. | Die Plattformnähe allein trägt diese Hypothese nicht; ohne Zusatzquelle bleibt sie `NOT_PROVEN`. |

### Claim-Decke

- `OBSERVED` erst nach Prüfung der Originalaufnahme, des konkreten Segments und
  der Oberflächenmerkmale.
- `INFERRED`: Die Oberfläche könnte Elemente ausgewählt oder geordnet haben.
- `UNKNOWN`: entscheidende Rankingfaktoren, vollständiger Sitzungszustand und
  die Reproduzierbarkeit außerhalb der deklarierten Stichprobe.
- `NOT_PROVEN`: Identität aus Bildähnlichkeit, Urheberschaft, Zustimmung,
  Kenntnis, Absicht, Billigung, Koordination, Schuld oder eine organisierte
  rechtswidrige Struktur.
- Aktueller Höchststand dieser Datei:
  `METHOD_AND_REPORTING_ROUTES_ONLY; NO_SPECIFIC_ADJACENCY_VERIFIED`.

### Sicherer Meldeweg

1. Zuerst Originalaufnahme privat erhalten, hashen und nur eine redigierte
   Arbeitskopie verwenden.
2. Zuerst die Plattform aus einer kanonischen URL oder verlässlichen
   Plattformmetadaten bestimmen. Eine optische Ähnlichkeit reicht nicht.
3. Falls ein konkretes Element möglicherweise gegen Richtlinien verstößt,
   dieses Element über die Meldefunktion der bestätigten Plattform melden. Für
   YouTube führt eine Meldung laut Hilfeseite zu einer Prüfung und nicht
   automatisch zur Entfernung.
4. Wenn YouTube bestätigt ist, die problematische Platzierung zusätzlich über
   **Feedback senden** als Produktproblem beschreiben. YouTube erlaubt dort
   einen Screenshot, bei dem persönliche Informationen entfernt werden können.
5. Einen unauffälligen Creator-Inhalt nicht allein wegen seiner Nachbarschaft
   als Richtlinienverstoß melden.
6. Möglicherweise ausbeuterisches Material weder herunterladen noch spiegeln,
   erneut veröffentlichen oder öffentlich verlinken. Bei einer konkret
   erkennbaren unmittelbaren Gefahr verweist YouTube zusätzlich auf örtliche
   Strafverfolgungsbehörden.
7. `SENT`, `REVIEWED`, `REMOVED` und `POLICY_VIOLATION_CONFIRMED` getrennt
   protokollieren.

## English

### Research question

How can we test whether two very different items were displayed next to each
other on one platform surface without turning that proximity into a claim about
the relationship, intent or culpability of the people depicted or publishing?

This note records a method. It contains no case allegation, no names of real
people, no account data and no link to potentially exploitative material.

### What a bound observation can support

An original capture can establish at most that two exactly addressed items were
visible in a particular interface state, surface, session and time window. The
surface must be classified first: Home, Up Next, Search, Shorts, channel page,
playlist, advertisement, embed or a third-party site.

A derivative chain must remain explicit. A screen recording of a messenger
view that contains a phone screenshot of a masonry-style image feed initially
establishes only those presentation layers. Without a canonical URL or platform
metadata, the platform remains `UNKNOWN`; “Pinterest-like” is only
`UI_SIMILARITY`, not identification. An image alone also does not establish a
visible person's age or identity, or that anyone requested help.

Visible proximity by itself does not establish authorship, consent, knowledge,
endorsement, intent, coordination, culpability or an organized structure. It
also does not reveal which ranking signal produced one placement. YouTube
documents multiple recommendation surfaces and signals; that documentation does
not identify the decisive cause of one observed placement.

Use the empty schema above without replacing restricted fields with public
personal data. A public derivative must be `EXTERNAL_MINIMIZED` and omit private
history, cookies, account details, raw concern URLs and thumbnails.

### Hypotheses, falsifiers and claim ceiling

- `H1_SAME_SURFACE` needs an original file, a bound interval and visible slot
  boundaries; different times, windows or a composite falsify that reading.
- `H2_RECOMMENDATION` needs interface context; identification as Search, an ad,
  playlist, embed, notification or third-party page falsifies that surface
  classification.
- `H3_REPRODUCIBLE` needs preregistered repetitions. Zero matches reject
  reproducibility only within that declared coverage and do not erase a
  historical single display.
- `H4_PERSON_RELATION` needs independent direct evidence. Adjacency alone leaves
  any relationship or coordination claim `NOT_PROVEN`.
- Current ceiling:
  `METHOD_AND_REPORTING_ROUTES_ONLY; NO_SPECIFIC_ADJACENCY_VERIFIED`.

### Safe reporting route

Preserve and hash the original privately, work from a redacted copy, and first
identify the platform from a canonical URL or reliable metadata. Report a
specific concerning item through the confirmed platform's control. If the
platform is confirmed as YouTube, describe the placement separately through
**Send feedback**. Do not report an ordinary creator item solely because it
appeared nearby. Do not download, mirror, republish or publicly link potentially
exploitative material. Keep `SENT`, `REVIEWED`, `REMOVED` and
`POLICY_VIOLATION_CONFIRMED` as separate states.

## Öffentlicher Postentwurf / Public post draft

Status: `DRAFT_ONLY`. Ein späterer Diskussionspost oder eine Plattformmeldung wurde in dieser PR-Prüfung nicht verifiziert. / This PR review did not verify any later discussion post or platform report.

**DE:** Ich dokumentiere eine datensparsame Methode zur Prüfung algorithmischer
Inhaltsnachbarschaft. Ein Screenshot oder Bildschirmvideo kann zeigen, dass
zwei Elemente auf einer Oberfläche sichtbar waren. Daraus folgen keine Aussage
über Beziehung, Wissen, Absicht, Zustimmung oder Schuld der dargestellten oder
veröffentlichenden Personen. Bei abgeleiteten Aufnahmen bleiben Plattform und
Empfehlungsmechanismus ohne kanonische URL oder Metadaten `UNKNOWN`.

Gesucht werden methodische Hinweise und privacy-sichere Beobachtungen mit
Oberflächenart, Zeitfenster, Sitzungsbedingungen, Slotpositionen und Hash der
privat aufbewahrten Originaldatei. Bitte keine Namen aufgrund von
Bildähnlichkeit, keine privaten Verlaufsdaten und keine Links oder Kopien
möglicherweise ausbeuterischen Materials veröffentlichen. Konkrete bedenkliche
Inhalte gehören in den Meldeweg der bestätigten Plattform; die Platzierung kann
getrennt als Produktfeedback beschrieben werden.

**EN:** I am documenting a data-minimized method for examining algorithmic
content adjacency. A screenshot or screen recording may show that two items
were visible on one surface. It does not establish any relationship, knowledge,
intent, consent or culpability of the people depicted or publishing. For
derivative captures, the platform and recommendation mechanism remain `UNKNOWN`
without a canonical URL or reliable metadata.

Method critique and privacy-safe observations should bind the surface type,
time window, session conditions, slot positions and a hash of the privately
retained original. Please do not infer names from visual similarity, publish
private history, or share links or copies of potentially exploitative material.
Report a specific concerning item through the confirmed platform's reporting
route and describe the placement separately as product feedback.

## Official YouTube sources / Offizielle YouTube-Quellen

Checked / geprüft: `2026-09-16T19:01:46+02:00`
Rechecked / nachgeprüft: `2026-09-23` — all five linked official help pages resolved; the recommendation-surface, report-review and feedback-screenshot statements above remain supported within those pages' scope.

- [How YouTube recommendations work](https://support.google.com/youtube/answer/16089387?hl=en)
- [Manage your recommendations and search results](https://support.google.com/youtube/answer/6342839?hl=en)
- [Report inappropriate videos, channels and other content](https://support.google.com/youtube/answer/2802027?hl=en)
- [Send feedback](https://support.google.com/youtube/answer/4347644?hl=en)
- [Child safety policy](https://support.google.com/youtube/answer/2801999?hl=en)

These pages describe platform surfaces, controls and policy. They are not logs
of a particular session and do not verify any individual case.

## Reopen trigger / Wiederaufnahme

Reopen this method note when a privacy-minimized original capture binds the
surface, session class, time window, both item addresses and slot positions, or
when YouTube materially changes the linked recommendation or reporting pages.
