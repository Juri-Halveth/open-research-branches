const SVG = "http://www.w3.org/2000/svg";
const POINTS = {
  C01: [95, 210], C02: [285, 105], C03: [465, 70], C04: [465, 200],
  C05: [660, 180], C06: [245, 380], C07: [455, 350], C08: [655, 390],
  C09: [840, 75], C10: [1015, 110], C11: [980, 260], C12: [1110, 360],
  C13: [850, 425]
};
const LANES = [
  ["ALL", "Alle Spuren"], ["FILM", "Film"], ["ARCHIVE", "Archiv"],
  ["INTELLIGENCE", "Dienste"], ["CRISIS", "Krisen"], ["SEPARATE", "9/11"]
];
const LABELS = {FILM:"Film",ARCHIVE:"Archiv",INTELLIGENCE:"Geheimdienste",CRISIS:"Krisen",SEPARATE:"Separater Strang"};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}
function appendLink(parent, href, label) {
  const link = el("a", "", label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  parent.append(link);
}
function appendField(parent, label, value) {
  const dl = parent.querySelector("dl") || parent.appendChild(el("dl"));
  dl.append(el("dt", "", label), el("dd", "", value));
}
function shortLabel(value) {
  return value.length > 24 ? value.slice(0, 22) + "…" : value;
}

async function start() {
  const response = await fetch("./audit.json", {cache:"no-store"});
  if (!response.ok) throw new Error(`audit.json: HTTP ${response.status}`);
  const data = await response.json();
  const claims = new Map(data.claims.map(c => [c.id, c]));
  const sources = new Map(data.sources.map(s => [s.id, s]));
  const graph = document.getElementById("graph");
  const detail = document.getElementById("detail");
  const controls = document.getElementById("map-controls");
  let activeLane = "ALL";
  let selected = "C03";

  function drawDetail(id) {
    const claim = claims.get(id);
    if (!claim) return;
    detail.replaceChildren();
    detail.append(el("p", "eyebrow", `${claim.id} / ${LABELS[claim.lane]} / ${claim.year}`));
    detail.append(el("h3", "", claim.title));
    detail.append(el("span", "status", claim.status));
    detail.append(el("p", "", claim.statement));
    appendField(detail, "GRENZE", claim.ceiling);
    appendField(detail, "GEGENMODELL", claim.countermodel);
    appendField(detail, "NÄCHSTER UNTERSCHEIDER", claim.nextEvidence);
    const list = el("ul");
    for (const sourceId of claim.sourceIds) {
      const source = sources.get(sourceId);
      const item = el("li");
      appendLink(item, source.url, `${source.id} · ${source.publisher} ↗`);
      list.append(item);
    }
    detail.append(el("p", "eyebrow", "QUELLEN"), list);
  }
  function applyFilter() {
    for (const node of graph.querySelectorAll(".graph-node")) {
      const match = activeLane === "ALL" || node.dataset.lane === activeLane;
      node.classList.toggle("dim", !match);
    }
    for (const edge of graph.querySelectorAll(".graph-edge")) {
      const from = claims.get(edge.dataset.from);
      const to = claims.get(edge.dataset.to);
      const match = activeLane === "ALL" || from.lane === activeLane || to.lane === activeLane;
      edge.classList.toggle("dim", !match);
    }
    for (const button of controls.querySelectorAll("button")) {
      const active = button.dataset.lane === activeLane;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }
  function select(id) {
    selected = id;
    for (const node of graph.querySelectorAll(".graph-node")) node.classList.toggle("active", node.dataset.id === selected);
    drawDetail(id);
  }
  for (const [id, label] of LANES) {
    const button = el("button", "filter", label);
    button.type = "button";
    button.dataset.lane = id;
    button.addEventListener("click", () => {activeLane = id; applyFilter();});
    controls.append(button);
  }
  const edgeLayer = svg("g");
  graph.append(edgeLayer);
  for (const relation of data.relations) {
    const a = POINTS[relation.from], b = POINTS[relation.to];
    if (!a || !b) continue;
    const bend = (a[1] + b[1]) / 2 - Math.min(65, Math.abs(a[0] - b[0]) * .09);
    const path = svg("path", {
      d:`M ${a[0]} ${a[1]} Q ${(a[0]+b[0])/2} ${bend} ${b[0]} ${b[1]}`,
      class:`graph-edge ${relation.status === "SOURCE_BOUND" ? "" : "soft"}`,
      "data-from":relation.from, "data-to":relation.to
    });
    path.append(svg("title"));
    path.firstChild.textContent = `${relation.label} · ${relation.type} · ${relation.status}`;
    edgeLayer.append(path);
  }
  const nodeLayer = svg("g");
  graph.append(nodeLayer);
  for (const claim of data.claims) {
    const [x,y] = POINTS[claim.id];
    const group = svg("g", {
      class:`graph-node ${claim.lane.toLowerCase()}`,
      transform:`translate(${x} ${y})`,
      tabindex:"0", role:"button", "aria-label":`${claim.title}, ${LABELS[claim.lane]}, ${claim.year}`,
      "data-id":claim.id, "data-lane":claim.lane
    });
    group.append(svg("circle",{class:"halo",r:"28"}),svg("circle",{class:"circle",r:"20"}),svg("circle",{class:"dot",r:"4"}));
    const year = svg("text",{class:"year",y:"-34","text-anchor":"middle"});
    year.textContent = claim.year;
    const label = svg("text",{y:"48","text-anchor":"middle"});
    label.textContent = shortLabel(claim.title);
    group.append(year,label);
    group.addEventListener("click",() => select(claim.id));
    group.addEventListener("keydown",event => {if(event.key === "Enter" || event.key === " "){event.preventDefault();select(claim.id);}});
    nodeLayer.append(group);
  }
  const hypothesisList = document.getElementById("hypotheses");
  for (const h of data.openHypotheses) {
    const box = el("details","hypothesis");
    const summary = el("summary");
    summary.append(el("span","h-index",h.id),el("h3","",h.title),el("span","plus","+"));
    const body = el("div");
    body.append(el("span","h-state",h.state));
    const rival = el("p");
    rival.append(el("strong","","Gegenmodell: "),document.createTextNode(h.countermodels.join("; ")));
    const next = el("p");
    next.append(el("strong","","Wieder öffnen mit: "),document.createTextNode(h.discriminator));
    body.append(rival,next);
    box.append(summary,body);
    hypothesisList.append(box);
  }
  const sourceList = document.getElementById("sources");
  for (const source of data.sources) {
    const card = el("article","source");
    card.append(el("span","",`${source.id} / ${source.kind}`));
    appendLink(card,source.url,source.title+" ↗");
    card.append(el("small","",`${source.publisher} · ${source.date}`));
    sourceList.append(card);
  }
  applyFilter();
  select(selected);
}
start().catch(error => {
  const detail = document.getElementById("detail");
  detail.replaceChildren(el("h3","","Daten konnten nicht geladen werden"),el("p","",`Die Seite braucht einen lokalen Webserver oder eine GitHub-Pages-Adresse. ${error.message}`));
});
