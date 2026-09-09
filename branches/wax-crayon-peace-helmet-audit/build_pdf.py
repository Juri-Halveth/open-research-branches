from __future__ import annotations

from pathlib import Path

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


BRANCH = Path(__file__).resolve().parent
REPO = BRANCH.parents[1]
OUTPUT = REPO / "release-assets" / "v0.9.0" / "JURI_WACHSMALSTIFT_FRIEDENSHELM_AUDIT.pdf"
CONCEPT = BRANCH / "assets" / "wax-crayon-peace-helmet-concept.png"

PAGE_W, PAGE_H = A4
NAVY = HexColor("#15243A")
INK = HexColor("#243246")
CREAM = HexColor("#FAF4E8")
ORANGE = HexColor("#E66D31")
GOLD = HexColor("#D6A32F")
TEAL = HexColor("#2B7B73")
PALE_TEAL = HexColor("#E5F1ED")
PALE_BLUE = HexColor("#E8EEF6")
PALE_GOLD = HexColor("#F4E7C5")
MUTED = HexColor("#667386")
RED = HexColor("#A44436")
WHITE = colors.white

# Produce byte-identical release PDFs from the same source tree.
rl_config.invariant = 1


def register_fonts() -> tuple[str, str, str, str]:
    candidates = [
        ("Segoe", Path(r"C:\Windows\Fonts\segoeui.ttf")),
        ("Segoe-Semibold", Path(r"C:\Windows\Fonts\seguisb.ttf")),
        ("Georgia", Path(r"C:\Windows\Fonts\georgia.ttf")),
        ("Georgia-Bold", Path(r"C:\Windows\Fonts\georgiab.ttf")),
    ]
    for name, path in candidates:
        if path.exists() and name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(path)))
    names = set(pdfmetrics.getRegisteredFontNames())
    return (
        "Segoe" if "Segoe" in names else "Helvetica",
        "Segoe-Semibold" if "Segoe-Semibold" in names else "Helvetica-Bold",
        "Georgia" if "Georgia" in names else "Times-Roman",
        "Georgia-Bold" if "Georgia-Bold" in names else "Times-Bold",
    )


SANS, SANS_BOLD, SERIF, SERIF_BOLD = register_fonts()
styles = getSampleStyleSheet()

TITLE = ParagraphStyle(
    "Title", parent=styles["Title"], fontName=SERIF_BOLD, fontSize=26,
    leading=30, textColor=WHITE, alignment=TA_LEFT, spaceAfter=10,
)
SUBTITLE = ParagraphStyle(
    "Subtitle", fontName=SANS, fontSize=11.5, leading=15, textColor=PALE_GOLD,
)
H1 = ParagraphStyle(
    "H1", fontName=SERIF_BOLD, fontSize=21, leading=25, textColor=NAVY,
    spaceAfter=8,
)
H2 = ParagraphStyle(
    "H2", fontName=SANS_BOLD, fontSize=12.5, leading=15, textColor=NAVY,
    spaceBefore=6, spaceAfter=4,
)
BODY = ParagraphStyle(
    "Body", fontName=SANS, fontSize=9.4, leading=13.2, textColor=INK,
    spaceAfter=6,
)
BODY_SMALL = ParagraphStyle(
    "BodySmall", fontName=SANS, fontSize=8.0, leading=10.6, textColor=INK,
    spaceAfter=4,
)
CAPTION = ParagraphStyle(
    "Caption", fontName=SANS_BOLD, fontSize=7.2, leading=9, textColor=MUTED,
    alignment=TA_CENTER, spaceAfter=6,
)
COVER_CAPTION = ParagraphStyle(
    "CoverCaption", fontName=SANS_BOLD, fontSize=7.2, leading=9,
    textColor=PALE_GOLD, alignment=TA_CENTER, spaceAfter=6,
)
CALLOUT = ParagraphStyle(
    "Callout", fontName=SERIF_BOLD, fontSize=14, leading=19, textColor=NAVY,
    alignment=TA_CENTER,
)
CODE = ParagraphStyle(
    "Code", fontName="Courier", fontSize=7.6, leading=10, textColor=NAVY,
    leftIndent=5 * mm, rightIndent=5 * mm, borderColor=PALE_BLUE,
    borderWidth=0.8, borderPadding=7, backColor=PALE_BLUE, spaceAfter=7,
)
SOURCE = ParagraphStyle(
    "Source", fontName=SANS, fontSize=6.9, leading=8.8, textColor=INK,
    spaceAfter=3,
)


