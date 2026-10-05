// Original demonstrator. Parameters are illustrative, dimensionless, uncalibrated.
export const VERSION = '0.2.0';
// This UI/storage contract is independent of the model version. It validates;
// a future migration must be a separately named operation, never a fallback.
export const APP_GRAPH_CONTRACT = 'halveth-transition-field-ui-1';
export const STAGE_GROUPS = [
  { parent:'material', title:'Vor der Reifung: Wachstum', items:[['genetics','Genetik & Sorte'],['growth-environment','Pflanze & Umwelt'],['development-time','Entwicklungszeit']] },
  { parent:'ripening', title:'Materialzustand', items:[['composition','Zusammensetzung'],['structure','Struktur'],['signal','Signal & Regulation']] },
  { parent:'ripening', title:'Veränderung während der Reifung', items:[['chemistry','Chemie'],['texture','Textur'],['information','Sichtbare Information']] },
  { parent:'chewing', title:'Form und Oberfläche', items:[['particle-size','Partikelgröße'],['saliva','Speichel'],['mixing','Mischung']] },
  { parent:'gastric', title:'Magenumgebung', items:[['gastric-mechanics','Mechanik'],['gastric-chemistry','Chemische Umgebung'],['gastric-biology','Biologische Einflüsse']] },
  { parent:'host-digestion', title:'Vor der Verteilung', items:[['enzymatic','Enzymatische Verarbeitung'],['intestinal-transport','Transport'],['modulation','Regulation & Modulation']] },
  { parent:'route', title:'Weitere Systemfragen', items:[['signaling','Signalwege'],['ecology','Umwelt & Kreisläufe'],['transformation','Weitere Transformation']] },
  { parent:'material', title:'Weiterer Untersuchungsraum', items:[['energy','Energie & Mengenbilanz'],['health','Gesundheit: messbare Endpunkte'],['adaptation','Anpassung & zeitlicher Verlauf']] }
];
function finite(value, name, minimum = 0, maximum = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum)
    throw new RangeError(`${name}: finite number in [${minimum}, ${maximum}] required`);
  return value;
}
export function initialState() {
  return { time: 0, starch: .8, sugar: .1, other: .1, ethylene: .08, firmness: .9, aroma: .08 };
}
export function advance(state, dt, rate = .18) {
  finite(dt, 'dt', 0, 100); finite(rate, 'rate', 0, 1);
  for (const key of ['starch', 'sugar', 'other', 'ethylene', 'firmness', 'aroma']) finite(state[key], key, 0, 1);
  finite(state.time, 'time');
  if (Math.abs(state.starch + state.sugar + state.other - 1) > 1e-9) throw new RangeError('material balance must total one');
  if (dt === 0) return { ...state };
  const ethylene = 1 - (1 - state.ethylene) * Math.exp(-rate * dt);
  const flux = state.starch * (1 - Math.exp(-rate * (.3 + (ethylene + state.ethylene) / 2) * dt));
  return { time: state.time + dt, starch: state.starch - flux,
    sugar: state.sugar + .75 * flux, other: state.other + .25 * flux, ethylene,
    firmness: state.firmness * Math.exp(-.08 * dt),
    aroma: 1 - (1 - state.aroma) * Math.exp(-.1 * dt) };
}
export function exchange(amounts, dt, coupling = .2) {
  if (!Array.isArray(amounts) || amounts.length !== 3) throw new TypeError('three compartments required');
  // for...of observes sparse array holes as undefined, so they are rejected.
  for (const amount of amounts) finite(amount, 'amount');
  finite(dt, 'dt', 0, 100); finite(coupling, 'coupling', 0, 1);
  const out = [...amounts];
  const fraction = (1 - Math.exp(-2 * coupling * dt)) / 2;
  for (const [a, b] of [[0, 1], [1, 2]]) {
    const flux = fraction * (out[a] - out[b]); out[a] -= flux; out[b] += flux;
  }
  return out;
}
const n = (id, title, parent, kind, question, source = null) => ({ id, title, parent, kind, question, source });
export function initialGraph() {
  const nodes = [
    n('material', 'Material in Bewegung', null, 'DESIGN', 'Welche Zustände verändern sich gemeinsam?'),
    n('ripening', 'Reifung', 'material', 'SOURCE', 'Wie verändern sich Stärke, Zucker und Festigkeit?', 'https://pubmed.ncbi.nlm.nih.gov/34237070/'),
    n('chewing', 'Form & Oberfläche', 'ripening', 'MODEL', 'Wie verändert Verarbeitung die Zugänglichkeit?'),
    n('gastric', 'Magenumgebung', 'chewing', 'RESEARCH', 'Welche Wirkung haben Umgebung und Verweildauer?'),
    n('host-digestion', 'Verdauung & Verteilung', 'gastric', 'RESEARCH', 'Welche Stoffe gelangen auf welchen Wegen weiter?'),
    n('route', 'Routen & Einflussgrößen', 'host-digestion', 'RESEARCH', 'Welche Quelle würde eine Verteilung belegen?'),
    n('absorption', 'Aufnahme', 'route', 'RESEARCH', 'Aufnahme welcher Substanz, durch welchen Mechanismus?'),
    n('microbiome', 'Mikrobiom', 'route', 'RESEARCH', 'Welche Substrate erreichen welche Mikroorganismen?'),
    n('metabolites', 'Umwandlungsprodukte', 'microbiome', 'RESEARCH', 'Welche Produkte, Mengen und Zeitverläufe?'),
    n('host-state', 'Zustand im Körper', 'metabolites', 'RESEARCH', 'Welche Wirkung lässt sich tatsächlich messen?'),
    n('transport', 'Transport nach Aufnahme', 'absorption', 'RESEARCH', 'Wohin gelangt die jeweilige Substanz?'),
    n('tissue', 'Verteilung im Gewebe', 'transport', 'RESEARCH', 'Welche Aufnahme, Nutzung oder Speicherung folgt?')
  ];
  for (const [id, title, question] of [
    ['environment', 'Umgebung', 'Temperatur, pH und Zeit: welche Bedingungen sind gebunden?'],
    ['material-properties', 'Materialeigenschaften', 'Menge, Struktur und Zugänglichkeit: was ist gemessen?'],
    ['observer', 'Beobachtung', 'Welche Methode erkennt welche Änderung?']
  ]) nodes.push(n(id, title, 'host-digestion', 'RESEARCH', question));
  for (const group of STAGE_GROUPS) {
    for (const [id,title] of group.items) {
      nodes.push(n(id,title,group.parent,'RESEARCH',`${title}: Welche Größe, Bedingungen, Zeit und Quelle würden die Verbindung prüfbar machen?`));
      for (let i=1;i<=3;i++) nodes.push(n(`${id}-open-${i}`,`Offener Ast ${i}`,id,'OPEN','Welche weitere Frage oder Verbindung gehört dazu?'));
    }
  }
  for (const parent of ['environment', 'material-properties', 'observer', 'route', 'tissue', 'host-state']) {
    for (let i = 1; i <= 3; i++) nodes.push(n(`${parent}-open-${i}`, `Offener Ast ${i}`, parent, 'OPEN', 'Welche weitere Verbindung könnte hier wichtig sein?'));
  }
  return { version: VERSION, nodes };
}
export function validateGraph(graph) {
  if (!graph || graph.version !== VERSION || !Array.isArray(graph.nodes)) throw new TypeError('unsupported graph');
  const ids = new Set();
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !/^[a-z0-9-]+$/.test(node.id) || ids.has(node.id)) throw new TypeError('invalid or duplicate id');
    if (!['DESIGN', 'SOURCE', 'MODEL', 'RESEARCH', 'OPEN'].includes(node.kind)) throw new TypeError('unknown node kind');
    if (typeof node.title !== 'string' || !node.title.trim() || node.title.length > 200 || typeof node.question !== 'string' || node.question.length > 2000) throw new TypeError('invalid node text');
    if (node.source !== null) {
      let source;
      try { source = typeof node.source === 'string' ? new URL(node.source) : null; }
      catch { throw new TypeError('invalid source'); }
      if (!source || source.protocol !== 'https:' || !source.hostname) throw new TypeError('invalid source');
    }
    // Parent-first order guarantees a finite acyclic graph, preserving every existing node.
    if (node.parent !== null && !ids.has(node.parent)) throw new TypeError('unbound parent');
    if (node.parent === null && ids.size !== 0) throw new TypeError('one root required');
    ids.add(node.id);
  }
  if (!ids.size) throw new TypeError('empty graph');
  return true;
}
export function validateAppGraph(graph) {
  validateGraph(graph);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  for (const basis of initialGraph().nodes) {
    const node = nodes.get(basis.id);
    if (!node || node.parent !== basis.parent || node.kind !== basis.kind || node.source !== basis.source)
      throw new TypeError(`${APP_GRAPH_CONTRACT}: missing or changed basis binding ${basis.id}`);
  }
  // Additional user branches and editable question text are retained exactly.
  return true;
}
export function expand(graph, parent, count = 3) {
  validateGraph(graph); finite(count, 'count', 1, 30);
  if (!Number.isInteger(count) || !graph.nodes.some(node => node.id === parent)) throw new TypeError('invalid expansion');
  const out = { version: graph.version, nodes: graph.nodes.map(node => ({ ...node })) };
  const ids = new Set(out.nodes.map(node => node.id));
  let index = 1;
  for (let added = 0; added < count; index++) {
    const id = `${parent}-open-${index}`;
    if (ids.has(id)) continue;
    out.nodes.push(n(id, `Offener Ast ${index}`, parent, 'OPEN', 'Welche weitere Verbindung könnte hier wichtig sein?'));
    ids.add(id); added++;
  }
  return out;
}
