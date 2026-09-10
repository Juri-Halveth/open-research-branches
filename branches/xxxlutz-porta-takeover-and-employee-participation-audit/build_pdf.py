from __future__ import annotations

import hashlib
import json
import re
from html import escape
from pathlib import Path
from urllib.parse import urlparse

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


BRANCH = Path(__file__).resolve().parent
REPO = BRANCH.parents[1]
OUTPUT = (
    REPO
    / "release-assets"
    / "v0.14.0"
    / "JURI_XXXLUTZ_PORTA_UEBERNAHME_BESCHAEFTIGTENBETEILIGUNG_AUDIT.pdf"
)

README_PATH = BRANCH / "README.md"
SOURCES_PATH = BRANCH / "sources.json"
TIMELINE_PATH = BRANCH / "timeline.json"
CLAIMS_PATH = BRANCH / "claims.json"
PARTICIPATION_PATH = BRANCH / "participation-contract.json"

PAGE_W, PAGE_H = A4
MARGIN_X = 16 * mm
TOP_MARGIN = 19 * mm
BOTTOM_MARGIN = 16 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X

NAVY = HexColor("#14263D")
INK = HexColor("#243246")
CREAM = HexColor("#FBF6EB")
PAPER = HexColor("#FFFDF8")
RUST = HexColor("#B45537")
TEAL = HexColor("#26766D")
GOLD = HexColor("#D5A52F")
PALE_GOLD = HexColor("#F4E7C4")
PALE_TEAL = HexColor("#E4F0EC")
PALE_BLUE = HexColor("#E8EEF5")
PALE_RED = HexColor("#F5E5E1")
MUTED = HexColor("#667286")
GRID = HexColor("#B8C2CD")
WHITE = colors.white

# Stable dates, object ordering and identifiers make repeated builds byte-identical.
rl_config.invariant = 1


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


README = README_PATH.read_text(encoding="utf-8")
SOURCES_DOC = load_json(SOURCES_PATH)
TIMELINE = load_json(TIMELINE_PATH)
CLAIMS = load_json(CLAIMS_PATH)
PARTICIPATION = load_json(PARTICIPATION_PATH)
SOURCES = SOURCES_DOC["sources"]


def validate_inputs() -> None:
    source_ids = [item["id"] for item in SOURCES]
    if len(source_ids) != len(set(source_ids)):
        raise ValueError("sources.json contains duplicate source IDs")
    known = set(source_ids)
    for event in TIMELINE["events"]:
        missing = set(event.get("sourceIds", [])) - known
        if missing:
            raise ValueError(f"timeline source IDs missing: {sorted(missing)}")
    for claim in CLAIMS["claims"]:
        missing = set(claim.get("sourceIds", [])) - known
        if missing:
            raise ValueError(f"claim source IDs missing: {sorted(missing)}")
    missing = set(PARTICIPATION["employeeProposal"].get("legalAnchors", [])) - known
    if missing:
        raise ValueError(f"participation source IDs missing: {sorted(missing)}")
    if TIMELINE.get("asOf") != "2026-09-10":
        raise ValueError("unexpected timeline snapshot date")


validate_inputs()

SOURCE_NUMBER = {item["id"]: index for index, item in enumerate(SOURCES, 1)}
SOURCE_BY_ID = {item["id"]: item for item in SOURCES}

claim_ceiling_match = re.search(
    r"## Claim Ceiling\s+`([^`]+)`", README, flags=re.MULTILINE
)
if not claim_ceiling_match:
    raise ValueError("README.md claim ceiling not found")
CLAIM_CEILING = claim_ceiling_match.group(1)


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
    registered = set(pdfmetrics.getRegisteredFontNames())
    return (
        "Segoe" if "Segoe" in registered else "Helvetica",
        "Segoe-Semibold" if "Segoe-Semibold" in registered else "Helvetica-Bold",
        "Georgia" if "Georgia" in registered else "Times-Roman",
        "Georgia-Bold" if "Georgia-Bold" in registered else "Times-Bold",
    )


SANS, SANS_BOLD, SERIF, SERIF_BOLD = register_fonts()
BASE_STYLES = getSampleStyleSheet()

MASTHEAD = ParagraphStyle(
    "Masthead",
    fontName=SERIF_BOLD,
    fontSize=26,
    leading=29,
    textColor=WHITE,
    alignment=TA_LEFT,
    spaceAfter=7,
)
DECK = ParagraphStyle(
    "Deck",
    fontName=SANS,
    fontSize=12,
    leading=16,
    textColor=PALE_GOLD,
    spaceAfter=8,
)
COVER_QUOTE = ParagraphStyle(
    "CoverQuote",
    fontName=SERIF_BOLD,
    fontSize=16.5,
    leading=22,
    textColor=NAVY,
    alignment=TA_CENTER,
)
H1 = ParagraphStyle(
    "H1",
    fontName=SERIF_BOLD,
    fontSize=20,
    leading=23,
    textColor=NAVY,
    spaceAfter=7,
)
H2 = ParagraphStyle(
    "H2",
    fontName=SANS_BOLD,
    fontSize=11.6,
    leading=14,
    textColor=NAVY,
    spaceBefore=4,
    spaceAfter=4,
)
BODY = ParagraphStyle(
    "Body",
    fontName=SANS,
    fontSize=9.1,
    leading=12.6,
    textColor=INK,
    spaceAfter=5,
)
BODY_TIGHT = ParagraphStyle(
    "BodyTight",
    parent=BODY,
    fontSize=8.3,
    leading=10.8,
    spaceAfter=3,
)
SMALL = ParagraphStyle(
    "Small",
    fontName=SANS,
    fontSize=7.2,
    leading=9.1,
    textColor=INK,
    spaceAfter=2,
)
SOURCE_STYLE = ParagraphStyle(
    "Source",
    fontName=SANS,
    fontSize=6.45,
    leading=8.15,
    textColor=INK,
    spaceAfter=2.3,
)
KICKER = ParagraphStyle(
    "Kicker",
    fontName=SANS_BOLD,
    fontSize=8.1,
    leading=10,
    textColor=RUST,
    spaceAfter=3,
)
CALL = ParagraphStyle(
    "Call",
    fontName=SERIF_BOLD,
    fontSize=13.2,
    leading=18,
    textColor=NAVY,
    alignment=TA_CENTER,
)
ALERT = ParagraphStyle(
    "Alert",
    fontName=SANS_BOLD,
    fontSize=12.4,
    leading=16,
    textColor=WHITE,
    alignment=TA_CENTER,
)
CODE = ParagraphStyle(
    "Code",
    fontName="Courier",
    fontSize=6.7,
    leading=8.9,
    textColor=NAVY,
    borderColor=GRID,
    borderWidth=0.6,
    borderPadding=6,
    backColor=PALE_BLUE,
    wordWrap="CJK",
)
RIGHT_SMALL = ParagraphStyle(
    "RightSmall",
    parent=SMALL,
    alignment=TA_RIGHT,
    textColor=MUTED,
)