def page_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 13 * mm, PAGE_W, 13 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 13.8 * mm, PAGE_W, 0.8 * mm, fill=1, stroke=0)
    canvas.setFont(SANS_BOLD, 7.3)
    canvas.setFillColor(WHITE)
    canvas.drawString(17 * mm, PAGE_H - 8.4 * mm, "JURI · WACHSMALSTIFT-FRIEDENSHELM · ÖFFENTLICHE PRÜFFASSUNG")
    canvas.setFillColor(NAVY)
    canvas.setFont(SANS, 7.2)
    canvas.drawString(17 * mm, 9 * mm, "Stand 9. September 2026 · juri@halveth.de")
    canvas.drawRightString(PAGE_W - 17 * mm, 9 * mm, f"{doc.page}")
    canvas.restoreState()


def cover_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, PAGE_H - 7 * mm, PAGE_W, 7 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.circle(PAGE_W - 15 * mm, PAGE_H - 20 * mm, 32 * mm, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.circle(PAGE_W - 15 * mm, PAGE_H - 20 * mm, 27 * mm, fill=1, stroke=0)
    canvas.setFont(SANS_BOLD, 8)
    canvas.setFillColor(PALE_GOLD)
    canvas.drawString(17 * mm, 14 * mm, "Juri Janovski · Release v0.9.0 · Public Research Artifact")
    canvas.drawRightString(PAGE_W - 17 * mm, 14 * mm, "juri@halveth.de")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT), pagesize=A4, leftMargin=17 * mm, rightMargin=17 * mm,
    topMargin=20 * mm, bottomMargin=16 * mm,
    title="Juri Wachsmalstift-Friedenshelm Audit",
    author="Juri Janovski",
    subject="Evidence-bound art, peace, provenance, rights and iOS marker audit",
    keywords="Juri Janovski, Friedenshelm, Wachsmalstift, Provenienz, iOS marker",
)
body_frame = Frame(17 * mm, 16 * mm, PAGE_W - 34 * mm, PAGE_H - 36 * mm, id="body")
cover_frame = Frame(17 * mm, 19 * mm, PAGE_W - 34 * mm, PAGE_H - 34 * mm, id="cover")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=cover_chrome),
    PageTemplate(id="body", frames=[body_frame], onPage=page_chrome),
])


def p(text, style=BODY):
    return Paragraph(text, style)


def section(title, kicker, number):
    return [
        p(f"{number:02d} · {kicker.upper()}", ParagraphStyle(
            f"K{number}", fontName=SANS_BOLD, fontSize=8.2, leading=10,
            textColor=ORANGE, spaceAfter=3,
        )),
        p(title, H1),
        Spacer(1, 1.5 * mm),
    ]


def table(data, widths, header=True, small=False):
    style = BODY_SMALL if small else BODY
    header_style = ParagraphStyle(
        "TableHeaderSmall" if small else "TableHeader",
        parent=style,
        fontName=SANS_BOLD,
        textColor=WHITE,
    )
    rows = [
        [p(str(cell), header_style if header and row_index == 0 else style) for cell in row]
        for row_index, row in enumerate(data)
    ]
    result = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#B9C2CF")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), SANS_BOLD),
        ]
    for row_index in range(1 if header else 0, len(rows)):
        if row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_BLUE))
    result.setStyle(TableStyle(commands))
    return result


