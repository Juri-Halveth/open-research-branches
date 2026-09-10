"""Deterministic PDF view of the branch README and complete source registry.

Requires reportlab. Reads public Markdown/JSON only; never captures an account,
downloads a leak, or publishes an artifact. Source bytes remain unchanged.
"""
from __future__ import annotations

import hashlib
import json
import re
from html import escape
from pathlib import Path
from urllib.parse import quote

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
    Spacer, Table, TableStyle,
)

BRANCH = Path(__file__).resolve().parent
REPO = BRANCH.parents[1]
OUTPUT = REPO / "release-assets" / "v0.15.0" / "JURI_STEAM_COINS_WALLET_LEAK_AUDIT.pdf"
PUBLIC_BASE = "https://github.com/Juri-Halveth/open-research-branches/blob/v0.15.0/branches/steam-coins-wallet-and-leak-audit/"
WIDTH, HEIGHT = A4
MARGIN = 17 * mm
TEXT_W = WIDTH - 2 * MARGIN
rl_config.invariant = 1


def register_fonts() -> None:
    fonts = [
        ("Body", r"C:\Windows\Fonts\segoeui.ttf"),
        ("Body-Bold", r"C:\Windows\Fonts\seguisb.ttf"),
        ("Body-Italic", r"C:\Windows\Fonts\segoeuii.ttf"),
        ("Body-BoldItalic", r"C:\Windows\Fonts\seguisbi.ttf"),
        ("Mono", r"C:\Windows\Fonts\consola.ttf"),
    ]
    for name, path in fonts:
        if not Path(path).is_file():
            raise RuntimeError(f"Required font missing: {path}")
        pdfmetrics.registerFont(TTFont(name, path))
    pdfmetrics.registerFontFamily(
        "Body", normal="Body", bold="Body-Bold",
        italic="Body-Italic", boldItalic="Body-BoldItalic",
    )


register_fonts()
BASE = ParagraphStyle(
    "Body", fontName="Body", fontSize=9.7, leading=13.6,
    textColor=colors.HexColor("#202020"), spaceAfter=5.3,
    allowWidows=0, allowOrphans=0, splitLongWords=True,
)
TITLE = ParagraphStyle(
    "Title", parent=BASE, fontName="Body-Bold", fontSize=23,
    leading=28, spaceBefore=7, spaceAfter=11, keepWithNext=True,
)
H2 = ParagraphStyle(
    "Heading2", parent=BASE, fontName="Body-Bold", fontSize=13,
    leading=16.5, spaceBefore=12, spaceAfter=6, keepWithNext=True,
)
H3 = ParagraphStyle(
    "Heading3", parent=BASE, fontName="Body-Bold", fontSize=10.6,
    leading=14, spaceBefore=8, spaceAfter=4, keepWithNext=True,
)
CELL = ParagraphStyle(
    "Cell", parent=BASE, fontSize=9.1, leading=12.2, spaceAfter=0,
)
SMALL = ParagraphStyle(
    "Small", parent=BASE, fontSize=8.2, leading=11, spaceAfter=4,
)
BULLET = ParagraphStyle(
    "Bullet", parent=BASE, leftIndent=11, firstLineIndent=-8,
)
QUOTE = ParagraphStyle(
    "Quote", parent=BASE, leftIndent=10, rightIndent=5,
    borderColor=colors.HexColor("#b0b0b0"), borderWidth=0.5,
    borderPadding=6, spaceBefore=3, spaceAfter=7,
)
CODE = ParagraphStyle(
    "Code", parent=SMALL, fontName="Mono", fontSize=8,
    leading=10.8, backColor=colors.HexColor("#f2f2f2"),
    borderPadding=5, spaceBefore=4, spaceAfter=7,
)


def link_target(target: str) -> str:
    if target.startswith(("https://", "http://", "mailto:")):
        return target
    return PUBLIC_BASE + quote(target.removeprefix("./"), safe="/#?=&:%")


def inline(text: str) -> str:
    """Small, explicitly supported Markdown inline grammar; escape all raw HTML."""
    pattern = re.compile(
        r"(\[[^\]]+\]\([^\s)]+\)|<https?://[^>]+>|"
        r"\*\*[^*]+\*\*|__[^_]+__|\x60[^\x60]+\x60|\*[^*]+\*)"
    )
    out = []
    pos = 0
    for match in pattern.finditer(text):
        out.append(escape(text[pos:match.start()]))
        token = match.group(0)
        if token.startswith("["):
            item = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", token)
            assert item
            label, target = item.groups()
            out.append(f'<link href="{escape(link_target(target), quote=True)}" color="#202020"><u>{inline(label)}</u></link>')
        elif token.startswith("<http"):
            target = token[1:-1]
            out.append(f'<link href="{escape(target, quote=True)}" color="#202020"><u>{escape(target)}</u></link>')
        elif token.startswith(("**", "__")):
            out.append("<b>" + escape(token[2:-2]) + "</b>")
        elif token.startswith(chr(96)):
            out.append('<font name="Mono" size="8.6">' + escape(token[1:-1]) + "</font>")
        else:
            out.append("<i>" + escape(token[1:-1]) + "</i>")
        pos = match.end()
    out.append(escape(text[pos:]))
    return "".join(out)


