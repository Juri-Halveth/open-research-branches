import { createSquareModel, DEFAULT_SOURCE, MAX_BLOCKS, MAX_SOURCE_BYTES } from './core.mjs';
const $ = id => document.getElementById(id);
const text = {
 de:{eyebrow:'ALLE BAUSTEINE · ALLE PAARE', title:'Alles im Quadrat', lede:'Herzen, Smileys, Wörter, Striche und Zahlen. Jeder Baustein steht mit jedem anderen im selben Beziehungsraum.',showAll:'Alle Verbindungen',square:'Das Quadrat',sectors:'4 visuelle Sektoren',graphTitle:'Alle Vergleichspaare zwischen den Bausteinen',matrix:'Jedes mit jedem',matrixCaption:'Vollständige Beziehungsmatrix einschließlich Selbstbezug',squareHint:'Wähle einen Baustein, dann einen zweiten. Alle anderen bleiben sichtbar.',pairLegend:'Vergleichspaar',selfLegend:'Selbstbezug',chosenLegend:'Auswahl',selectionLabel:'IM FOKUS',meaningLabel:'Eigene Bezeichnung für dieses Paar',remember:'Merken',edit:'Bausteine bearbeiten',sourceLabel:'Eine Zeile = ein Baustein. Auch doppelte, leere und reine Leerzeichen-Zeilen bleiben erhalten.',limits:`Bis ${MAX_BLOCKS} Bausteine · ${MAX_SOURCE_BYTES.toLocaleString('de-DE')} UTF-8-Bytes`,apply:'Quadrat aufbauen',sourceRecord:'Quellstand',hashMeaning:'SHA-256 bezieht sich auf die exakten übernommenen Textbytes.',local:'Eingaben und Bezeichnungen bleiben in dieser geöffneten Seite. Nach dem Neuladen beginnt eine neue Sitzung.',footer:'Die Linien zeigen vollständige Vergleichspaare. Eine Bedeutung ergibt sich aus deiner ausdrücklich eingetragenen Bezeichnung.',all:'Alle Bausteine zusammen.',choosePair:'Wähle ein Paar im Quadrat oder in der Matrix.',unassigned:'Bezeichnung offen.',remembered:'Deine Bezeichnung, in dieser Sitzung gemerkt.',empty:'leere Zeile',space:'Leerzeichen',self:'Selbstbezug',error:'Die Eingabe konnte nicht übernommen werden. Der letzte gültige Stand bleibt erhalten.',loading:'Wird aufgebaut …'},
 en:{eyebrow:'EVERY BLOCK · EVERY PAIR',title:'Everything in a square',lede:'Hearts, smileys, words, dashes and numbers. Every block shares the same space of relationships with every other block.',showAll:'All connections',square:'The square',sectors:'4 visual sectors',graphTitle:'All comparison pairs between the blocks',matrix:'Each with every other',matrixCaption:'Complete relationship matrix including self references',squareHint:'Choose one block, then another. All the other blocks stay visible.',pairLegend:'Comparison pair',selfLegend:'Self reference',chosenLegend:'Selection',selectionLabel:'IN FOCUS',meaningLabel:'Your label for this pair',remember:'Keep label',edit:'Edit blocks',sourceLabel:'One line = one block. Repeated, empty and whitespace-only lines are retained.',limits:`Up to ${MAX_BLOCKS} blocks · ${MAX_SOURCE_BYTES.toLocaleString('en-US')} UTF-8 bytes`,apply:'Build square',sourceRecord:'Source snapshot',hashMeaning:'SHA-256 refers to the exact accepted text bytes.',local:'Inputs and labels remain in this open page. Reloading starts a new session.',footer:'The lines show every comparison pair. A meaning comes from the label you explicitly enter.',all:'Every block together.',choosePair:'Choose a pair in the square or matrix.',unassigned:'Label unassigned.',remembered:'Your label, kept for this session.',empty:'empty line',space:'whitespace',self:'self reference',error:'The input could not be accepted. The last valid state is retained.',loading:'Building …'}
};
let lang='de', model=null, selected=[], selectionMode='all', buildSequence=0;
const notes=new Map();
const lines=new Map();
const blockButtons=new Map();
const matrixButtons=[];
const t=key=>text[lang][key];
const element=id=>model.elements.find(e=>e.id===id);
function display(value){return value===''?'␤':/^\s+$/u.test(value)?'␠':value;}
function label(e){return e.text===''?t('empty'):/^\s+$/u.test(e.text)?t('space'):e.text;}
function currentPair(){if(selected.length!==2)return null;return model.pairs.find(p=>selected.includes(p.a)&&selected.includes(p.b));}
function noteKey(pair){return `${model.source.sha256}:${pair.id}`;}
function applyLanguage(){
 document.documentElement.lang=lang;
 document.title=lang==='de'?'HALVETH · Alles im Quadrat':'HALVETH · Everything in a square';
 for(const node of document.querySelectorAll('[data-i18n]')){
  const key=node.dataset.i18n;
  node.textContent=t(key);
  if(key==='title'){const heart=document.createElement('span');heart.className='heart';heart.textContent='♥';node.append(heart);}
 }
 $('lang-de').setAttribute('aria-pressed',String(lang==='de'));
 $('lang-en').setAttribute('aria-pressed',String(lang==='en'));
 if(model)render();
}
function nodePoint(e){
 const board=$('board'),grid=$('blocks'),css=getComputedStyle(grid);
 const pad=parseFloat(css.paddingLeft),gap=parseFloat(css.columnGap),w=board.clientWidth,h=board.clientHeight;
 const cw=(w-2*pad-gap*(model.side-1))/model.side,ch=(h-2*pad-gap*(model.side-1))/model.side;
 return {x:pad+e.col*(cw+gap)+cw/2,y:pad+e.row*(ch+gap)+ch/2};
}
function drawLines(){if(!model)return;const svg=$('connections');svg.setAttribute('viewBox',`0 0 ${$('board').clientWidth} ${$('board').clientHeight}`);for(const p of model.pairs){const a=nodePoint(element(p.a)),b=nodePoint(element(p.b)),line=lines.get(p.id);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);}}
function selectNode(id){selected=selected.length===1&&selected[0]!==id?[selected[0],id]:[id];selectionMode=selected.length===2?'pair':'node';updateSelection();}
function render(){
 $('counts').textContent=lang==='de'?`${model.counts.elements} Bausteine · ${model.counts.unorderedPairs} Paare · ${model.counts.matrixCells} Matrixfelder`:`${model.counts.elements} blocks · ${model.counts.unorderedPairs} pairs · ${model.counts.matrixCells} matrix cells`;
 $('matrix-size').textContent=`${model.counts.elements} × ${model.counts.elements}`;
 $('source-hash').textContent=model.source.sha256;
 const board=$('board');board.style.setProperty('--side',model.side);board.style.setProperty('--sector-split',`${Math.ceil(model.side/2)/model.side*100}%`);board.style.setProperty('--board-min',`${model.side>5?model.side*51:0}px`);board.classList.toggle('dense',model.side>4);
 $('blocks').replaceChildren();blockButtons.clear();
 for(const e of model.elements){const b=document.createElement('button');b.type='button';b.className='block';b.dataset.id=e.id;b.dataset.sector=e.sector;b.style.gridRow=e.row+1;b.style.gridColumn=e.col+1;b.setAttribute('aria-label',`${e.id}: ${label(e)}`);b.title=label(e);const v=document.createElement('span');v.className='block-label';v.textContent=display(e.text);const index=document.createElement('span');index.className='block-index';index.textContent=String(e.row*model.side+e.col+1).padStart(2,'0');index.setAttribute('aria-hidden','true');b.append(v,index);b.addEventListener('click',()=>selectNode(e.id));$('blocks').append(b);blockButtons.set(e.id,b);}
 const svg=$('connections');svg.replaceChildren();const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=t('graphTitle');svg.append(title);lines.clear();for(const p of model.pairs){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.dataset.pairId=p.id;line.classList.add('connection');svg.append(line);lines.set(p.id,line);}
 const table=$('matrix');table.replaceChildren();table.style.setProperty('--matrix-n',model.elements.length);matrixButtons.length=0;const cap=document.createElement('caption');cap.className='sr-only';cap.textContent=t('matrixCaption');table.append(cap);const head=document.createElement('thead'),headRow=document.createElement('tr');const corner=document.createElement('th');corner.setAttribute('scope','col');corner.textContent='↔';headRow.append(corner);for(const e of model.elements){const th=document.createElement('th');th.setAttribute('scope','col');th.textContent=display(e.text);th.title=label(e);headRow.append(th);}head.append(headRow);table.append(head);const tbody=document.createElement('tbody');
 for(let i=0;i<model.elements.length;i++){const row=document.createElement('tr'),th=document.createElement('th');th.setAttribute('scope','row');th.textContent=display(model.elements[i].text);th.title=label(model.elements[i]);row.append(th);for(let j=0;j<model.elements.length;j++){const cell=model.matrix[i*model.elements.length+j],td=document.createElement('td'),b=document.createElement('button');b.type='button';b.dataset.row=i;b.dataset.column=j;b.dataset.kind=cell.kind;const a=model.elements[i],other=model.elements[j];b.setAttribute('aria-label',cell.kind==='SELF'?`${a.id}: ${label(a)} · ${t('self')}`:`${a.id}: ${label(a)} ↔ ${other.id}: ${label(other)}`);b.title=b.getAttribute('aria-label');b.textContent=cell.kind==='SELF'?'↺':'·';b.classList.toggle('self',cell.kind==='SELF');b.addEventListener('click',()=>{selected=cell.kind==='SELF'?[a.id]:[a.id,other.id];selectionMode=cell.kind==='SELF'?'self':'pair';updateSelection();});td.append(b);row.append(td);matrixButtons.push({button:b,cell,a:a.id,b:other.id});}tbody.append(row);}table.append(tbody);
 drawLines();updateSelection();
}
function updateSelection(){
 const pair=currentPair();for(const e of model.elements)blockButtons.get(e.id).setAttribute('aria-pressed',String(selected.includes(e.id)));
 for(const p of model.pairs){const line=lines.get(p.id);line.classList.toggle('neighbor',selected.length===1&&(p.a===selected[0]||p.b===selected[0]));line.classList.toggle('selected',p.id===pair?.id);}
 for(const entry of matrixButtons){const hit=entry.cell.kind==='SELF'?selectionMode==='self'&&selected[0]===entry.a:entry.cell.pairId===pair?.id;entry.button.setAttribute('aria-pressed',String(hit));entry.button.classList.toggle('neighbor',selected.length===1&&(entry.a===selected[0]||entry.b===selected[0]));}
 $('selection-summary').textContent=selected.length===0?t('all'):selectionMode==='self'?`${label(element(selected[0]))} ↔ ${label(element(selected[0]))} · ${t('self')}`:selected.length===1?`${label(element(selected[0]))} ↔ ${model.elements.length-1} ${lang==='de'?'andere Bausteine':'other blocks'}`:`${label(element(selected[0]))} ↔ ${label(element(selected[1]))}`;
 $('meaning').disabled=!pair;$('save-meaning').disabled=!pair;$('meaning').value=pair?(notes.get(noteKey(pair))??''):'';$('meaning-state').textContent=pair?(notes.has(noteKey(pair))?t('remembered'):t('unassigned')):t('choosePair');
}
async function build(){const seq=++buildSequence;$('apply').disabled=true;$('apply').textContent=t('loading');try{const next=await createSquareModel($('source').value);if(seq!==buildSequence)return;model=next;selected=[];selectionMode='all';$('error').hidden=true;render();}catch(error){if(seq!==buildSequence)return;$('error').textContent=`${t('error')} ${error.message}`;$('error').hidden=false;}finally{if(seq===buildSequence){$('apply').disabled=false;$('apply').textContent=t('apply');}}}
function switchLanguage(next){const draft=$('meaning').value;lang=next;applyLanguage();if(currentPair())$('meaning').value=draft;}
$('lang-de').addEventListener('click',()=>switchLanguage('de'));$('lang-en').addEventListener('click',()=>switchLanguage('en'));$('show-all').addEventListener('click',()=>{if(model){selected=[];selectionMode='all';updateSelection();}});$('source-form').addEventListener('submit',e=>{e.preventDefault();build();});$('meaning-form').addEventListener('submit',e=>{e.preventDefault();const pair=currentPair();if(!pair)return;const value=$('meaning').value;if(value==='')notes.delete(noteKey(pair));else notes.set(noteKey(pair),value);updateSelection();});new ResizeObserver(()=>drawLines()).observe($('board'));
$('source').value=DEFAULT_SOURCE;
await build();