def p(text: str, style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, style)


def refs(*source_ids: str) -> str:
    numbers = [SOURCE_NUMBER[source_id] for source_id in source_ids]
    return "".join(f"<super>[{number}]</super>" for number in numbers)


def heading(number: int, kicker: str, title: str) -> list:
    return [
        p(f"{number:02d} · {escape(kicker.upper())}", KICKER),
        p(escape(title), H1),
        Spacer(1, 1.2 * mm),
    ]


def table(
    rows: list[list[str]],
    widths: list[float],
    *,
    header: bool = True,
    small: bool = False,
    accent: HexColor = NAVY,
    body_fill=None,
) -> Table:
    cell_style = SMALL if small else BODY_TIGHT
    header_style = ParagraphStyle(
        f"TH-{len(rows)}-{sum(int(width) for width in widths)}",
        parent=cell_style,
        fontName=SANS_BOLD,
        textColor=WHITE,
    )
    rendered = []
    for row_index, row in enumerate(rows):
        rendered.append(
            [
                p(str(cell), header_style if header and row_index == 0 else cell_style)
                for cell in row
            ]
        )
    result = Table(
        rendered,
        colWidths=widths,
        repeatRows=1 if header else 0,
        hAlign="LEFT",
    )
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), accent),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ]
        )
    for row_index in range(1 if header else 0, len(rows)):
        if body_fill is not None:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), body_fill))
        elif row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_BLUE))
    result.setStyle(TableStyle(commands))
    return result


def panel(
    content: list,
    *,
    fill=PALE_BLUE,
    border=GRID,
    padding=8,
) -> Table:
    result = Table([[content]], colWidths=[CONTENT_W])
    result.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.65, border),
                ("LEFTPADDING", (0, 0), (-1, -1), padding),
                ("RIGHTPADDING", (0, 0), (-1, -1), padding),
                ("TOPPADDING", (0, 0), (-1, -1), padding),
                ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
            ]
        )
    )
    return result


def two_columns(left: list, right: list, gap: float = 6 * mm) -> Table:
    width = (CONTENT_W - gap) / 2
    result = Table([[left, right]], colWidths=[width, width], hAlign="LEFT")
    result.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), gap / 2),
                ("LEFTPADDING", (1, 0), (1, 0), gap / 2),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("LINEBEFORE", (1, 0), (1, 0), 0.35, GRID),
            ]
        )
    )
    return result


def evidence_box(source_ids: list[str]) -> Table:
    lines = [p("BELEGE DIESER SEITE", KICKER)]
    for source_id in source_ids:
        item = SOURCE_BY_ID[source_id]
        number = SOURCE_NUMBER[source_id]
        lines.append(
            p(
                f"<b>[{number}]</b> {escape(item['title'])} · "
                f"<font color='#667286'>{escape(item['evidenceState'])}</font>",
                SMALL,
            )
        )
    return panel(lines, fill=PAPER, border=GRID, padding=6)


def file_receipt(path: Path) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return f"{path.name}: {digest}"