def table_rows(lines: list[str]) -> list[list[str]]:
    rows = []
    for line in lines:
        parts = [part.strip() for part in re.split(r"(?<!\\)\|", line.strip().strip("|"))]
        if all(re.fullmatch(r":?-+:?", part.replace(" ", "")) for part in parts):
            continue
        rows.append([part.replace(r"\|", "|") for part in parts])
    if not rows or any(len(row) != len(rows[0]) for row in rows):
        raise ValueError("Markdown table has inconsistent column counts")
    return rows


def make_table(lines: list[str]) -> Table:
    rows = table_rows(lines)
    count = len(rows[0])
    # Column widths are chosen from all text lengths, with conservative caps.
    scores = []
    for index in range(count):
        lengths = sorted(len(re.sub(r"\[[^\]]+\]\([^)]+\)", "link", row[index])) for row in rows)
        scores.append(max(16, min(100, lengths[len(lengths) // 2])))
    if count == 2:
        ratios = [0.29, 0.71]
    else:
        weights = [score ** 0.55 for score in scores]
        ratios = [weight / sum(weights) for weight in weights]
    data = [
        [Paragraph(("<b>" + inline(cell) + "</b>") if row_i == 0 else inline(cell), CELL)
         for cell in row]
        for row_i, row in enumerate(rows)
    ]
    table = Table(data, colWidths=[TEXT_W * ratio for ratio in ratios], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e7e7e7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, colors.HexColor("#666666")),
        ("LINEBELOW", (0, 1), (-1, -1), 0.3, colors.HexColor("#cccccc")),
    ]))
    return table


def parse_markdown(markdown: str) -> list:
    lines = markdown.splitlines()
    story = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("<!--"):
            while i < len(lines) and "-->" not in lines[i]:
                i += 1
            i += 1
            continue
        if line.startswith("~~~") or line.startswith(chr(96) * 3):
            marker = line[:3]
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith(marker):
                block.append(lines[i])
                i += 1
            i += 1
            story.append(Paragraph("<br/>".join(escape(part).replace(" ", "&nbsp;") for part in block), CODE))
            continue
        if re.match(r"^#{1,6}\s", line):
            level, text = line.split(" ", 1)
            story.append(Paragraph(inline(text), TITLE if len(level) == 1 else H2 if len(level) == 2 else H3))
            if len(level) == 1:
                story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=9))
            i += 1
            continue
        if re.fullmatch(r"[-*_]{3,}", line):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=5, spaceAfter=7))
            i += 1
            continue
        if line.startswith("|") and "|" in line[1:]:
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(lines[i].strip())
                i += 1
            story.extend([make_table(block), Spacer(1, 7)])
            continue
        if re.match(r"^([-*+] |\d+\. )", line):
            block = [line]
            i += 1
            while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                block.append(lines[i].strip())
                i += 1
            joined = " ".join(block)
            match = re.match(r"^([-*+]|\d+\.)\s+(.*)$", joined)
            assert match
            marker, content = match.groups()
            story.append(Paragraph(("-" if marker in "-*+" else marker) + " " + inline(content), BULLET))
            continue
        if line.startswith(">"):
            block = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                block.append(lines[i].strip().removeprefix(">").strip())
                i += 1
            story.append(Paragraph(inline(" ".join(block)), QUOTE))
            continue
        block = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#|>|\||[-*+] |\d+\. |\x60\x60\x60|~~~)", lines[i].strip()):
            block.append(lines[i].strip())
            i += 1
        story.append(Paragraph(inline(" ".join(block)), BASE))
    return story