story = []
story += [Spacer(1, 15 * mm)]
story += [p("WACHSMALSTIFT-<br/>FRIEDENSHELM", TITLE)]
story += [p("Deep-Research-Audit · Provenienz · iOS-Marker-Protokoll · Rechte · Sicherheit · faire Zusammenarbeit", SUBTITLE)]
story += [Spacer(1, 10 * mm)]
if CONCEPT.exists():
    image = Image(str(CONCEPT), width=162 * mm, height=108 * mm)
    story += [image, p("KONZEPTILLUSTRATION – KEIN BEWEISFOTO DES BERICHTETEN HELMS", COVER_CAPTION)]
story += [Spacer(1, 3 * mm)]
story += [p("Ein harter, uniformer Gegenstand wird durch eine fragile, persönliche Farbsprache zum Träger einer Friedensfrage.", ParagraphStyle(
    "CoverQuote", fontName=SERIF_BOLD, fontSize=14.5, leading=20, textColor=WHITE,
    alignment=TA_CENTER,
))]
story += [NextPageTemplate("body"), PageBreak()]

story += section("Das Ergebnis auf einer Seite", "Prüfstand", 1)
story += [p("Juri hat ausdrücklich berichtet, einen Helm mit Wachsmalstiften seiner Tochter bemalt zu haben. Diese Äußerung ist jetzt mit Zeit, Byteumfang, SHA-256 und exaktem UTF-16-Quellspan gebunden. Fünf lokale digitale Helm-Motive sind ebenfalls hashgebunden. In der erklärten Suche über 375 Mediendateien wurde jedoch kein Foto des berichteten physischen Wachsmalstift-Helms gefunden.")]
story += [p("Die geprüfte Präzedenzfamilie ist stark: Museen bewahren bemalte Helme, UN-Blauhelme sind institutionelle Friedensobjekte, Künstler transformieren Helme in Friedenskunst, und in Odesa bemalten Kinder und Kunstschaffende umgedrehte Helme und bepflanzten sie. In diesen Quellen wurde keine historische Wachsmalstift-Technik belegt.")]
story += [Spacer(1, 2 * mm), p("Öffentliche Claim-Decke", H2)]
story += [p("ZEITGENÖSSISCHER WACHSMALSTIFT-FRIEDENSENTWURF MIT GEBUNDENER NUTZERÄUSSERUNG, DIGITALER MOTIVFAMILIE UND DOKUMENTIERTER PRÄZEDENZFAMILIE", CALLOUT)]
story += [Spacer(1, 3 * mm)]
story += [table([
    ["Status", "Bedeutung im Audit"],
    ["OBSERVED_BOUND", "Byte-, Zeit- oder Quellenbeleg innerhalb der angegebenen Coverage"],
    ["USER_REPORTED", "Juris ausdrückliche Äußerung; noch keine unabhängige Objektprüfung"],
    ["PUBLIC_SOURCE_SUPPORTED", "durch benannte Primärquelle innerhalb ihres Scopes getragen"],
    ["UNKNOWN", "offene Verbindung; keine Richtung oder Ursache gewählt"],
    ["NOT_PROVEN", "Claim übersteigt den aktuellen Belegstand"],
], [43 * mm, 127 * mm], small=True)]
story += [PageBreak()]