def page_chrome(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 12.5 * mm, PAGE_W, 12.5 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 13.3 * mm, PAGE_W, 0.8 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont(SANS_BOLD, 7.3)
    canvas.drawString(
        MARGIN_X,
        PAGE_H - 8.2 * mm,
        "JURI · XXXLUTZ / PORTA · ÖFFENTLICHER BESCHÄFTIGTENAUDIT",
    )
    canvas.setFillColor(NAVY)
    canvas.setFont(SANS, 7.1)
    canvas.drawString(MARGIN_X, 8.3 * mm, "Stand 10. September 2026 · juri@halveth.de")
    canvas.drawRightString(PAGE_W - MARGIN_X, 8.3 * mm, str(doc.page))
    canvas.restoreState()


def cover_chrome(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(RUST)
    canvas.rect(0, PAGE_H - 7 * mm, PAGE_W, 7 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.circle(PAGE_W - 16 * mm, PAGE_H - 22 * mm, 33 * mm, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.circle(PAGE_W - 16 * mm, PAGE_H - 22 * mm, 27.5 * mm, fill=1, stroke=0)
    canvas.setFillColor(PALE_GOLD)
    canvas.setFont(SANS_BOLD, 8)
    canvas.drawString(MARGIN_X, 13 * mm, "Juri Janovski · Öffentliche Lesefassung · v0.14.0")
    canvas.drawRightString(PAGE_W - MARGIN_X, 13 * mm, "juri@halveth.de")
    canvas.restoreState()


DOC = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=MARGIN_X,
    rightMargin=MARGIN_X,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title="XXXLutz, porta und die Beschäftigten",
    author="Juri Janovski",
    subject="Öffentlicher Übernahme-, Rechte- und Beteiligungsaudit",
    keywords="XXXLutz, porta, M.11895, Beschäftigte, Betriebsrat, Beteiligung",
)


story: list = []

# 1 · COVER
story.extend(
    [
        Spacer(1, 16 * mm),
        p("XXXLUTZ, PORTA<br/>UND DIE BESCHÄFTIGTEN", MASTHEAD),
        p(
            "Öffentlicher Übernahme-, Rechte- und Beteiligungsaudit · EU-Fälle M.11895 und M.11895.AP",
            DECK,
        ),
        Spacer(1, 10 * mm),
        panel(
            [
                p("DER KERNBEFUND", KICKER),
                p(
                    "Die Übernahme ist angekündigt und angemeldet. Am 10. September 2026 läuft Phase I. "
                    "Eine Freigabe, ein Vollzug oder Kontrollübergang sind im geprüften öffentlichen Quellensatz noch nicht gebunden.",
                    COVER_QUOTE,
                ),
            ],
            fill=PALE_GOLD,
            border=GOLD,
            padding=12,
        ),
        Spacer(1, 10 * mm),
        p(
            "Eine Transaktion betrifft zunächst Anteile und Kontrolle; sie kann Kapital, Standorte, Daten und Prozesse berühren. Sie setzt den Wert eines Menschen weder fest noch außer Kraft. Dieser Audit trennt deshalb Menschenwürde, bestehende Rechte, konkrete wirtschaftliche Nachteile, geschützte Beiträge und freiwillig verhandelbare Beteiligung.",
            ParagraphStyle(
                "CoverBody",
                parent=BODY,
                fontSize=10.8,
                leading=15.5,
                textColor=WHITE,
            ),
        ),
        Spacer(1, 7 * mm),
        table(
            [
                ["Status", "Öffentlicher Stand 10.09.2026"],
                ["Ankündigung", "OBSERVED"],
                ["Anmeldung", "OBSERVED · 07.09.2026"],
                ["Phase I", "ONGOING · Frist vorläufig 12.10.2026"],
                ["Freigabe / Vollzug", "NOT_PROVEN"],
                ["Gun-Jumping-Verstoß", "NOT_PROVEN · formelle Untersuchung läuft"],
            ],
            [55 * mm, 115 * mm],
            small=True,
            accent=RUST,
            body_fill=PAPER,
        ),
        Spacer(1, 6 * mm),
        p(
            "Öffentliche Forschungshilfe für Selbstvertretung und kollektive Diskussion · keine Vertretung anderer Personen · kein garantiertes Ergebnis",
            ParagraphStyle(
                "CoverNote",
                parent=SMALL,
                fontSize=7.6,
                leading=10,
                textColor=PALE_GOLD,
                alignment=TA_CENTER,
            ),
        ),
        PageBreak(),
    ]
)

# 2 · STATUS
story.extend(heading(1, "Nachrichtenlage", "Was tatsächlich feststeht"))
story.extend(
    [
        two_columns(
            [
                p("Die Transaktion ist kein Gerücht", H2),
                p(
                    "XXXLutz veröffentlichte am 7. Januar 2025 die Vereinbarung zur Übernahme der porta-Gruppe mit rund 140 Standorten in Deutschland, Tschechien und der Slowakei. Genannt wurden porta, Möbel BOSS, ASKO und Möbel Letz. Der Kaufpreis blieb vertraulich; der Verkauf wurde ausdrücklich unter den Vorbehalt der kartellrechtlichen Zustimmung gestellt."
                    + refs("S01_XXXLUTZ_ANNOUNCEMENT")
                ),
                p("Zwei Verfahren, zwei Fragen", H2),
                p(
                    "Am 10. Juli 2026 eröffnete die Europäische Kommission ein separates formelles Verfahren wegen eines möglichen Verstoßes gegen das Vollzugsverbot. Die Eröffnung nimmt das Ergebnis ausdrücklich nicht vorweg."
                    + refs("S02_EC_GUN_JUMPING_2026", "S04_EC_CASE_M11895_AP")
                ),
            ],
            [
                p("Seit September förmlich angemeldet", H2),
                p(
                    "Seit dem 7. September 2026 führt das EU-Fallregister M.11895 als laufendes Phase-I-Verfahren. Die vorläufige Entscheidungsfrist ist der 12. Oktober 2026. Am Stichtag war keine Entscheidung eingetragen."
                    + refs("S03_EC_CASE_M11895")
                ),
                p(
                    "Die am 9. September veröffentlichte Beschreibung der Anmelder bezeichnet den Vorgang als geplanten Zusammenschluss, durch den XXXLutz die alleinige Kontrolle über die porta-Gruppe erwerben will."
                    + refs("S05_EC_M11895_NOTICE")
                ),
                p(
                    "Anmeldung, Freigabe, Vollzug oder Kontrollübergang und ein möglicher Verstoß bleiben deshalb als getrennte Statusachsen sichtbar.",
                    BODY,
                ),
            ],
        ),
        Spacer(1, 4 * mm),
        table(
            [
                ["Prüfachse", "Stand", "Bedeutung"],
                ["Öffentliche Ankündigung", "OBSERVED", "Parteien haben die Vereinbarung veröffentlicht."],
                ["Förmliche Anmeldung", "OBSERVED", "M.11895 läuft seit 07.09.2026."],
                ["Fusionsfreigabe", "NOT_PROVEN", "Keine Entscheidung im geprüften Registerstand."],
                ["Vollzug / Kontrollübergang", "NOT_PROVEN", "Kein gebundener Closing- oder Kontrollbeleg."],
                ["Formelle AP-Untersuchung", "OBSERVED", "Möglicher vorzeitiger Vollzug wird getrennt geprüft."],
                ["Festgestellter Verstoß", "UNKNOWN", "Untersuchung ist keine Feststellung."],
            ],
            [54 * mm, 34 * mm, 82 * mm],
            small=True,
        ),
        Spacer(1, 3 * mm),
        evidence_box(
            [
                "S01_XXXLUTZ_ANNOUNCEMENT",
                "S02_EC_GUN_JUMPING_2026",
                "S03_EC_CASE_M11895",
                "S04_EC_CASE_M11895_AP",
                "S05_EC_M11895_NOTICE",
            ]
        ),
        PageBreak(),
    ]
)

# 3 · TIMELINE AND NRW
story.extend(heading(2, "Reichweite", "Zeitachse und Nordrhein-Westfalen"))
timeline_rows = [["Datum", "Ereignis", "Status"]]
timeline_labels = {
    "2025-01-07": "Übernahmevereinbarung öffentlich angekündigt; kartellrechtliche Zustimmung vorbehalten.",
    "2026-07-10": "Formelle Untersuchung eines möglichen Gun Jumping eröffnet; Ausgang offen.",
    "2026-09-07": "M.11895 förmlich angemeldet; Phase I und vorläufige Frist 12.10.2026.",
    "2026-09-09": "Parteienbeschreibung zum beabsichtigten Erwerb alleiniger Kontrolle veröffentlicht.",
    "2026-09-10": "Keine Freigabe, kein Vollzug und kein Kontrollübergang im Quellensatz gebunden.",
}
for event in TIMELINE["events"]:
    timeline_rows.append(
        [event["date"], timeline_labels.get(event["date"], escape(event["event"])), event["status"]]
    )
story.extend(
    [
        table(timeline_rows, [27 * mm, 108 * mm, 35 * mm], small=True, accent=TEAL),
        Spacer(1, 4 * mm),
        two_columns(
            [
                p("Neun porta-Häuser in NRW", H2),
                p(
                    "Aachen, Bergheim, Bielefeld, Bornheim, Frechen, Gütersloh, Köln-Gremberghoven, Köln-Lind und Porta Westfalica-Barkhausen."
                    + refs("S09_PORTA_STORES")
                ),
                p("Vierzehn Möbel-BOSS-Märkte in NRW", H2),
                p(
                    "Bielefeld, Bornheim, Castrop-Rauxel, Detmold, Frechen, Gütersloh, Hilden, Köln-Lind, Lippstadt, Minden, Moers, Rheine, Solingen und Viersen."
                    + refs("S10_BOSS_STORES")
                ),
            ],
            [
                p("Verwaltung und Logistik", H2),
                p(
                    "Die Zentralverwaltung befindet sich in Porta Westfalica. Als NRW-Logistikstandorte nennt porta Porta Westfalica und Frechen. Gruppenweit beschreibt porta rund 1.100 Vollzeitkräfte in vier Logistikzentren."
                    + refs("S11_PORTA_CONTACT", "S12_PORTA_LOGISTICS")
                ),
                p("Beschäftigtenzahl NRW bleibt offen", H2),
                p(
                    "porta nennt für die Gruppe ungefähr 6.000 Beschäftigte. Eine belastbare Zahl ausschließlich für Nordrhein-Westfalen wurde im geprüften öffentlichen Quellensatz nicht gefunden und bleibt <b>UNKNOWN</b>."
                    + refs("S08_PORTA_GROUP")
                ),
            ],
        ),
        Spacer(1, 4 * mm),
        evidence_box(
            [
                "S03_EC_CASE_M11895",
                "S05_EC_M11895_NOTICE",
                "S08_PORTA_GROUP",
                "S09_PORTA_STORES",
                "S10_BOSS_STORES",
                "S11_PORTA_CONTACT",
                "S12_PORTA_LOGISTICS",
            ]
        ),
        PageBreak(),
    ]
)

# 4 · SHARE DEAL / TRANSFER
story.extend(heading(3, "Arbeitsverhältnis", "Share Deal ist nicht automatisch Betriebsübergang"))
story.extend(
    [
        panel(
            [
                p("DIE ENTSCHEIDENDE TRENNUNG", KICKER),
                p(
                    "Wer die Anteile an einer Gesellschaft erwirbt, wechselt nicht allein dadurch den Arbeitgeber ihrer Beschäftigten. § 613a BGB wird relevant, wenn ein Betrieb oder Betriebsteil auf einen anderen Inhaber übergeht.",
                    CALL,
                ),
            ],
            fill=PALE_GOLD,
            border=GOLD,
            padding=9,
        ),
        Spacer(1, 4 * mm),
        table(
            [
                ["Konstellation", "Prüffolge für Beschäftigte"],
                [
                    "Reiner Anteilskauf / Share Deal",
                    "Arbeitgebergesellschaft bleibt grundsätzlich dieselbe. Der Gesellschafterwechsel allein genügt nach der BAG-Rechtsprechung nicht für § 613a BGB."
                    + refs("S16_BAG_8_AZR_91_15"),
                ],
                [
                    "Betrieb oder Betriebsteil wechselt Inhaber",
                    "Der neue Inhaber tritt in bestehende Arbeitsverhältnisse ein; eine Kündigung gerade wegen des Übergangs ist unwirksam."
                    + refs("S15_BGB_613A"),
                ],
                [
                    "Unterrichtung vor Übergang",
                    "Textform zu Zeitpunkt, Grund, rechtlichen/wirtschaftlichen/sozialen Folgen und geplanten Maßnahmen."
                    + refs("S15_BGB_613A"),
                ],
                [
                    "Widerspruch",
                    "Grundsätzlich binnen eines Monats nach ordnungsgemäßer Unterrichtung. Vorher Folgen beim bisherigen Arbeitgeber prüfen."
                    + refs("S15_BGB_613A"),
                ],
            ],
            [59 * mm, 111 * mm],
            small=True,
            accent=RUST,
        ),
        Spacer(1, 4 * mm),
        two_columns(
            [
                p("Acht konkrete Fragen", H2),
                p("1. Welche juristische Person steht heute und nach Vollzug im Arbeitsvertrag?", BODY_TIGHT),
                p("2. Werden Anteile, Betriebe, Betriebsteile, Vermögenswerte oder Personal übertragen?", BODY_TIGHT),
                p("3. Welcher Genehmigungs- und Closing-Stand liegt vor?", BODY_TIGHT),
                p("4. Welche Standorte, Stellen und Funktionen sollen sich ändern?", BODY_TIGHT),
            ],
            [
                p("Fortsetzung", H2),
                p("5. Welche Vergütungs-, Arbeitszeit- oder Bonussysteme sind betroffen?", BODY_TIGHT),
                p("6. Welche Beschäftigtendaten werden an wen übermittelt?", BODY_TIGHT),
                p("7. Welche Tarifverträge, Betriebsvereinbarungen und Betriebsrenten gelten weiter?", BODY_TIGHT),
                p("8. Welche Zusagen sind verbindlich, wie lange, und wer kann sie durchsetzen?", BODY_TIGHT),
            ],
        ),
        Spacer(1, 4 * mm),
        evidence_box(["S15_BGB_613A", "S16_BAG_8_AZR_91_15"]),
        PageBreak(),
    ]
)

# 5 · INFORMATION AND CONSULTATION
story.extend(heading(4, "Mitbestimmung", "Information muss vor vollendeten Tatsachen kommen"))
story.extend(
    [
        p(
            "In Unternehmen mit regelmäßig mehr als 100 ständig Beschäftigten ist ein Wirtschaftsausschuss zu bilden. Zu den wirtschaftlichen Angelegenheiten gehören die Übernahme, der Kontrollwechsel sowie wirtschaftliche und personelle Folgen. § 106 BetrVG verlangt rechtzeitige und umfassende Information und Beratung; insbesondere sind der mögliche Erwerber, seine Absichten und die Auswirkungen auf Arbeitnehmer anzugeben."
            + refs("S17_BETRVG_106")
        ),
        p(
            "Besteht kein Wirtschaftsausschuss, sieht § 109a BetrVG für eine Unternehmensübernahme eine entsprechende Information des Betriebsrats vor."
            + refs("S18_BETRVG_109A")
        ),
        Spacer(1, 3 * mm),
        table(
            [
                ["Prüffeld", "Was schriftlich gebunden werden sollte"],
                ["Transaktion", "Erwerber, Struktur, Genehmigungen, Closing-Bedingungen, geplanter Zeitablauf"],
                ["Beschäftigung", "Stellen, Standorte, Funktionen, Qualifizierung, Versetzungen, Abbauplanung"],
                ["Vergütung", "Tarif, Eingruppierung, Bonus, Arbeitszeit, Altersversorgung, Zielsysteme"],
                ["Daten und Technik", "Datenflüsse, neue Plattformen, Tracking, Kamera, Leistungsbewertung, Zugriffsrollen"],
                ["Bindungswirkung", "Laufzeit, Durchsetzbarkeit, Berichtspflicht und Folgen einer Abweichung"],
            ],
            [47 * mm, 123 * mm],
            small=True,
            accent=TEAL,
        ),
        Spacer(1, 4 * mm),
        two_columns(
            [
                p("Individuelle Beschwerde", H2),
                p(
                    "Beschäftigte dürfen sich beschweren, wenn sie sich benachteiligt, ungerecht behandelt oder beeinträchtigt sehen. Wegen der Beschwerde dürfen keine Nachteile entstehen."
                    + refs("S24_BETRVG_84")
                ),
                p("Vorschlag aus der Belegschaft", H2),
                p(
                    "Nach § 86a BetrVG können Arbeitnehmer Themen vorschlagen. Unterstützen fünf Prozent der Arbeitnehmer den Vorschlag, muss der Betriebsrat ihn binnen zwei Monaten auf die Tagesordnung setzen."
                    + refs("S25_BETRVG_86A")
                ),
            ],
            [
                p("Beschäftigung sichern", H2),
                p(
                    "§ 92a BetrVG eröffnet dem Betriebsrat Vorschläge zur Sicherung und Förderung der Beschäftigung. Der Arbeitgeber muss sie beraten und eine Ablehnung in Betrieben mit mehr als 100 Arbeitnehmern schriftlich begründen."
                    + refs("S26_BETRVG_92A")
                ),
                p("Verhandelbare Ergänzung", H2),
                p(
                    "Freiwillige Betriebsvereinbarungen können zusätzliche Themen tragen. Veröffentlichung allein macht einen Vorschlag noch nicht zum Vertrag."
                    + refs("S27_BETRVG_88")
                ),
            ],
        ),
        Spacer(1, 3 * mm),
        evidence_box(
            [
                "S17_BETRVG_106",
                "S18_BETRVG_109A",
                "S24_BETRVG_84",
                "S25_BETRVG_86A",
                "S26_BETRVG_92A",
                "S27_BETRVG_88",
            ]
        ),
        PageBreak(),
    ]
)

# 6 · OPERATIONAL CHANGES AND DEADLINE
story.extend(heading(5, "Schutzwege", "Betriebsänderung, Sozialplan und Kündigung"))
story.extend(
    [
        p(
            "Der Unternehmenskauf allein löst nicht automatisch einen Sozialplan aus. In Unternehmen mit in der Regel mehr als zwanzig wahlberechtigten Arbeitnehmern gilt: Plant das Unternehmen etwa Stilllegung, Verlagerung, Zusammenlegung, Spaltung oder eine grundlegende Änderung von Organisation, Arbeitsmethoden oder Anlagen mit möglichen wesentlichen Nachteilen, verlangt § 111 BetrVG rechtzeitige und umfassende Unterrichtung und Beratung."
            + refs("S19_BETRVG_111")
        ),
        table(
            [
                ["Instrument", "Funktion", "Keine automatische Folge"],
                ["Interessenausgleich", "Regelt das Ob, Wann und Wie einer geplanten Betriebsänderung.", "Kein pauschaler Kaufpreisanteil."],
                ["Sozialplan", "Gleicht oder mildert wirtschaftliche Nachteile.", "Nicht schon durch die Ankündigung ausgelöst."],
                ["Nachteilsausgleich", "Kann bei bestimmten Abweichungen oder fehlendem Einigungsversuch greifen.", "Keine allgemeine Abfindungsgarantie."],
            ],
            [46 * mm, 74 * mm, 50 * mm],
            small=True,
            accent=RUST,
        ),
        Spacer(1, 5 * mm),
        panel(
            [
                p("WENN EINE SCHRIFTLICHE KÜNDIGUNG ZUGEHT", KICKER),
                p(
                    "ZUGANGSDATUM SICHERN · GRUNDSÄTZLICH DREI WOCHEN FÜR DIE KÜNDIGUNGSSCHUTZKLAGE",
                    ALERT,
                ),
                Spacer(1, 2 * mm),
                p(
                    "Weitere Übernahme-, Beteiligungs- oder Beweisfragen dürfen diese Frist nicht verdrängen. Der Betriebsrat ist vor jeder Kündigung anzuhören; eine Kündigung ohne Anhörung ist unwirksam."
                    + refs("S28_KSCHG_4", "S23_BETRVG_102"),
                    ParagraphStyle(
                        "AlertBody",
                        parent=BODY_TIGHT,
                        textColor=WHITE,
                        alignment=TA_CENTER,
                    ),
                ),
            ],
            fill=RUST,
            border=RUST,
            padding=10,
        ),
        Spacer(1, 5 * mm),
        p("Aussagen zu Beschäftigung sind noch keine Garantie", H2),
        p(
            "Sekundärberichte geben Unternehmensäußerungen wieder, nach denen Arbeitsverträge unverändert bleiben sollten, Kündigungen damals nicht geplant gewesen seien und grundsätzlich keine Änderung der Filialstruktur geplant gewesen sei. Das sind zugerechnete Absichtserklärungen aus Januar 2025, keine quantifizierte und durchsetzbare Langzeitgarantie."
            + refs("S33_HANDELSBLATT_DPA_EMPLOYEE_INTENTIONS", "S34_TONLINE_EMPLOYEE_INTENTIONS")
        ),
        evidence_box(
            [
                "S19_BETRVG_111",
                "S20_BETRVG_112",
                "S21_BETRVG_113",
                "S23_BETRVG_102",
                "S28_KSCHG_4",
                "S33_HANDELSBLATT_DPA_EMPLOYEE_INTENTIONS",
                "S34_TONLINE_EMPLOYEE_INTENTIONS",
            ]
        ),
        PageBreak(),
    ]
)

# 7 · DATA, SYSTEMS AND VALUE
story.extend(heading(6, "Systemwechsel", "Daten, Überwachung und menschlicher Gegenwert"))
story.extend(
    [
        two_columns(
            [
                p("Beschäftigtendaten sind kein frei handelbares Inventar", H2),
                p(
                    "§ 26 BDSG bindet die Verarbeitung von Beschäftigtendaten an Erforderlichkeit oder eine andere tragfähige Rechtsgrundlage. Bei Einwilligungen ist die Abhängigkeit im Beschäftigungsverhältnis zu berücksichtigen; Zweck und Widerrufsrecht müssen erklärt werden."
                    + refs("S29_BDSG_26")
                ),
                p("Mitbestimmung bei Technik", H2),
                p(
                    "Technische Einrichtungen zur Verhaltens- oder Leistungskontrolle sowie Änderungen an Arbeitszeit, Entlohnungsgrundsätzen oder Gesundheitsschutz können Mitbestimmung nach § 87 BetrVG auslösen."
                    + refs("S22_BETRVG_87")
                ),
            ],
            [
                p("Menschenwürde ist unbepreist", H2),
                p(
                    "Artikel 1 GG bindet die staatliche Gewalt unmittelbar. Im Privatrecht wirken Grundrechte über die Auslegung des einfachen Rechts ein. Daraus entsteht jedoch nicht automatisch eine bezifferte Forderung gegen einen privaten Arbeitgeber."
                    + refs("S13_GG_1", "S14_BVERFG_THIRD_PARTY_EFFECT")
                ),
                p(
                    "Der Audit lässt den Menschenwert offen und prüft Zahlungs-, Beteiligungs- und Übertragungsfragen auf getrennten, konkreten Wertspuren.",
                    BODY,
                ),
            ],
        ),
        Spacer(1, 4 * mm),
        table(
            [
                ["Wertspur", "Prüfgegenstand"],
                ["Menschenwürde", "Respekt, Gleichbehandlung, Gesundheit, sichere Behandlung; kein Verkaufspreis einer Person"],
                ["Lohn und Leistungen", "Vertrag, Tarif, Eingruppierung, Arbeitszeit, Bonus, Altersversorgung"],
                ["Konkreter Nachteil", "Maßnahme, betroffene Person, Kausalität, Betrag und passende Abhilfe"],
                ["Geschützter Beitrag", "Artefakt, Datum, Urheber/Erfinder, Auftrag, Rechtezuordnung, Nutzung, Wert"],
                ["Freiwillige Beteiligung", "Mitarbeiterkapital, virtuelle Beteiligung, Gewinnbeteiligung, Bonus oder Fonds"],
                ["Künftige Zusammenarbeit", "Neuer Auftrag mit Scope, Abnahme, Vergütung und Rechten"],
            ],
            [52 * mm, 118 * mm],
            small=True,
            accent=TEAL,
        ),
        Spacer(1, 3 * mm),
        evidence_box(
            [
                "S13_GG_1",
                "S14_BVERFG_THIRD_PARTY_EFFECT",
                "S22_BETRVG_87",
                "S29_BDSG_26",
            ]
        ),
        PageBreak(),
    ]
)

# 8 · IP AND PARTICIPATION COMPACT
story.extend(heading(7, "Friedensangebot", "Belegte Beiträge prüfen, Beteiligung verhandeln"))
story.extend(
    [
        two_columns(
            [
                p("Erfindungen", H2),
                p(
                    "Für eine rechtlich passende, in Anspruch genommene Diensterfindung kann § 9 ArbnErfG einen Anspruch auf angemessene Vergütung eröffnen. Maßgeblich sind unter anderem wirtschaftliche Verwertbarkeit, Aufgabe und Stellung im Betrieb sowie der betriebliche Anteil."
                    + refs("S30_ARBNERFG_9")
                ),
                p("Software", H2),
                p(
                    "Das Urheberrecht schützt die Ausdrucksform eines Programms, nicht Ideen und Grundsätze als solche. Bei Programmen aus arbeitsvertraglichen Aufgaben stehen die wirtschaftlichen Rechte grundsätzlich dem Arbeitgeber zu, wenn nichts anderes vereinbart ist."
                    + refs("S31_URHG_69A", "S32_URHG_69B")
                ),
            ],
            [
                p("Prüfmatrix je Beitrag", H2),
                p("• exaktes Artefakt und Version", BODY_TIGHT),
                p("• Entstehungsdatum und unveränderte Quelldatei", BODY_TIGHT),
                p("• eigener technischer oder schöpferischer Anteil", BODY_TIGHT),
                p("• Mitwirkende, Auftrag und Rechtezuordnung", BODY_TIGHT),
                p("• Lizenz, Übergabe und tatsächliche Nutzung", BODY_TIGHT),
                p("• wirtschaftlicher Vorteil und passender Rechtsweg", BODY_TIGHT),
            ],
        ),
        Spacer(1, 3 * mm),
        p("Vorschlag: Porta-Beteiligungs- und Beschäftigungssicherungspakt", H2),
        table(
            [
                ["Baustein", "Verhandelbarer Inhalt"],
                ["Sicherung", "Befristete, durchsetzbare Standort- und Beschäftigungssicherung"],
                ["Transparenz", "Integrationsmeilensteine und Beschäftigten-Folgenberichte"],
                ["Vorrang", "Qualifizierung, Versetzung und interne Stellenangebote vor Personalabbau"],
                ["Beteiligung", "Gewinn- oder Transaktionserfolgsbeteiligung; freiwillige Kapitaloption"],
                ["Systemschutz", "Regeln für Daten, Überwachung, Zielvorgaben und neue IT"],
                ["Beitragspfad", "Getrennte Prüfung belegter Erfindungen, Software- und Kreativbeiträge"],
                ["Zukunft", "Vergütete Audit-, Forschungs- oder Innovationsarbeit mit schriftlichem Scope"],
            ],
            [45 * mm, 125 * mm],
            small=True,
            accent=RUST,
        ),
        p(
            "Der Pakt ist ein verhandlungsfähiges Angebot. Er wird erst wirksam, wenn die zuständigen Parteien ihn freiwillig und verbindlich vereinbaren.",
            BODY_TIGHT,
        ),
        evidence_box(
            [
                "S25_BETRVG_86A",
                "S26_BETRVG_92A",
                "S27_BETRVG_88",
                "S30_ARBNERFG_9",
                "S31_URHG_69A",
                "S32_URHG_69B",
            ]
        ),
        PageBreak(),
    ]
)

# 9 · SELF-REPRESENTATION AND RACHEL
story.extend(heading(8, "Selbstvertretung", "Akte, Vorschlag und öffentliche Referenzrolle"))
story.extend(
    [
        two_columns(
            [
                p("Private Beweisakte", H2),
                p("• Arbeitgebergesellschaft auf Vertrag und Abrechnung", BODY_TIGHT),
                p("• Arbeitsvertrag, Änderungen, Stellenbeschreibung, Eingruppierung", BODY_TIGHT),
                p("• Tarifverträge und Betriebsvereinbarungen", BODY_TIGHT),
                p("• schriftliche Übernahmeinformationen", BODY_TIGHT),
                p("• Änderungen an Ort, Tätigkeit, Zeit, Lohn, Bonus oder Technik", BODY_TIGHT),
                p("• Schreiben samt Zugangsdatum und Umschlag", BODY_TIGHT),
                p("• sachliche Gedächtnisnotizen und konkrete Nachteile", BODY_TIGHT),
                p("• eigene Beiträge als unveränderte Dateien mit Zeitbelegen", BODY_TIGHT),
            ],
            [
                p("Vorschlag, Klage, Aufhebungsvertrag", H2),
                p(
                    "Im hier geprüften arbeitsrechtlichen Kontext wurde keine eigenständige Klageart ‚Vorschlagsklage‘ identifiziert. Ein Vorschlag läuft über Betriebsrat, Wirtschaftsausschuss, Tarifparteien, Vertrag oder freiwillige Betriebsvereinbarung. Eine Klage benötigt Anspruch, Gegner, Tatsachen, Belege und Antrag.",
                    BODY_TIGHT,
                ),
                p(
                    "Ein Aufhebungsvertrag soll ein konkretes Arbeitsverhältnis einvernehmlich beenden. Er kann Abfindung, Freistellung, Restlohn, Urlaub, Bonus, Zeugnis, Altersversorgung, Beitragsrechte und Ausgleichsklauseln regeln. Vor Unterzeichnung sind Formwirksamkeit, mögliche Arbeitslosengeldfolgen und Rechtsverzicht jeweils konkret zu prüfen.",
                    BODY_TIGHT,
                ),
                p(
                    "Die öffentliche Ablage enthält keine Personalakten, Gesundheitsdaten, privaten Chats oder Geschäftsgeheimnisse.",
                    BODY_TIGHT,
                ),
            ],
        ),
        Spacer(1, 3 * mm),
        p("Gericht, Vertretung und Kosten", H2),
        table(
            [
                ["Prüffeld", "Gebundener Ausgangspunkt"],
                [
                    "Zuständigkeit",
                    "Individuelle Streitigkeiten aus einem Arbeitsverhältnis gehören grundsätzlich vor die Arbeitsgerichte."
                    + refs("S35_ARBGG_2"),
                ],
                [
                    "Vertretung",
                    "In erster Instanz können Parteien selbst führen; in höheren Instanzen gelten besondere Vertretungsregeln."
                    + refs("S36_ARBGG_11"),
                ],
                [
                    "Anwaltskosten",
                    "In der ersten arbeitsgerichtlichen Instanz sind eigene Anwaltskosten grundsätzlich nicht von der Gegenseite zu erstatten."
                    + refs("S37_ARBGG_12A"),
                ],
                [
                    "Unterstützung",
                    "Prozesskostenhilfe richtet sich nach wirtschaftlichen Verhältnissen und Erfolgsaussicht; außergerichtlich kann Beratungshilfe in Betracht kommen."
                    + refs("S38_ARBGG_11A", "S39_BERHG_1"),
                ],
            ],
            [38 * mm, 132 * mm],
            small=True,
            accent=NAVY,
        ),
        Spacer(1, 4 * mm),
        panel(
            [
                p("ÖFFENTLICHE REFERENZROLLE RACHEL", KICKER),
                p(
                    "RACHEL wird hier ausschließlich als von Juri vorgeschlagene öffentliche Referenzrolle verwendet: Sie hält Quellfassung, Korrektur und offene Gegenlesart gemeinsam sichtbar. Daraus folgt keine Behauptung, dass eine private Person namens Rachel Eigentümerin, Beteiligte, Vertreterin oder Zustimmende dieses Audits ist.",
                    CALL,
                ),
                Spacer(1, 2 * mm),
                p(
                    "Die Rolle fragt: Was wurde tatsächlich gesagt? Welche Beschäftigtenperspektive fehlt? Welche Alternative bleibt offen? Wer besitzt Zustimmung und Zuständigkeit für die nächste reale Handlung?",
                    BODY_TIGHT,
                ),
            ],
            fill=PALE_TEAL,
            border=TEAL,
            padding=10,
        ),
        Spacer(1, 5 * mm),
        p(
            "Kontakt für eine konkrete, freiwillige und quellengebundene Zusammenarbeit: <b>Juri Janovski · juri@halveth.de</b>.",
            ParagraphStyle("Contact", parent=CALL, fontSize=12, leading=16),
        ),
        PageBreak(),
    ]
)

# 10 · CLAIMS AND RECEIPTS
story.extend(heading(9, "Beweisgrenze", "Was der Audit trägt – und was offen bleibt"))
claim_text = {
    "C01_TRANSACTION_REAL": "Ein real angekündigtes und angemeldetes XXXLutz-porta-Erwerbsprojekt besteht.",
    "C02_CLEARANCE": "Die Europäische Kommission hat die Transaktion freigegeben.",
    "C03_CLOSING_OR_CONTROL_TRANSFER": "Der Erwerb ist vollzogen oder Kontrolle übertragen.",
    "C04_GUN_JUMPING_BREACH": "Ein Gun-Jumping-Verstoß wurde begangen und festgestellt.",
    "C05_JOB_GUARANTEE": "Alle Stellen, Verträge und Standorte sind langfristig verbindlich garantiert.",
    "C06_AUTOMATIC_TRANSFER": "Jedes Arbeitsverhältnis wechselt allein wegen des Anteilserwerbs automatisch nach § 613a BGB.",
    "C07_AUTOMATIC_PARTICIPATION": "Jeder Beschäftigte erhält automatisch Eigentum, Anteile oder eine unbegrenzte Auszahlung.",
    "C08_NEGOTIABLE_VALUE": "Beschäftigte und Vertretungen können konkrete freiwillige Sicherungs- und Beteiligungsvorschläge formulieren.",
}
claim_rows = [["Claim", "Prüfstand"]]
for claim in CLAIMS["claims"]:
    statement = claim_text.get(claim["claimId"], claim["statement"])
    claim_rows.append([statement, claim["status"]])
story.extend(
    [
        table(claim_rows, [132 * mm, 38 * mm], small=True, accent=NAVY),
        Spacer(1, 4 * mm),
        p("Öffentliche Claim Ceiling", H2),
        p(escape(CLAIM_CEILING), CODE),
        Spacer(1, 4 * mm),
        two_columns(
            [
                p("Statuslegende", H2),
                p("<b>OBSERVED</b> · in der gebundenen Quelle direkt beobachtet", BODY_TIGHT),
                p("<b>STRONGLY_SUPPORTED</b> · stark gestützt, aber nicht gleicher Belegtyp wie Primärfeststellung", BODY_TIGHT),
                p("<b>UNKNOWN</b> · Verbindung oder Ergebnis bleibt offen", BODY_TIGHT),
                p("<b>NOT_PROVEN</b> · aktueller Beleg trägt die Behauptung nicht", BODY_TIGHT),
            ],
            [
                p("Quell-Receipts", H2),
                p(escape(file_receipt(README_PATH)), SMALL),
                p(escape(file_receipt(SOURCES_PATH)), SMALL),
                p(escape(file_receipt(TIMELINE_PATH)), SMALL),
                p(escape(file_receipt(CLAIMS_PATH)), SMALL),
                p(escape(file_receipt(PARTICIPATION_PATH)), SMALL),
            ],
        ),
        Spacer(1, 4 * mm),
        panel(
            [
                p("FINITE SNAPSHOT", KICKER),
                p(
                    "Die Veröffentlichung ist eine quellengebundene Forschungshilfe für Selbstvertretung und kollektive Diskussion. Sie behauptet keinen Anwaltsstatus, kein sicheres Prozessergebnis und keine Vertretung anderer Personen. Reopen-Trigger sind insbesondere eine EU-Entscheidung, belegter Vollzug, konkrete Beschäftigtenmaßnahme, schriftliche Unterrichtung, Kündigung oder nachweisbare Nutzung eines geschützten Beitrags.",
                    BODY_TIGHT,
                ),
            ],
            fill=PALE_GOLD,
            border=GOLD,
            padding=8,
        ),
        PageBreak(),
    ]
)


def source_entry(item: dict, number: int) -> Paragraph:
    host = urlparse(item["url"]).netloc
    date = item.get("publishedAt") or "ohne Datumsangabe"
    title = escape(item["title"])
    publisher = escape(item["publisher"])
    url = escape(item["url"], quote=True)
    return p(
        f"<b>[{number}] {publisher}.</b> "
        f"<link href=\"{url}\" color=\"#26766D\">{title}</link>. "
        f"{escape(str(date))} · {escape(host)} · {escape(item['evidenceState'])}",
        SOURCE_STYLE,
    )


# 11–12 · SOURCES
split_at = (len(SOURCES) + 1) // 2
for page_index, source_slice in enumerate((SOURCES[:split_at], SOURCES[split_at:]), 1):
    story.extend(
        heading(
            9 + page_index,
            "Quellenregister",
            f"Primär-, Rechts- und Sekundärquellen · Teil {page_index}",
        )
    )
    story.append(
        p(
            "Die Nummern entsprechen den Verweisen im Text. Ein Link bindet die benannte Quelle innerhalb ihres Scopes; er beweist keine darüber hinausgehende Aussage.",
            BODY_TIGHT,
        )
    )
    story.append(Spacer(1, 2 * mm))
    for item in source_slice:
        story.append(source_entry(item, SOURCE_NUMBER[item["id"]]))
    story.append(Spacer(1, 3 * mm))
    story.append(
        p(
            f"Maschinenlesbarer Quellensatz: sources.json · {len(SOURCES)} Quellen · Stand 10.09.2026",
            RIGHT_SMALL,
        )
    )
    if page_index == 1:
        story.append(PageBreak())


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
DOC.build(story, onFirstPage=cover_chrome, onLaterPages=page_chrome)
print(OUTPUT)