def page_furniture(canvas, doc) -> None:
    canvas.saveState()
    canvas.setTitle("Steam Coins, Wallet und Leak - Quellenpruefung")
    canvas.setAuthor("Juri Janovski")
    canvas.setSubject("Oeffentlicher Forschungsbericht zu Coins, Steam Wallet und berichteter Achievement-Offenlegung")
    canvas.setCreator("Deterministic ReportLab builder from public Markdown and JSON")
    canvas.setFont("Body", 7.3)
    canvas.setFillColor(colors.HexColor("#656565"))
    canvas.drawString(MARGIN, HEIGHT - 11 * mm, "Juri Janovski  /  HALVETH - OFFENE FORSCHUNG")
    canvas.drawRightString(WIDTH - MARGIN, HEIGHT - 11 * mm, "QUELLENSTAND 10.09.2026")
    canvas.setStrokeColor(colors.HexColor("#b0b0b0"))
    canvas.line(MARGIN, 13 * mm, WIDTH - MARGIN, 13 * mm)
    canvas.drawString(MARGIN, 9 * mm, "Steam Coins / Wallet / Leak  |  v0.15.0")
    canvas.drawRightString(WIDTH - MARGIN, 9 * mm, str(doc.page))
    canvas.restoreState()


def source_appendix(sources: list[dict]) -> list:
    result = [PageBreak(), Paragraph("Quellenverzeichnis", H2)]
    result.append(Paragraph(
        "Vollstaendige Quellenadressen aus sources.json. Die Links sind im PDF anklickbar. "
        "Abrufstand und Quellenrolle gelten im jeweils angegebenen Umfang.", BASE))
    for source in sources:
        identity = str(source.get("id", ""))
        title = str(source.get("title", source.get("name", identity)))
        url = str(source.get("url", ""))
        result.append(Paragraph(escape(identity + " | " + title), H3))
        details = []
        for label, candidates in [
            ("Herausgeber", ["publisher"]),
            ("Quellenrolle", ["sourceRole", "kind", "type", "sourceType"]),
            ("Abrufart", ["accessMethod"]),
            ("Veroeffentlicht", ["publishedAt", "publishedDate", "publicationDate"]),
            ("Abgerufen", ["accessedAt", "retrievedAt", "fetchedAt"]),
        ]:
            value = next((source[key] for key in candidates if source.get(key)), None)
            if value is not None:
                details.append(label + ": " + str(value))
        if details:
            result.append(Paragraph(escape(" | ".join(details)), SMALL))
        if source.get("accessMethod") == "BODY_UNAVAILABLE":
            result.append(Paragraph("<b>Volltext nicht verfuegbar. Dieser Link dient als Recherchehinweis und traegt hier keinen Tatsachenbeleg.</b>", SMALL))
        if url:
            result.append(Paragraph(
                '<link href="' + escape(url, quote=True) + '" color="#202020"><u>' + escape(url) + "</u></link>", SMALL))
        note = source.get("scope") or source.get("note") or source.get("supports")
        if isinstance(note, str):
            result.append(Paragraph(escape(note), SMALL))
        elif isinstance(note, list):
            result.append(Paragraph(escape("; ".join(str(item) for item in note)), SMALL))
    return result


def main() -> None:
    readme_path = BRANCH / "README.md"
    source_path = BRANCH / "sources.json"
    markdown = readme_path.read_text(encoding="utf-8")
    source_doc = json.loads(source_path.read_text(encoding="utf-8"))
    sources = source_doc["sources"] if isinstance(source_doc, dict) else source_doc
    if not isinstance(sources, list) or not all(isinstance(item, dict) for item in sources):
        raise ValueError("sources.json must contain an array of source objects")
    ids = [str(source.get("id", "")) for source in sources]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate source IDs")
    story = parse_markdown(markdown)
    story.extend(source_appendix(sources))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Dateibindung dieser PDF-Ansicht", H2))
    story.append(Paragraph(
        "SHA-256 bindet die eingelesenen Dateibytes. Der Digest stellt fuer sich allein "
        "keinen Urheberschafts-, Prioritaets- oder Wirkungsnachweis dar.", SMALL))
    story.append(Paragraph(
        "Die PDF-Erstellungs- und Aenderungsmetadaten sind fuer bytegleiche Wiederholungsbuilds "
        "auf den 01.01.2000 normiert. Der inhaltliche Quellenstand steht in der Kopfzeile; "
        "die Metadaten sind kein historischer Zeitnachweis.", SMALL))
    receipts = {}
    for filename in ["README.md", "sources.json", "claims.json", "comparison.json", "public-observation.json", "reconstruction-cycle.json", "build_pdf.py"]:
        path = BRANCH / filename
        if path.is_file():
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            receipts[filename] = digest
            story.append(Paragraph("<b>" + escape(filename) + "</b><br/>" + digest, SMALL))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=20 * mm, bottomMargin=19 * mm, pageCompression=1,
        title="Steam Coins, Wallet und Leak - Quellenpruefung", author="Juri Janovski",
    )
    doc.build(story, onFirstPage=page_furniture, onLaterPages=page_furniture)
    print(json.dumps({
        "output": str(OUTPUT), "bytes": OUTPUT.stat().st_size,
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "source_count": len(sources), "input_receipts": receipts,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