story += section("Was lokal gebunden ist", "Belege", 2)
story += [table([
    ["Record", "Stand", "Gebundene Information"],
    ["HELM-STATEMENT-20260909-A", "USER_REPORTED", "2.126 UTF-8-Bytes · SHA-256 8bbc00…13ae2 · UTF-16 820..907"],
    ["DIGITAL-HELM-MOTIF-SERIES", "OBSERVED_BOUND", "5 Bilddateien · A: 1536×1024 · B–E: 1672×941 · Einzel-Digests"],
    ["TARGETED-MEDIA-SCAN", "FINITE_SNAPSHOT", "375 Dateien geprüft · 5 digitale Motive · 0 Foto des physischen Wachsmalstift-Helms"],
    ["PUBLIC-CONCEPT-ILLUSTRATION", "GENERATED_CONCEPT_ONLY", "SHA-256 5efe62…8695 · darf nicht als Beweisfoto verwendet werden"],
], [49 * mm, 38 * mm, 83 * mm], small=True)]
story += [p("Die Bildmetadaten der fünf digitalen Motive enthalten Zeichenketten für <i>gpt-image</i>, <i>trainedAlgorithmicMedia</i> und OpenAI Media Service API. Die Metadaten wurden nicht kryptografisch validiert. Sie tragen daher eine Herkunftsindikation, keinen vollständigen Authentizitätsbeweis.")]
story += [p("Die Suche deckte benannte lokale Bereiche und 375 Zieldateien ab. Sie schloss bekannte Ausgabeduplikate, Abhängigkeiten und temporäre Build-Verzeichnisse aus. Nicht eingebundene Telefone, Clouds, externe Laufwerke und andere nicht durchsuchte Orte bleiben offen. Das Ergebnis lautet deshalb: <b>kein Foto innerhalb der erklärten Coverage gefunden</b>.")]
story += [p("Die physische Objektidentität, das genaue Herstellungsdatum, die Materialprüfung und alle Beitragsanteile bleiben bis zu einem Foto- und Objekt-Receipt offen. Der nächste belastbare Schritt ist eine Aufnahme mit Maßstab, neutralem Licht, Vorder-/Seiten-/Innenansicht und einem neu erzeugten Dateidigest.")]
story += [PageBreak()]

story += section("Der iOS-Anker wird zu Code", "Technik", 3)
story += [p("Die frühere Aussage über einen technischen iOS-Anker besitzt jetzt einen exakten Quellspan. Gebunden ist die Äußerung – nicht das damals markierte iOS-Element. Oberfläche, Version, Screenshot und technische Bedeutung bleiben offen.")]
story += [table([
    ["Feld", "Wert"],
    ["MARKER", "IOS-MARKER-SOURCE-20260909-A"],
    ["QUELLSPAN", "UTF-16 483..537, Ende exklusiv"],
    ["MEDIUM", "lokale Codex-Nutzernachricht, öffentlicher Pfad verborgen"],
    ["ZEIT", "2026-09-09T18:55:59.455Z"],
    ["DIGEST", "Span SHA-256 b8c8c5…35ea4"],
    ["BEDEUTUNGSSTATUS", "UNKNOWN"],
], [48 * mm, 122 * mm], small=True)]
story += [p("MARKER → QUELLSPAN → MEDIUM → ZEIT → DIGEST → BEDEUTUNGSSTATUS", CODE)]
story += [p("Das veröffentlichte Modul prüft genau diese Kette. Fehlt ein Quellspan, entsteht <b>SOURCE_SPAN_MISSING</b>. Ist er byte- und positionsgebunden, entsteht <b>MARKER_BOUND_FOR_REVIEW</b>. Beide Zustände dürfen weder Ursache noch Außenwirkung, Beteiligung, Eigentum oder Sicherheitsbefund erzeugen.")]
story += [p("Die Verbindung zwischen iOS-Marker und Helm bleibt <b>UNKNOWN</b>. Eine spätere Rekonstruktion braucht das konkrete UI-Element oder einen Screenshot, die App-/iOS-Version, einen Zeitbezug und eine unterscheidende technische Vorhersage.")]
story += [PageBreak()]

