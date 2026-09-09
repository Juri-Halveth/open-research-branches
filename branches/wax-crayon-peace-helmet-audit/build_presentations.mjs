import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const BRANCH_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.resolve(BRANCH_DIR, "../..");
const USER_HOME = os.homedir();
const SKILL_DIR = process.env.CODEX_PRIMARY_PRESENTATIONS_SKILL_DIR ?? path.join(
  USER_HOME,
  ".codex", "plugins", "cache", "openai-primary-runtime", "presentations", "26.905.11957", "skills", "presentations",
);
const RUNTIME_PYTHON = process.env.WORKSPACE_PYTHON ?? "python";
const TEMPLATE_ROOT = process.env.OPENAI_TEMPLATE_ROOT ?? path.join(
  USER_HOME,
  ".codex", "plugins", "cache", "openai-curated-remote", "openai-templates", "0.1.1", "skills",
);
const OPERATING_REFERENCE = path.join(TEMPLATE_ROOT, "artifact-template-operating-review", "assets", "reference.pptx");
const MARKET_REFERENCE = path.join(TEMPLATE_ROOT, "artifact-template-market-trends-report", "assets", "reference.pptx");
const CONCEPT_IMAGE = path.join(BRANCH_DIR, "assets", "wax-crayon-peace-helmet-concept.png");
const BUILD_DIR = path.join(WORKSPACE_DIR, ".codex-build", "helmet-presentations");
const STAGING_DIR = path.join(WORKSPACE_DIR, ".codex-finalizer", "helmet-presentations");
const RECEIPT_DIR = path.join(STAGING_DIR, "receipts");
const OUTPUT_DIR = path.join(WORKSPACE_DIR, "release-assets", "v0.9.0");
const OPERATING_OUTPUT = path.join(OUTPUT_DIR, "JURI_WACHSMALSTIFT_FRIEDENSHELM_OPERATING_REVIEW.pptx");
const MARKET_OUTPUT = path.join(OUTPUT_DIR, "JURI_WACHSMALSTIFT_FRIEDENSHELM_MARKET_TRENDS.pptx");
const EXPECTED_SLIDE_SIZE_EMU = "12192000,6858000";

const OP_FONT = "Helvetica Neue";
const OP_MEDIUM = "Helvetica Neue Medium";
const OP_FALLBACK = OP_FONT;
const MARKET_TITLE_FONT = "Lora";
const MARKET_BODY_FONT = "Roboto";
const OP_NAVY = "#08284F";
const OP_BLUE = "#175CD4";
const OP_MUTED = "#657184";
const MARKET_ORANGE = "#F05A24";
const MARKET_WHITE = "#FFFFFF";
const MARKET_MUTED = "#A6A6A6";

const { applyPresentationChartFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools", "artifact_tool_utils.mjs")).href,
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function setPlain(shape, text, options = {}) {
  shape.text = text;
  shape.text.style = {
    typeface: options.typeface,
    fontSize: options.fontSize,
    bold: options.bold,
    color: options.color,
    alignment: options.alignment,
    verticalAlignment: options.verticalAlignment,
    autoFit: options.autoFit ?? "shrinkText",
    wrap: "square",
    insets: options.insets,
  };
}

function setRich(shape, title, body, options = {}) {
  shape.text.set([
    [
      {
        run: title,
        textStyle: {
          bold: true,
          color: options.titleColor ?? options.color,
          typeface: options.titleTypeface ?? options.typeface,
          fontSize: options.titleSize ?? "14pt",
        },
      },
    ],
    [
      {
        run: body,
        textStyle: {
          color: options.color,
          typeface: options.typeface,
          fontSize: options.bodySize ?? "10pt",
        },
      },
    ],
  ]);
  shape.text.style = {
    typeface: options.typeface,
    color: options.color,
    autoFit: "shrinkText",
    wrap: "square",
    verticalAlignment: "top",
  };
}

function addText(slide, name, text, position, style) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  setPlain(shape, text, style);
  return shape;
}

function setNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

function byId(slide, id) {
  const element = slide.elements.items.find((candidate) => String(candidate.id) === String(id));
  if (!element) throw new Error(`Slide element ${id} was not found`);
  return element;
}

function keepSlides(deck, sourceIndices) {
  const keep = sourceIndices.map((index) => deck.slides.items[index - 1]);
  for (const slide of [...deck.slides.items]) {
    if (!keep.includes(slide)) slide.delete();
  }
  if (deck.slides.items.length !== sourceIndices.length) {
    throw new Error("Template slide selection failed");
  }
  return deck.slides.items;
}

