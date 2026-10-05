import { initialState, advance, initialGraph, validateGraph, expand, STAGE_GROUPS } from './model.mjs';
const $ = id => document.getElementById(id);
const KEY = 'halveth-transition-field-v0.2';
let state = initialState(), graph = initialGraph(), selected = 'absorption', running = !matchMedia('(prefers-reduced-motion: reduce)').matches, last = null, rendered = 0;
const text = (tag, value) => { const el = document.createElement(tag); el.textContent = value; return el; };
const kinds = { DESIGN:'Gestaltungsidee', SOURCE:'Gebundene Quelle', MODEL:'Demonstrationsmodell', RESEARCH:'Forschungsfrage · Quelle weiter prüfen', OPEN:'Offener Forschungsplatz' };
try { const stored = localStorage.getItem(KEY); if (stored) { const parsed = JSON.parse(stored); validateGraph(parsed); graph = parsed; } }
catch { $('storage-status').textContent = 'Gespeichertes Netz konnte nicht gelesen werden. Die Ausgangsfassung ist geöffnet.'; }
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(graph)); $('storage-status').textContent = 'Dein Netz ist auf diesem Gerät gespeichert.'; }
  catch { $('storage-status').textContent = 'Browserspeicher ist gesperrt. Mit „Mein Netz als JSON“ kannst du deine Arbeit mitnehmen.'; }
}
function depth(node) { let d = 0; while (node.parent) { d++; node = graph.nodes.find(n => n.id === node.parent); } return d; }
function choose(id) { selected = id; renderGraph(); renderDetail(); }
function renderGraph() {
  const query = $('node-filter').value.toLocaleLowerCase('de'); $('nodes').replaceChildren();
  const ordered=[];
  function visit(parent) { for (const node of graph.nodes.filter(n=>n.parent===parent)) { ordered.push(node); visit(node.id); } }
  visit(null);
  for (const node of ordered) {
    if (query && !(node.title+' '+node.question).toLocaleLowerCase('de').includes(query)) continue;
    const button = text('button', node.title); button.type = 'button'; button.className = 'node';
    button.style.setProperty('--indent', `${Math.min(depth(node), 6) * 12}px`);
    button.dataset.kind = node.kind; button.setAttribute('aria-current', String(node.id === selected));
    button.append(text('small', kinds[node.kind])); button.addEventListener('click', () => choose(node.id)); $('nodes').append(button);
  }
  const overview=$('path-overview'); overview.replaceChildren();
  const stages=text('details',''); stages.append(text('summary','Alle Einflussgruppen öffnen · Wachstum, Verarbeitung und weitere Systemfragen'));
  for(const group of STAGE_GROUPS) {
    stages.append(text('h3',group.title)); const row=text('div',''); row.className='influences';
    for(const [id] of group.items) {
      const node=graph.nodes.find(n=>n.id===id); if(!node) continue;
      const card=text('article',''); card.append(relationButton(node.title,id));
      for(const child of graph.nodes.filter(n=>n.parent===id)) card.append(relationButton(child.title,child.id)); row.append(card);
    }
    stages.append(row);
  }
  overview.append(stages);
  const influences=text('div',''); influences.className='influences';
  for (const id of ['environment','material-properties','observer']) {
    const group=text('article',''); group.append(relationButton(graph.nodes.find(n=>n.id===id).title,id));
    for (const node of graph.nodes.filter(n=>n.parent===id)) group.append(relationButton(node.title,node.id)); influences.append(group);
  }
  overview.append(influences);
  const lanes=text('div',''); lanes.className='lanes';
  for (const ids of [['absorption','transport','tissue'],['microbiome','metabolites','host-state']]) {
    const lane=text('article',''); lane.className='lane';
    for (const id of ids) { const node=graph.nodes.find(n=>n.id===id); lane.append(relationButton(node.title,id)); }
    const open=text('div',''); open.className='open-places';
    for (const node of graph.nodes.filter(n=>n.parent===ids[2])) open.append(relationButton(node.title,node.id));
    lane.append(open); lanes.append(lane);
  }
  overview.append(lanes);
  const spare=text('div',''); spare.className='route-places'; spare.append(text('p','Weitere Wege neben der Verteilung'));
  for(const node of graph.nodes.filter(n=>n.parent==='route'&&n.kind==='OPEN')) spare.append(relationButton(node.title,node.id));
  overview.append(spare);
}
function relationButton(label, id) { const button = text('button', label); button.type='button'; button.addEventListener('click', () => choose(id)); return button; }
function renderDetail() {
  const node = graph.nodes.find(n => n.id === selected);
  $('node-title').textContent = node.title; $('node-kind').textContent = kinds[node.kind]; $('node-question').textContent = node.question;
  $('related').replaceChildren();
  if (node.parent) $('related').append(relationButton('← Zusammenhang: '+graph.nodes.find(n => n.id === node.parent).title, node.parent));
  for (const child of graph.nodes.filter(n => n.parent === node.id)) $('related').append(relationButton('Weiter: '+child.title+' →', child.id));
  if (node.source) { const link = text('a', 'Forschungsquelle öffnen ↗'); link.href=node.source; link.target='_blank'; link.rel='noopener noreferrer'; $('related').append(link); }
  $('editing').hidden = node.kind !== 'OPEN'; $('idea-title').value=node.title; $('idea-question').value=node.question;
}
$('node-filter').addEventListener('input', renderGraph);
$('expand').addEventListener('click', () => { graph = expand(graph, selected); persist(); renderGraph(); renderDetail(); });
$('save-idea').addEventListener('click', () => {
  const title=$('idea-title').value.trim(), question=$('idea-question').value.trim();
  if (!title || !question) { $('storage-status').textContent='Bitte eine Überschrift und eine Frage eingeben.'; return; }
  const candidate = { ...graph, nodes:graph.nodes.map(n => n.id===selected ? { ...n, title, question } : { ...n }) };
  validateGraph(candidate); graph=candidate; persist(); renderGraph(); renderDetail();
});
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ ...graph, exportedAt:new Date().toISOString(), interpretation:'RESEARCH_GRAPH_WITH_OPEN_QUESTIONS' },null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='mein-uebergangsfeld.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function readings() {
  $('readings').replaceChildren();
  for (const [label,value] of [['Stärke',state.starch],['Zucker',state.sugar],['Festigkeit',state.firmness]]) {
    const item=text('div',''); item.className='reading'; item.append(text('strong',value.toFixed(3)),text('span',label+' · Modellindex')); $('readings').append(item);
  }
  $('balance').textContent = `Modellzeit ${state.time.toFixed(1)} · Mengenbilanz ${(state.starch+state.sugar+state.other).toFixed(6)} · frei gewählte Parameter`;
  const progress=Math.min(1,(.8-state.starch)/.8);
  $('peel-light').setAttribute('stop-color',`hsl(${102-56*progress} 70% ${57+11*progress}%)`);
  $('peel-dark').setAttribute('stop-color',`hsl(${117-72*progress} 60% ${30+13*progress}%)`);
  $('spots').setAttribute('opacity',String(Math.max(0,(progress-.55)*1.4)));
}
function motion(now) {
  if (last===null) last=now; const dt=Math.min((now-last)/1000,.05); last=now;
  if (running) {
    state=advance(state,dt*.9); $('fruit').setAttribute('transform',`rotate(${Math.sin(now/5000)*2.5} 310 250) translate(0 ${Math.sin(now/3200)*4})`);
    if (now-rendered>140) { readings(); rendered=now; }
  }
  requestAnimationFrame(motion);
}
function pauseLabel() { $('pause').textContent=running?'Bewegung anhalten':'Bewegung starten'; document.body.classList.toggle('paused',!running); }
$('pause').addEventListener('click', () => { running=!running; pauseLabel(); });
$('restart').addEventListener('click', () => { state=initialState(); readings(); });
document.addEventListener('visibilitychange', () => { last=null; });
readings(); renderGraph(); renderDetail(); pauseLabel(); requestAnimationFrame(motion);