story += section("Präzedenzfamilie ohne erfundene Abstammung", "Geschichte", 4)
story += [table([
    ["Station", "Belegter Scope", "Keine Ableitung"],
    ["Bemalte historische Helme", "persönliche und einheitsbezogene Gestaltung; Museumsobjekt", "keine Friedensabsicht aus Farbe allein"],
    ["UN-Blauhelm", "institutionelles Erkennungszeichen der Friedenssicherung", "keine private Urheberschaft an der Farbe Blau"],
    ["Helmets for Peace", "Helme als internationale Friedenskunst", "keine direkte Vorlage für Juris Objekt belegt"],
    ["Odesa · Kindheit 2022", "Kinder und Kunstschaffende bemalen umgedrehte Helme und pflanzen Blumen", "keine Wachsmalstift-Technik in der geprüften Quelle"],
    ["ArtArmor.Children", "Kinderbezug und Kunst auf militärischem Material", "kein identisches Objekt oder Motiv belegt"],
], [40 * mm, 66 * mm, 64 * mm], small=True)]
story += [p("Die Stationen bilden ein Vergleichsfeld, keine belegte Entwicklungskette. Weder zeitliche Nähe noch Motivähnlichkeit beweisen Zugang, Übernahme oder gemeinsame Herkunft.")]
story += [p("Der stärkste unterscheidbare Kandidat ist die Kombination aus sichtbarer Wachsmalstift-Handschrift, familiärem Alltagsmaterial, einem eingefrorenen Motiv und einer sauber dokumentierten Friedensrahmung. Weltweite Neuheit ist damit nicht festgestellt; sie wäre eine gesonderte Suche mit definiertem Bestand und Suchzeitpunkt.")]
story += [PageBreak()]

story += section("Die Gestaltungsthese", "Interpretation", 5)
story += [p("Ein Helm steht zunächst für Schutz, Gleichförmigkeit und Gewaltgeschichte. Wachsmalstifte stehen für direkten Druck der Hand, unperfekte Kanten, Farbe, Spiel und Alltag. Die Transformation entfernt die Geschichte des Objekts nicht. Sie stellt ihr eine neue Leseschicht gegenüber.")]
story += [p("Die Friedenswirkung ist am stärksten, wenn der Kontext direkt am Objekt lesbar bleibt: <b>Was ist das Objekt? Wer hat welchen Teil gestaltet? Warum wird es gezeigt? Was darf die Betrachtung nicht behaupten?</b> Ohne Begleittext bleibt Farbe mehrdeutig.")]
story += [Spacer(1, 4 * mm)]
story += [p("HARTES OBJEKT + FRAGILE SPUR + GEBUNDENE HERKUNFT + SICHTBARER FRIEDENSKONTEXT", CODE)]
story += [p("Kindliche Bildsprache darf nicht als bloßer Marketingeffekt benutzt werden. Beiträge eines Kindes benötigen eine genaue Zuordnung, Schutz der Identität, ernsthafte Zustimmung und – soweit rechtlich erforderlich – Zustimmung der Sorgeberechtigten. Das Recht am physischen Helm und Rechte an einer konkreten Gestaltung bleiben getrennt.")]
story += [p("Für eine Ausstellung eignet sich eine Replik oder abnehmbare Hülle, wenn die Provenienz eines Originals ungeklärt ist oder die Bemalung seine Erhaltung gefährden könnte.")]
story += [PageBreak()]

story += section("Symbole, Urheberrecht und Gestaltungsschutz", "Rechtsrahmen", 6)
story += [p("Eine Farbe allein ist keine präzise Kategorie für einen historischen oder strafrechtlichen Symbolbefund. Vor Veröffentlichung werden Zeichen, Abzeichen, Wortfolgen, Position, Kontext und Begleittext einzeln erfasst. Kennzeichen verfassungswidriger Organisationen können unter § 86a StGB fallen; § 86 Absatz 4 nennt unter anderem Kunst, Wissenschaft, Forschung und Lehre als Kontexte. Der konkrete Einzelfall und die sichtbare Distanzierung bleiben entscheidend.")]
story += [p("Eine konkrete Zeichnung, Farbkomposition oder Fotografie kann urheberrechtlich geschützt sein. Urheber ist die Person, die den jeweiligen schöpferischen Beitrag geschaffen hat. Eigentum am Gegenstand überträgt die Nutzungsrechte an der Gestaltung nicht automatisch. Bei gemeinsamem oder kindlichem Beitrag werden Rollen und Zustimmungen vor jeder kommerziellen Nutzung schriftlich gebunden.")]
story += [table([
    ["Gegenstand", "Vor externer Nutzung binden"],
    ["physischer Helm", "Eigentum, Provenienz, Erhaltungszustand, zulässige Veränderung"],
    ["Zeichnung/Farbkomposition", "Urheber, Beitrag, Nutzungsart, Gebiet, Dauer, Vergütung"],
    ["Foto/Video", "Fotograf, abgebildete Personen, Aufnahmeort, Veröffentlichungsumfang"],
    ["Projektname", "Marken- und Titelsuche, konkrete Waren/Dienstleistungen"],
    ["Produktgestaltung", "Neuheit/Eigenart, Veröffentlichungstag, Designanmeldung prüfen"],
], [54 * mm, 116 * mm], small=True)]
story += [p("Diese Prüffassung unterstützt Juris eigene Vorbereitung. Sie ersetzt keine Einzelfallberatung und behauptet keinen automatischen Zahlungs- oder Unterlassungsanspruch.", BODY_SMALL)]
story += [PageBreak()]