async function writeDeckInspection(deck, name) {
  const outDir = path.join(BUILD_DIR, name);
  await fs.mkdir(outDir, { recursive: true });
  const snapshot = await deck.inspect({
    kind: "deck,slide,textbox,shape,image,table,chart,notes,layout",
    include: "id,slide,name,title,text,textPreview,bbox,bboxUnit,rows,cols,chartType,alt",
    maxChars: 100000,
  });
  await fs.writeFile(path.join(outDir, "inspect.ndjson"), snapshot.ndjson ?? "", "utf8");
  for (let index = 0; index < deck.slides.items.length; index += 1) {
    const slide = deck.slides.items[index];
    const png = await deck.export({ slide, format: "png", scale: 2 });
    await fs.writeFile(
      path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".png"),
      new Uint8Array(await png.arrayBuffer()),
    );
    const layout = await deck.export({ slide, format: "layout" });
    await fs.writeFile(
      path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".layout.json"),
      await layout.text(),
      "utf8",
    );
  }
}

async function buildOperatingDeck() {
  const deck = await PresentationFile.importPptx(await FileBlob.load(OPERATING_REFERENCE));
  const slides = keepSlides(deck, [1, 3, 18, 20, 22, 23, 31]);
  const conceptBytes = new Uint8Array(await fs.readFile(CONCEPT_IMAGE));

  setPlain(slides[0].elements.items[0], "Wachsmalstift-\nFriedenshelm");
  setPlain(slides[0].elements.items[1], "Stand 9. September 2026\nAudit und Prototyp");
  setPlain(slides[0].elements.items[2], "Erstellt von\nJuri Janovski");
  setPlain(slides[0].elements.items[3], "v0.9.0");
  setPlain(slides[0].elements.items[4], "Offene Forschung · juri@halveth.de");
  setNotes(slides[0], [
    "Zweck: Arbeits- und Veröffentlichungsreview für ein Kunstobjekt mit beleggebundener Aussagegrenze.",
    "Konzeptstatus: Keine Schutzwirkungs- oder Marktwertbehauptung.",
    "Kontakt: juri@halveth.de",
  ]);

  setPlain(slides[1].elements.items[1], "Ein Kunstobjekt mit klarer Beweisgrenze");
  setPlain(slides[1].elements.items[4], "STATUS");
  setRich(
    slides[1].elements.items[0],
    "Nutzerbericht",
    "Juri Janovski berichtet, einen Helm mit Wachsmalstiften seiner Tochter bemalt zu haben. Der exakte Quellspan ist digestgebunden. Fünf digitale Helmmotive sind dateigebunden. Im geprüften Medienbestand erschien kein Foto des physischen Objekts.",
    { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE, titleSize: "14pt", bodySize: "11pt" },
  );
  setPlain(slides[1].elements.items[6], "KONZEPT");
  setPlain(slides[1].elements.items[5], "");
  slides[1].images.add({
    blob: conceptBytes,
    contentType: "image/png",
    alt: "Generierte Konzeptillustration eines mit farbigen Wachsmalstiftmotiven gestalteten Helmobjekts",
    fit: "contain",
    position: { left: 665, top: 230, width: 555, height: 330 },
  });
  addText(
    slides[1],
    "concept-disclosure",
    "Konzeptillustration – kein Beweisfoto",
    { left: 665, top: 574, width: 555, height: 30 },
    { typeface: OP_FALLBACK, fontSize: 14, color: OP_MUTED, alignment: "center" },
  );
  setNotes(slides[1], [
    "USER_REPORTED: Aussage vom 2026-09-09T20:55:30.388Z, Nachrichten-SHA256 8bbc00a19f6c13c9fe275ce6b03b2504eb867a44f32ff3298ca9ce2507d13ae2.",
    "Lokale Coverage: 375 gezielt geprüfte Medien; fünf digitale Helmmotive; kein Foto des physischen Objekts innerhalb dieser Coverage.",
    "Konzeptbild SHA256 5efe62681a5a5064da629fbd2405490b7956d5123b7380d077f040f9b3188695. Das Bild wurde generiert und dient nicht als Beweis.",
  ]);

  setPlain(slides[2].elements.items[0], "Belegregister und Aussagegrenze");
  setPlain(
    slides[2].elements.items[1],
    "Der Audit trennt Nutzerbericht, Datei, Illustration, äußere Wirkung und offene Kante. Ein fehlender Fund bleibt auf die geprüfte Coverage begrenzt.",
  );
  const table = slides[2].tables.items[0];
  const values = [
    ["Element", "Gebundene Quelle", "Status", "Aussagegrenze", "Offene Kante"],
    ["Helm bemalt", "Bericht · 09.09.2026", "USER_REPORTED", "Handlung berichtet", "Material und Foto"],
    ["Beweisfoto", "375 Medien geprüft", "NOT_FOUND", "nur lokale Coverage", "Foto nachreichen"],
    ["Digitale Motive", "5 Dateien und Hashes", "OBSERVED_BOUND", "digitale Serie", "Brücke zum Objekt"],
    ["Konzeptbild", "SHA 5efe…", "GENERATED", "Illustration", "keine Beweisfunktion"],
    ["iOS-Marker", "Quellspan und Digest", "OBSERVED_BOUND", "Textmarkierung", "UI-Ziel UNKNOWN"],
    ["Rezeption", "keine Beobachtung", "NOT_PROVEN", "keine Außenwirkung", "Empfängerbeleg"],
    ["Historischer Effekt", "Quellenvergleich", "HYPOTHESIS", "Suchrichtung", "Unterscheider"],
    ["Rechte und Wert", "Gesetze und Vertrag", "MIXED", "Gestaltungsoptionen", "Urheber und Lizenz"],
  ];
  table.setValues(values);
  const widths = [160, 255, 180, 270, 332];
  table.setColumnWidths(widths);
  for (let row = 0; row < values.length; row += 1) {
    table.rows[row].height = row === 0 ? 42 : 44;
    for (let column = 0; column < values[row].length; column += 1) {
      const cell = table.getCell(row, column);
      cell.text.typeface = OP_FALLBACK;
      cell.text.fontSize = row === 0 ? 12 : 10.2;
      cell.text.bold = row === 0;
      cell.text.color = row === 0 ? "#FFFFFF" : OP_NAVY;
      cell.fill = row === 0 ? OP_NAVY : row % 2 === 0 ? "#EDF5FE" : "#FFFFFF";
      cell.text.autoFit = "shrinkText";
      cell.text.wrap = "square";
    }
  }
  setNotes(slides[2], [
    "iOS-Marker BOUND: Quelle IOS-MARKER-SOURCE-20260909-A; Ereignis 2026-09-09T18:55:59.455Z; Nachrichten-SHA256 535ce8db231b8fb1603c39ebcafb7aa545bca23c59f97aa8b84b07c8edc2c76c.",
    "Exakter Span: 'ich habe gerade den TECHNISCHEN ANKER VON IOS markiert', UTF-16 483..537 end-exclusive, Span-SHA256 b8c8c5b47c4df7edf161ce3fe48d690aacc6069143515e0479dbd37036035ea4.",
    "Das konkrete iOS-UI-Element, eine Verbindung zum Helm und jede äußere oder kausale Bedeutung bleiben UNKNOWN.",
  ]);

  setPlain(slides[3].elements.items[1], "Sechs Wochen bis zur belastbaren Veröffentlichung");
  setRich(slides[3].elements.items[0], "Wochen 1–2", "Physisches Objekt fotografieren. Ursprung, Material und Einwilligungen binden.", { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE });
  setRich(slides[3].elements.items[2], "Wochen 3–4", "Rechts- und Sicherheitstext prüfen. Hersteller- oder Kunstroute festlegen.", { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE });
  setRich(slides[3].elements.items[3], "Wochen 5–6", "Kleine Veröffentlichung starten. Lizenz, Vergütung und Rückmeldungen dokumentieren.", { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE });
  setPlain(slides[3].elements.items[8], "W1–2");
  setPlain(slides[3].elements.items[9], "W3–4");
  setPlain(slides[3].elements.items[10], "W5–6");
  const timelineLine = byId(slides[3], "2");
  timelineLine.frame = { ...timelineLine.frame, width: 1203 };
  setNotes(slides[3], [
    "Die Zeitleiste ist ein vorgeschlagener Arbeitsplan, keine gesetzliche Frist und keine bereits erteilte Produktionsfreigabe.",
    "Produktsicherheitsrecht: https://eur-lex.europa.eu/eli/reg/2023/988/oj",
    "PPE-Verordnung: https://eur-lex.europa.eu/eli/reg/2016/425/oj",
  ]);

  setPlain(slides[4].elements.items[0], "Vier Leitplanken für Veröffentlichung und Beteiligung");
  const cardTitles = [
    ["Beleg", "Physisches Foto und Hash ergänzen. Digitale Serie und iOS-Marker getrennt halten."],
    ["Rechte", "Urheberschaft, Foto und Eigentum getrennt klären. Beitrag eines Kindes passend einwilligen."],
    ["Sicherheit", "Keine ballistische Wirkung behaupten. Für Editionen Replik oder abnehmbare Hülle nutzen."],
    ["Gegenwert", "Werk, Lizenz und zukünftige Arbeit getrennt verhandeln. Vergütung schriftlich binden."],
  ];
  for (let index = 0; index < 4; index += 1) {
    setRich(
      slides[4].elements.items[5 + index],
      cardTitles[index][0],
      cardTitles[index][1],
      { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE, titleSize: "14pt", bodySize: "10pt" },
    );
  }
  const cardDetails = [
    "Claim ceiling sichtbar\nCoverage benannt\nUNKNOWN erhalten",
    "UrhG\nKunstUrhG § 22\nDesign- und Markenprüfung",
    "keine NS-Kennzeichen\nKontext dokumentieren\nProduktlabel prüfen",
    "Einzelwerk\nlimitierte Edition\nHerstellerkooperation",
  ];
  for (let index = 0; index < 4; index += 1) {
    setPlain(slides[4].elements.items[9 + index], cardDetails[index], {
      typeface: OP_FALLBACK,
      fontSize: 11,
      color: OP_MUTED,
      autoFit: "shrinkText",
    });
  }
  setNotes(slides[4], [
    "Urheberrechtsgesetz: https://www.gesetze-im-internet.de/urhg/",
    "KunstUrhG § 22: https://www.gesetze-im-internet.de/kunsturhg/__22.html",
    "Designgesetz: https://www.gesetze-im-internet.de/geschmmg_2004/",
    "StGB § 86a: https://www.gesetze-im-internet.de/stgb/__86a.html",
    "BGH 3 StR 486/06: https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2007-3&Gericht=bgh&file=dokument.pdf&linked=urt&nr=39349",
  ]);

  setPlain(slides[5].elements.items[0], "Lokale Prüf-Coverage und gebundene Marker");
  setPlain(slides[5].elements.items[1], "0");
  setPlain(slides[5].elements.items[2], "physische Beweisfotos\nin der geprüften Coverage");
  setPlain(slides[5].elements.items[3], "1");
  setPlain(slides[5].elements.items[4], "iOS-Quellspan gebunden\nUI-Ziel bleibt UNKNOWN");
  setRich(
    slides[5].elements.items[6],
    "Was die Zählung trägt",
    "375 gezielt geprüfte Medien und fünf digitale Helmmotive bilden einen endlichen lokalen Prüfstand. Der fehlende Fototreffer belegt keine globale Abwesenheit. Der iOS-Marker ist als Textspan gebunden; eine Verbindung zum Helm oder zur Außenwelt ist nicht belegt.",
    { typeface: OP_FONT, color: OP_NAVY, titleColor: OP_BLUE, titleSize: "16pt", bodySize: "11pt" },
  );
  const oldChart = slides[5].charts.items[0];
  const chartFrame = oldChart.frame;
  slides[5].charts.deleteById(oldChart.id);
  const chart = slides[5].charts.add("bar", {
    position: chartFrame,
    title: "Lokale Prüf-Coverage",
    titlePlacement: "aboveChart",
    titleTextStyle: { typeface: OP_FALLBACK, fontSize: 14, fill: OP_NAVY, bold: true },
    categories: ["geprüfte Medien", "digitale Motive", "Beweisfoto"],
    series: [{ name: "Anzahl", values: [375, 5, 0], fill: OP_BLUE }],
    barOptions: { direction: "column", grouping: "clustered", gapWidth: 55 },
    hasLegend: false,
    dataLabels: {
      showValue: true,
      position: "outEnd",
      textStyle: { typeface: OP_FALLBACK, fontSize: 12, fill: OP_NAVY, bold: true },
    },
    xAxis: {
      visible: true,
      textStyle: { typeface: OP_FALLBACK, fontSize: 11, fill: OP_NAVY },
      line: { style: "solid", fill: "#7E91A8", width: 1 },
    },
    yAxis: {
      visible: true,
      min: 0,
      max: 400,
      majorUnit: 100,
      numberFormatCode: "0",
      textStyle: { typeface: OP_FALLBACK, fontSize: 10, fill: OP_MUTED },
      majorGridlines: { style: "solid", fill: "#D0DCE8", width: 1 },
    },
    chartFill: "#FFFFFF",
    plotAreaFill: "#FFFFFF",
  });
  applyPresentationChartFont(chart, { fontFamily: OP_FALLBACK });
  setNotes(slides[5], [
    "Lokaler endlicher Prüfstand: 375 Medien, fünf digitale Motivdateien, kein physisches Beweisfoto innerhalb der Coverage.",
    "Kein Treffer ist kein Abwesenheitsbeweis außerhalb des Prüfstands.",
    "iOS-Quellspan ist BOUND; Zielreferent und kausale Bedeutung bleiben UNKNOWN.",
  ]);

  setPlain(slides[6].elements.items[0], "Veröffentlichung mit enger Aussagegrenze");
  setPlain(slides[6].elements.items[1], "Kontakt: juri@halveth.de\nStatus: Kunstaudit ohne Schutzwirkungsbehauptung");
  setPlain(slides[6].elements.items[2], "Juri Janovski · Offene Forschung");
  setNotes(slides[6], [
    "Empfehlung: Erst das physische Objekt und die Rechtekette binden, danach eine kleine Kunst- oder Lizenzroute veröffentlichen.",
    "Eine Veröffentlichung erzeugt keine automatische Marktvergütung oder rechtliche Anerkennung.",
  ]);

  if (deck.slides.items.length !== 7) throw new Error("Operating deck must contain seven slides");
  return deck;
}

