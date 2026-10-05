import { initialState, advance, initialGraph, validateAppGraph, expand, STAGE_GROUPS } from './model.mjs';
import { PROJECT_UNIVERSE, validateProjectUniverse } from './project-universe.mjs';
const $ = id => document.getElementById(id);
const KEY = 'halveth-transition-field-v0.2';
const BACKUP_KEY = KEY+'-previous';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let state = initialState(), graph = initialGraph(), selected = 'absorption', running = !reducedMotion.matches, last = null, rendered = 0;
let importCandidate = null, previousGraph = null, unreadableSource = null, importGeneration=0;
const text = (tag, value) => { const el = document.createElement(tag); el.textContent = value; return el; };
const kinds = { DESIGN:'Gestaltungsidee', SOURCE:'Gebundene Quelle', MODEL:'Demonstrationsmodell', RESEARCH:'Forschungsfrage · Quelle weiter prüfen', OPEN:'Offener Forschungsplatz' };
try {
  const stored = localStorage.getItem(KEY);
  if(stored) {
    try { const parsed=JSON.parse(stored); validateAppGraph(parsed); graph=parsed; }
    catch { unreadableSource=stored; $('storage-status').textContent='Gespeicherter Stand passt nicht zur Ansicht. Die Ausgangsfassung ist geöffnet; die gespeicherten Bytes bleiben für eine Sicherung erhalten.'; }
  }
  previousGraph = localStorage.getItem(BACKUP_KEY);
} catch { $('storage-status').textContent='Browserspeicher ist gesperrt. Deine Arbeit lässt sich als JSON mitnehmen.'; }
function syncBackupAction() { $('backup-export').hidden=!(previousGraph || unreadableSource); }
function persist() {
  try {
    if(unreadableSource) { localStorage.setItem(BACKUP_KEY,unreadableSource); previousGraph=unreadableSource; unreadableSource=null; }
    localStorage.setItem(KEY, JSON.stringify(graph)); $('storage-status').textContent = 'Dein Netz ist auf diesem Gerät gespeichert.';
  }
  catch { $('storage-status').textContent = 'Browserspeicher ist gesperrt. Mit „Mein Netz als JSON“ kannst du deine Arbeit mitnehmen.'; }
  syncBackupAction();
}
function depth(node) { let d = 0; while (node.parent) { d++; node = graph.nodes.find(n => n.id === node.parent); } return d; }
function choose(id) {
  const detailHadFocus=$('related').contains(document.activeElement);
  selected=id; updateSelection(); renderDetail();
  if(matchMedia('(max-width:800px)').matches) { $('detail').scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'}); $('node-title').focus({preventScroll:true}); }
  else if(detailHadFocus) $('node-title').focus({preventScroll:true});
}
function updateSelection() {
  for(const button of document.querySelectorAll('[data-node-id]')) button.setAttribute('aria-current',String(button.dataset.nodeId===selected));
}
function renderGraph(overviewChanged=true) {
  const query = $('node-filter').value.toLocaleLowerCase('de'); $('nodes').replaceChildren();
  const ordered=[], children=new Map();
  for(const node of graph.nodes) { if(!children.has(node.parent)) children.set(node.parent,[]); children.get(node.parent).push(node); }
  const stack=[...(children.get(null)||[])].reverse();
  while(stack.length) { const node=stack.pop(); ordered.push(node); stack.push(...[...(children.get(node.id)||[])].reverse()); }
  for (const node of ordered) {
    if (query && !(node.title+' '+node.question).toLocaleLowerCase('de').includes(query)) continue;
    const button = text('button', node.title); button.type = 'button'; button.className = 'node';
    button.style.setProperty('--indent', `${Math.min(depth(node), 6) * 12}px`);
    button.dataset.kind = node.kind; button.dataset.nodeId=node.id; button.setAttribute('aria-current', String(node.id === selected));
    if(node.kind==='OPEN') button.setAttribute('aria-label',node.title+' · '+graph.nodes.find(n=>n.id===node.parent).title);
    button.append(text('small', kinds[node.kind])); button.addEventListener('click', () => choose(node.id)); $('nodes').append(button);
  }
  if(!ordered.some(node=>!query || (node.title+' '+node.question).toLocaleLowerCase('de').includes(query))) $('nodes').append(text('p','Kein Treffer. Leere die Suche, um alle Knoten wieder zu sehen.'));
  if(!overviewChanged) return;
  const overview=$('path-overview'), wasOpen=overview.querySelector('details')?.open; overview.replaceChildren();
  const stages=text('details',''); stages.append(text('summary','Alle Einflussgruppen öffnen · Wachstum, Verarbeitung und weitere Systemfragen'));
  stages.open=Boolean(wasOpen);
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
function relationButton(label, id) {
  const button=text('button',label); button.type='button'; button.dataset.nodeId=id; button.setAttribute('aria-current',String(id===selected));
  const node=graph.nodes.find(n=>n.id===id);
  if(node?.kind==='OPEN') button.setAttribute('aria-label',label+' · '+graph.nodes.find(n=>n.id===node.parent).title);
  button.addEventListener('click',()=>choose(id)); return button;
}
function renderDetail() {
  const node = graph.nodes.find(n => n.id === selected);
  $('node-title').textContent = node.title; $('node-kind').textContent = kinds[node.kind]; $('node-question').textContent = node.question;
  $('related').replaceChildren();
  if (node.parent) $('related').append(relationButton('← Zusammenhang: '+graph.nodes.find(n => n.id === node.parent).title, node.parent));
  for (const child of graph.nodes.filter(n => n.parent === node.id)) $('related').append(relationButton('Weiter: '+child.title+' →', child.id));
  if (node.source) { const link = text('a', 'Forschungsquelle öffnen ↗'); link.href=node.source; link.target='_blank'; link.rel='noopener noreferrer'; $('related').append(link); }
  $('editing').hidden = node.kind !== 'OPEN'; $('idea-title').value=node.title; $('idea-question').value=node.question;
}
$('node-filter').addEventListener('input', () => renderGraph(false));
$('expand').addEventListener('click', () => { graph = expand(graph, selected); persist(); renderGraph(); renderDetail(); });
$('save-idea').addEventListener('click', () => {
  const title=$('idea-title').value.trim(), question=$('idea-question').value.trim();
  if (!title || !question) { $('storage-status').textContent='Bitte eine Überschrift und eine Frage eingeben.'; return; }
  const candidate = { ...graph, nodes:graph.nodes.map(n => n.id===selected ? { ...n, title, question } : { ...n }) };
  validateAppGraph(candidate); graph=candidate; persist(); renderGraph(); renderDetail();
});
function downloadJSON(value,filename) {
  const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('export').addEventListener('click',()=>downloadJSON({ ...graph, exportedAt:new Date().toISOString(), interpretation:'RESEARCH_GRAPH_WITH_OPEN_QUESTIONS' },'mein-uebergangsfeld.json'));
$('backup-export').addEventListener('click',()=>downloadJSON(unreadableSource || previousGraph,'vorheriges-uebergangsfeld.json'));
$('import-file').addEventListener('change',async()=>{
  const generation=++importGeneration;
  importCandidate=null; $('import-apply').disabled=true;
  const file=$('import-file').files[0]; if(!file) return;
  try {
    if(file.size>2*1024*1024) throw new RangeError('Datei über dem lokalen Importlimit von 2 MiB.');
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
    if(generation!==importGeneration) return;
    const candidate=JSON.parse(raw); validateAppGraph(candidate);
    if(candidate.nodes.length>5000) throw new RangeError('Mehr als 5000 Knoten benötigen eine eigene große Netzansicht.');
    importCandidate=candidate; $('import-status').textContent=`${candidate.nodes.length} Knoten geprüft. Übernehmen öffnet diesen Stand; dein bisheriger Stand bleibt vorher als Sicherung erhalten.`; $('import-apply').disabled=false;
  } catch(error) { if(generation===importGeneration) $('import-status').textContent='Datei bleibt unverändert. Import abgewiesen: '+error.message; }
});
$('import-apply').addEventListener('click',()=>{
  if(!importCandidate) return;
  validateAppGraph(importCandidate);
  const previous=unreadableSource || JSON.stringify(graph); previousGraph=previous;
  let backupStored=true;
  try { localStorage.setItem(BACKUP_KEY,previous); }
  catch { backupStored=false; }
  graph=importCandidate; importCandidate=null; unreadableSource=null; selected='absorption';
  $('node-filter').value=''; $('import-apply').disabled=true; persist(); renderGraph(); renderDetail();
  $('import-status').textContent=`${graph.nodes.length} Knoten geöffnet. `+(backupStored?'Den vorherigen Stand kannst du als Sicherung herunterladen.':'Sicherung nur für diese Sitzung verfügbar: lade den vorherigen Stand vor dem Schließen herunter.');
  $('node-title').focus({preventScroll:true});
});
function renderUniverse() {
  validateProjectUniverse(PROJECT_UNIVERSE);
  for(const area of PROJECT_UNIVERSE.areas) {
    const article=text('article',''); article.append(text('h3',area.title),text('p',area.intent),text('p',area.next));
    const link=text('a','Im bestehenden Projekt weitergehen ↗'); link.href=area.href; article.append(link);
    const source=text('a','Quellbestand ↗'); source.href=area.source; article.append(source); $('project-routes').append(article);
  }
  for(const expression of PROJECT_UNIVERSE.expressions) {
    const article=text('article',''); article.append(text('h3',expression.title),text('p',expression.intent),text('p',expression.next));
    const routes=text('div',''); routes.className='expression-routes';
    for(const id of expression.areaIds) { const area=PROJECT_UNIVERSE.areas.find(x=>x.id===id),link=text('a',area.title+' ↗');link.href=area.href;routes.append(link); }
    article.append(routes); $('expression-routes').append(article);
  }
  for(const route of PROJECT_UNIVERSE.additionalRoutes) { const link=text('a',route.label+' ↗');link.href=route.href;$('context-links').append(link); }
}
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
reducedMotion.addEventListener('change',event=>{if(event.matches){running=false;pauseLabel();}});
readings(); renderUniverse(); renderGraph(); renderDetail(); syncBackupAction(); pauseLabel(); requestAnimationFrame(motion);