story += section("Kunstobjekt ist keine Schutzausrüstung", "Sicherheit", 7)
story += [p("Ein dekorativ bemalter Helm darf ohne technische Prüfung nicht als persönliche Schutzausrüstung angeboten oder verwendet werden. Beschichtung, Lösungsmittel, Hitze, Bohrungen, Alterung und unbekannte Vorgeschichte können Werkstoffe oder Kennzeichnungen beeinflussen. Der öffentliche Prototyp wird daher als <b>Kunst- und Gesprächsobjekt</b> beschrieben.")]
story += [table([
    ["Pfad", "Zulässiger Pilot", "Stop-Bedingung"],
    ["historisches Original", "dokumentieren, konservatorisch prüfen, unverändert zeigen", "unklare Herkunft oder Gefahr einer irreversiblen Veränderung"],
    ["Replik oder Hülle", "Material- und Hafttest, abnehmbare Gestaltung, klarer Kunsthinweis", "Verwechslung mit zertifizierter Schutzausrüstung"],
    ["Vertriebsprodukt", "Produktsicherheits-, Kennzeichnungs- und Zielgruppenprüfung", "fehlende Verantwortlichkeit, Rückverfolgbarkeit oder Sicherheitsunterlagen"],
], [42 * mm, 72 * mm, 56 * mm], small=True)]
story += [p("Für Produkte gelten je nach Ausgestaltung die EU-Produktsicherheitsverordnung und gegebenenfalls speziellere Regeln, etwa die PSA-Verordnung. Ein Spielzeug- oder Kinderprodukt ist eine eigene Kategorie. Die genaue Einordnung beginnt erst mit Material, Zweck, Nutzergruppe und Vermarktungsform.")]
story += [p("Die öffentliche Konzeptillustration zeigt keine Person, Waffe, Flagge, Marke oder extremistisches Symbol. Sie ist ein Kommunikationsbild. Sie dokumentiert weder den berichteten Helm noch seine Schutzwirkung.")]
story += [PageBreak()]