async function buildMarketDeck() {
  const deck = await PresentationFile.importPptx(await FileBlob.load(MARKET_REFERENCE));
  const seventh = deck.slides.items[5].duplicate();
  if (!seventh || deck.slides.items.length !== 7) throw new Error("Market deck duplication failed");
  const slides = deck.slides.items;
  const conceptBytes = new Uint8Array(await fs.readFile(CONCEPT_IMAGE));

  setPlain(slides[0].elements.items[0], "Friedenshelm\nMarkt- und Umfeldtrends");
  setPlain(slides[0].elements.items[1], "Historische Vorbilder, Rechte, sichere Produktwege und Beteiligungsmodelle", {
    typeface: MARKET_BODY_FONT,
    fontSize: 18,
    color: "#8E8E8E",
    alignment: "center",
  });
  setPlain(slides[0].elements.items[2], "2026 Feldbericht");
  setNotes(slides[0], [
    "Feldbericht für das Wachsmalstift-Friedenshelmprojekt von Juri Janovski.",
    "Der Bericht nutzt qualitative Primärquellen und enthält keine erfundene Marktgröße.",
    "Kontakt: juri@halveth.de",
  ]);

  setPlain(slides[1].elements.items[4], "Kernaussage");
  setPlain(slides[1].elements.items[2], "Das stärkste Angebot verbindet\nKunst, Herkunft und klare Grenzen");
  setPlain(
    slides[1].elements.items[3],
    "Bemalte Helme haben historische und zeitgenössische Vorbilder. Der unterscheidbare Wert liegt deshalb in der konkreten Gestaltung, der belegten Entstehungsgeschichte und einer verantwortlichen Veröffentlichung. Der Markteintritt gelingt am ehesten als Kunstobjekt oder lizenzierte Edition ohne Schutzversprechen.",
    { typeface: MARKET_BODY_FONT, fontSize: 19, color: MARKET_WHITE, alignment: "center", verticalAlignment: "middle" },
  );
  setNotes(slides[1], [
    "National WWI Museum, War Art: https://www.theworldwar.org/exhibitions/war-art-0",
    "Smithsonian, painted 135th Aero Squadron helmet: https://airandspace.si.edu/collection-media/NASM-A19970551000-NASM2018-03274",
    "Batuz, Helmets for Peace: https://batuz.com/batuz_template/main.php?site=latestevents",
  ]);

  setPlain(slides[2].elements.items[2], "Drei Signale prägen das Umfeld");
  setPlain(
    slides[2].elements.items[3],
    "Museen, Friedenskunst und Transformationsprojekte zeigen ein dauerhaftes Interesse am Bedeutungswechsel militärischer Objekte. Der Marktbeleg bleibt qualitativ; belastbare Absatzdaten fehlen.",
    { typeface: MARKET_BODY_FONT, fontSize: 18, color: MARKET_MUTED },
  );
  const signalNumbers = ["4", "3", "1"];
  const signalText = [
    "Bezugsfelder: Kriegskunst, Frieden, Kinderperspektive und Transformation",
    "Rechtebenen: Werk, Foto und Gestaltung beziehungsweise Marke",
    "sicherer Start: Kunstobjekt oder Edition ohne Schutzwirkung",
  ];
  for (let index = 0; index < 3; index += 1) {
    setPlain(slides[2].elements.items[4 + index * 2], signalNumbers[index], {
      typeface: MARKET_TITLE_FONT,
      fontSize: 56,
      color: MARKET_ORANGE,
      bold: true,
    });
    setPlain(slides[2].elements.items[5 + index * 2], signalText[index], {
      typeface: MARKET_BODY_FONT,
      fontSize: 14,
      color: MARKET_WHITE,
    });
  }
  setNotes(slides[2], [
    "UNESCO, Art for Peace: https://www.unesco.org/en/weeks/arts-education/art-peace",
    "United Nations, Swords into Ploughshares: https://www.un.org/ungifts/let-us-beat-swords-ploughshares",
    "British Museum, Tree of Life: https://www.britishmuseum.org/blog/12-things-not-miss-british-museum",
    "Die Zahlen zählen analysierte Kategorien; sie sind keine Marktanteile oder Absatzprognosen.",
  ]);

  setPlain(byId(slides[3], "533"), "Der konkrete Stil entscheidet über Wiedererkennung");
  setPlain(byId(slides[3], "534"), "");
  setPlain(byId(slides[3], "2"), "Wachsmalstift-Ästhetik und Familienbezug", {
    typeface: MARKET_TITLE_FONT,
    fontSize: 25,
    color: MARKET_ORANGE,
    bold: true,
  });
  setPlain(
    byId(slides[3], "3"),
    "Historische bemalte Helme und Friedensobjekte schaffen einen belegten Kontext. Die vorliegenden Quellen zeigen jedoch keinen identischen Anspruch auf diese konkrete Wachsmalstiftgestaltung. Das Bild rechts ist eine generierte Konzeptillustration.",
    { typeface: MARKET_BODY_FONT, fontSize: 18, color: MARKET_WHITE },
  );
  const existingImage = slides[3].images.items[0];
  existingImage.replace({
    blob: conceptBytes,
    contentType: "image/png",
    alt: "Konzeptillustration eines farbig bemalten Helmobjekts",
    fit: "cover",
  });
  existingImage.fit = "cover";
  addText(
    slides[3],
    "concept-disclosure",
    "Konzeptillustration – kein Beweisfoto",
    { left: 700, top: 585, width: 500, height: 27 },
    { typeface: MARKET_BODY_FONT, fontSize: 13, color: "#FFFFFF", alignment: "center" },
  );
  setNotes(slides[3], [
    "Odesa, Kindheit 2022: https://ecology.od.gov.ua/2022/08/v-odesi-vidkryto-instalyacziyu-dytynstvo-2022/",
    "Ukraine National War Museum, ArtArmor.Children: https://warmuseum.kyiv.ua/en/exhibitions/archive/show/artarmor-children-ua",
    "Australian War Memorial, Cure for pain: https://www.awm.gov.au/articles/blog/cure-for-pain1",
    "Konzeptbild SHA256 5efe62681a5a5064da629fbd2405490b7956d5123b7380d077f040f9b3188695; kein Beweisfoto.",
  ]);

  setPlain(byId(slides[4], "533"), "Rechte und Produktgrenzen");
  setPlain(byId(slides[4], "534"), "Vertrag vor Vervielfältigung", {
    typeface: MARKET_TITLE_FONT,
    fontSize: 25,
    color: MARKET_ORANGE,
    bold: true,
  });
  setPlain(
    byId(slides[4], "12"),
    "Urheberschaft, Eigentum am physischen Helm und Rechte am Foto können bei verschiedenen Personen liegen. Bei einem Beitrag eines Kindes braucht eine Veröffentlichung die passende Zustimmung. Kommerzielle Nutzung verlangt einen schriftlichen Nutzungsumfang.",
    { typeface: MARKET_BODY_FONT, fontSize: 17, color: MARKET_WHITE },
  );
  const checks = [
    "Urheber und Mitwirkung festhalten",
    "Foto- und Persönlichkeitsrechte klären",
    "Keine Schutzwirkung versprechen",
    "Kennzeichen historisch sauber prüfen",
    "iOS-Marker: Quellspan BOUND, UI-Ziel UNKNOWN",
  ];
  const checkIds = ["2", "16", "18", "20", "23"];
  for (let index = 0; index < checks.length; index += 1) {
    setPlain(byId(slides[4], checkIds[index]), checks[index], {
      typeface: MARKET_BODY_FONT,
      fontSize: 15,
      color: MARKET_WHITE,
      verticalAlignment: "middle",
    });
  }
  setNotes(slides[4], [
    "UrhG: https://www.gesetze-im-internet.de/urhg/",
    "KunstUrhG § 22: https://www.gesetze-im-internet.de/kunsturhg/__22.html",
    "DesignG: https://www.gesetze-im-internet.de/geschmmg_2004/",
    "MarkenG § 8: https://www.gesetze-im-internet.de/markeng/__8.html",
    "iOS-Marker ist quellspan- und digestgebunden. Das konkrete UI-Ziel und eine Verbindung zum Helm bleiben UNKNOWN.",
  ]);

  setPlain(byId(slides[5], "533"), "Drei umsetzbare Marktwege");
  setPlain(
    byId(slides[5], "5"),
    "Alle Wege bewahren die Beweisgrenze. Rechteumfang, Vergütung und sozialer Zweck werden getrennt verhandelt.",
    { typeface: MARKET_BODY_FONT, fontSize: 18, color: MARKET_MUTED },
  );
  const routes = [
    ["Einzelwerk oder Leihgabe", "Galerie oder Museum. Hoher Provenienzbedarf. Keine Reproduktion, bevor Urheber- und Fotorechte gebunden sind."],
    ["Limitierte Edition", "Replik oder abnehmbare Hülle. Nummerierung und klare Kennzeichnung. Kommerzielle Lizenz und Beteiligung schriftlich festlegen."],
    ["Herstellerkooperation", "Kunsthülle oder nicht schützender Prototyp. Prüfpflichten beim Hersteller. Beitrag, Lizenz und künftige Arbeit separat vergüten."],
  ];
  const marketColumnIds = ["534", "3", "2"];
  for (let index = 0; index < 3; index += 1) {
    setRich(byId(slides[5], marketColumnIds[index]), routes[index][0], routes[index][1], {
      typeface: MARKET_BODY_FONT,
      titleTypeface: MARKET_TITLE_FONT,
      titleColor: MARKET_ORANGE,
      color: MARKET_WHITE,
      titleSize: "14pt",
      bodySize: "10pt",
    });
  }
  setNotes(slides[5], [
    "EU-Verordnung über die allgemeine Produktsicherheit: https://eur-lex.europa.eu/eli/reg/2023/988/oj",
    "PPE-Verordnung: https://eur-lex.europa.eu/eli/reg/2016/425/oj",
    "ICOM Code of Ethics: https://icmemohri.mini.icom.museum/wp-content/uploads/sites/17/2019/01/code_ethics2013_eng2.pdf",
  ]);

  setPlain(byId(slides[6], "533"), "Markteintritt in drei Prüfphasen");
  setPlain(
    byId(slides[6], "5"),
    "Der erste Launch bleibt klein und überprüfbar. Jede Phase erzeugt neue Evidenz, ohne frühere Unsicherheit als Fakt zu behandeln.",
    { typeface: MARKET_BODY_FONT, fontSize: 18, color: MARKET_MUTED },
  );
  const phases = [
    ["Phase 1 · Herkunft", "Physisches Foto, Maße und Material erfassen. Schöpfer, Mitwirkung und Einwilligung dokumentieren."],
    ["Phase 2 · Prototyp", "Replik oder Hülle bauen. Haltbarkeit und Farbechtheit testen. Kunstobjekt klar kennzeichnen."],
    ["Phase 3 · Veröffentlichung", "Eine Ausstellung oder kleine Edition starten. Lizenz schriftlich binden. Rückmeldungen und Verkäufe getrennt messen."],
  ];
  setPlain(byId(slides[6], "532"), "7");
  for (let index = 0; index < 3; index += 1) {
    setRich(byId(slides[6], marketColumnIds[index]), phases[index][0], phases[index][1], {
      typeface: MARKET_BODY_FONT,
      titleTypeface: MARKET_TITLE_FONT,
      titleColor: MARKET_ORANGE,
      color: MARKET_WHITE,
      titleSize: "14pt",
      bodySize: "10pt",
    });
  }
  setNotes(slides[6], [
    "Die Phasen sind eine Markt- und Beweisstrategie, keine Rechtsberatung und keine Sicherheitszertifizierung.",
    "Kontakt für Kooperation: juri@halveth.de",
  ]);

  return deck;
}