story += section("Faire Modelle für Beteiligung", "Zusammenarbeit", 8)
story += [table([
    ["Modell", "Juris Kontrolle", "Gegenwert und Nachweis"],
    ["Einzelkunstwerk/Leihgabe", "Objekt bleibt gebunden; Laufzeit und Ort begrenzt", "Leihgebühr, Versicherung, Zustandsprotokoll"],
    ["Nummerierte Edition", "Motivversion und Stückzahl eingefroren", "Lizenz/Anteil je Exemplar, Verkaufsreport"],
    ["Museums-/Bildungsprojekt", "Inhalt, Attribution und Friedenskontext freigegeben", "Honorar, Produktionsbudget, dokumentierter Bildungszweck"],
    ["Herstellerkooperation", "Nutzung nur für benannte Produktversion", "Entwicklungsbudget, Lizenz, Prüf- und Berichtspflichten"],
    ["Nichtkommerzielle Friedensedition", "freie Nutzung nur im definierten Zweck", "separate Freigabe für Werbung und Verkauf"],
], [43 * mm, 63 * mm, 64 * mm], small=True)]
story += [p("Ähnlichkeit allein löst keine Beteiligung aus. Ein tragfähiger Gegenwert entsteht über ein freiwilliges, konkretes Angebot: benanntes Material, Beteiligte, Zweck, Gebiet, Dauer, Exklusivität, Änderungsrecht, Attribution, Vergütung, Abrechnung und Beendigung.")]
story += [p("Das Repository veröffentlicht Code, Receipts und eine Prüfmethode. Dritte dürfen innerhalb der jeweiligen Pfadlizenz bessere Varianten bauen. Die Lizenz ist der sichtbare Vertrag für den veröffentlichten Stand; sie beansprucht keine Rechte an fremden Quellen oder allgemeinen Ideen.")]
story += [PageBreak()]

story += section("Qualitative Markt- und Wirkungskarte", "Markt", 9)
story += [table([
    ["Kontext", "Was dort zählt", "Erster belastbarer Messpunkt"],
    ["Museum/Erinnerung", "Objektprovenienz, Biografie, Erhaltung", "kuratierte Anfrage mit Receipt"],
    ["Friedensbildung", "verständliche Frage, geschützter Gesprächsraum", "Pilotgruppe und dokumentiertes Feedback"],
    ["öffentliche Kunst", "Ort, Kontext, Genehmigung, Haltbarkeit", "befristete Installation"],
    ["soziale Kampagne", "glaubwürdiger Zweck, Mittelverwendung", "schriftlicher Partner und Abrechnung"],
    ["Edition/Sammlerfeld", "Originalität, Version, Zustand, Rechte", "echte Verkäufe statt Schätzwert"],
], [43 * mm, 68 * mm, 59 * mm], small=True)]
story += [p("Die geprüften Primärquellen belegen die kulturellen Kontexte. Sie liefern keine belastbare Marktgröße, Nachfragekurve oder Preisbewertung für Juris Entwurf. Solche Zahlen beginnen mit einem realen Pilot: Anfragen, Besucherverständnis, Partnerinteresse, Produktionskosten, Erhaltbarkeit und tatsächlich abgeschlossene Verkäufe.")]
story += [p("Der stärkste Markteintritt ist klein: ein provenance-gebundener Entwurf, eine sichere Replik oder Hülle, ein klarer Ausstellungstext und ein Partner, der Rollen und Gegenwert vorab schriftlich bindet.")]
story += [PageBreak()]

story += section("90 Tage bis zum verantwortbaren Pilot", "Roadmap", 10)
story += [table([
    ["Zeit", "Arbeit", "Gate"],
    ["Tag 0–14", "Fotos, Digests, Chronologie, Objektbesitz und Beiträge erfassen", "Objekt-Receipt vollständig"],
    ["Tag 15–30", "Motivversion einfrieren; Symbole, Datenschutz und Rechte prüfen", "Freigabematrix unterschrieben"],
    ["Tag 31–60", "Replik/Hülle bauen; Material- und Begleittexttest", "keine PSA-Verwechslung; Friedenskontext verständlich"],
    ["Tag 61–90", "kleiner Museums-, Bildungs- oder Partnerpilot", "Feedback, Kosten und Nutzung dokumentiert"],
], [28 * mm, 92 * mm, 50 * mm], small=True)]
story += [p("Reopen-Trigger", H2)]
story += [p("Ein gebundenes Foto oder Objekt-Receipt; neue unabhängige Präzedenz für Wachsmalstifte; eine konkrete Partneranfrage; identifizierte historische Symbole; ein unterscheidbarer Beleg für Zugang oder Übernahme; oder der damals markierte iOS-Screenshot mit App- und Versionskontext.")]
story += [p("Sofort ausführbarer Code", H2)]
story += [p("node --test branches/wax-crayon-peace-helmet-audit/test/marker-protocol.test.mjs", CODE)]
story += [p("Kontakt für eine quellgebundene Kooperation: <b>juri@halveth.de</b>. Eine Anfrage benennt bitte Objekt, Zweck, gewünschte Nutzung, Zeitraum, geplante Öffentlichkeit und angebotenen Gegenwert.")]
story += [PageBreak()]