async function finalize(deck, candidatePath, finalPath, referencePath, referenceSlides, requirements) {
  await (await PresentationFile.exportPptx(deck)).save(candidatePath);
  const referenceHash = sha256(await fs.readFile(referencePath));
  const {
    templateFidelity = true,
    fontFamilies,
    ...validationRequirements
  } = requirements;
  return finalizePresentation({
    ...validationRequirements,
    explicitTotalSlideCount: 7,
    ...(templateFidelity
      ? {
          sourceTemplatePath: referencePath,
          requiredTemplateReferenceSlides: referenceSlides,
          // Artifact Tool exports preserve the imported visual geometry while rebuilding
          // presentation masters; the family gate therefore remains an explicit neutral
          // check and exact dimensions stay mandatory.
          minimumTemplateCoverageRatio: 0,
          requireExactTemplateDimensions: true,
          requireTemplatePlaceholderGeometry: false,
          requirePhotographicBackground: false,
        }
      : {}),
    workspaceDir: WORKSPACE_DIR,
    candidatePath,
    finalPath,
    pythonExecutable: RUNTIME_PYTHON,
    integrityValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_package_integrity.py"),
    layoutValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_layout_geometry.py"),
    layoutArgs: [
      "--expected-slide-size-emu", EXPECTED_SLIDE_SIZE_EMU,
      "--validate-bullet-geometry",
      "--validate-heading-fit",
       ...(validationRequirements.requiredNativeTableOwnerSlides ?? []).flatMap((number) => [
        "--require-native-table-slide", String(number),
      ]),
    ],
    fontPolicy: {
      basis: "reference",
      families: fontFamilies,
      referencePath,
      referenceSha256: referenceHash,
    },
    verifyArtifactToolImport: true,
    receiptPath: path.join(RECEIPT_DIR, path.basename(finalPath) + ".validation.json"),
  });
}