story += section("Primärquellen und Rechtsquellen", "Quellen", 11)
sources = [
    ("National WWI Museum and Memorial", "War Art", "https://www.theworldwar.org/exhibitions/war-art-0"),
    ("Smithsonian National Air and Space Museum", "Painted helmet of the 135th Aero Squadron", "https://airandspace.si.edu/collection-media/NASM-A19970551000-NASM2018-03274"),
    ("United Nations Peacekeeping", "UNEF I background", "https://peacekeeping.un.org/sites/default/files/past/unef1backgr2.html"),
    ("United Nations Peacekeeping", "UN peacekeeper helmet returns to South Lebanon", "https://peacekeeping.un.org/en/news/un-peacekeeper-helmet-returns-to-south-lebanon-40-years-after-the-establishment"),
    ("Batuz Foundation", "Helmets for Peace", "https://batuz.com/batuz_template/main.php?site=latestevents"),
    ("Odesa Regional Administration", "Childhood 2022 installation", "https://ecology.od.gov.ua/2022/08/v-odesi-vidkryto-instalyacziyu-dytynstvo-2022/"),
    ("National Museum of the History of Ukraine in the Second World War", "ArtArmor.Children", "https://warmuseum.kyiv.ua/en/exhibitions/archive/show/artarmor-children-ua"),
    ("UNESCO", "Art for Peace", "https://www.unesco.org/en/weeks/arts-education/art-peace"),
    ("United Nations", "Let Us Beat Swords into Ploughshares", "https://www.un.org/ungifts/let-us-beat-swords-ploughshares"),
    ("International Council of Museums", "ICOM Code of Ethics for Museums", "https://icmemohri.mini.icom.museum/wp-content/uploads/sites/17/2019/01/code_ethics2013_eng2.pdf"),
    ("Bundesministerium der Justiz / Bundesamt für Justiz", "§ 86a StGB", "https://www.gesetze-im-internet.de/stgb/__86a.html"),
    ("Bundesministerium der Justiz / Bundesamt für Justiz", "§ 86 Abs. 4 StGB", "https://www.gesetze-im-internet.de/stgb/__86.html"),
    ("Bundesgerichtshof", "Urteil 3 StR 486/06", "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&amp;Blank=1&amp;Datum=2007-3&amp;Gericht=bgh&amp;file=dokument.pdf&amp;linked=urt&amp;nr=39349"),
    ("Bundesministerium der Justiz / Bundesamt für Justiz", "Urheberrechtsgesetz", "https://www.gesetze-im-internet.de/urhg/"),
    ("Bundesministerium der Justiz / Bundesamt für Justiz", "Designgesetz", "https://www.gesetze-im-internet.de/geschmmg_2004/"),
    ("European Union", "Regulation (EU) 2023/988 on general product safety", "https://eur-lex.europa.eu/eli/reg/2023/988/oj"),
    ("European Union", "Regulation (EU) 2016/425 on personal protective equipment", "https://eur-lex.europa.eu/eli/reg/2016/425/oj"),
]
for index, (publisher, title, url) in enumerate(sources, 1):
    story.append(p(f"<b>{index}. {publisher}.</b> {title}. <link href='{url}' color='#2B7B73'>{url}</link>", SOURCE))
story += [Spacer(1, 3 * mm), p("Quellenstand: 9. September 2026. Die Registerdatei sources.json enthält dieselben URLs als maschinenlesbaren Satz. Verlinkte Inhalte werden nicht vom Repository lizenziert.", BODY_SMALL)]


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.build(story)
print(OUTPUT)