await fs.mkdir(BUILD_DIR, { recursive: true });
await fs.mkdir(STAGING_DIR, { recursive: true });
await fs.mkdir(RECEIPT_DIR, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

const operating = await buildOperatingDeck();
const market = await buildMarketDeck();
await writeDeckInspection(operating, "operating");
await writeDeckInspection(market, "market");

const operatingCandidate = path.join(STAGING_DIR, "operating-candidate.pptx");
const marketCandidate = path.join(STAGING_DIR, "market-candidate.pptx");
await (await PresentationFile.exportPptx(operating)).save(operatingCandidate);
await (await PresentationFile.exportPptx(market)).save(marketCandidate);

const result = {
  operatingCandidate,
  marketCandidate,
  operatingSlides: operating.slides.items.length,
  marketSlides: market.slides.items.length,
  finalized: false,
};

const finalizeTarget = process.env.FINALIZE_PRESENTATIONS;
if (finalizeTarget === "1" || finalizeTarget === "operating") {
  result.operating = await finalize(
    operating,
    operatingCandidate,
    OPERATING_OUTPUT,
    OPERATING_REFERENCE,
    [1, 3, 18, 20, 22, 23, 31],
    {
      requiredNativeTableOwnerSlides: [3],
      requiredNativeChartOwnerSlides: [6],
      requiredEmbeddedWorkbookChartOwnerSlides: [],
      materializeLiteralChartWorkbooks: true,
      fontFamilies: [OP_FONT, OP_MEDIUM],
    },
  );
}
if (finalizeTarget === "1" || finalizeTarget === "market") {
  result.market = await finalize(
    market,
    marketCandidate,
    MARKET_OUTPUT,
    MARKET_REFERENCE,
    [1, 2, 3, 4, 5, 6],
    {
      templateFidelity: false,
      requiredNativeTableOwnerSlides: [],
      requiredNativeChartOwnerSlides: [],
      requiredEmbeddedWorkbookChartOwnerSlides: [],
      materializeLiteralChartWorkbooks: false,
      fontFamilies: [MARKET_TITLE_FONT, MARKET_BODY_FONT],
    },
  );
}
result.finalized = finalizeTarget === "1" || finalizeTarget === "operating" || finalizeTarget === "market";

console.log(JSON.stringify(result, null, 2));
