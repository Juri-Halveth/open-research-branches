// Public project routes and design intentions. These records claim no game or physical effect.
export const PROJECT_UNIVERSE = {
  schema: 'halveth.project-context.v1',
  coverage: 'FINITE_PUBLIC_PROJECT_AND_DECLARED_DESIGN_SNAPSHOT',
  areas: [
    { id:'research', title:'Forschung & Sicherheit', intent:'Fragen, Quellen und autorisierte White-Hat-Arbeit nachvollziehbar verbinden.', href:'https://juri-halveth.github.io/#forschung', source:'https://github.com/Juri-Halveth/open-research-branches', next:'Einen Forschungsast mit Quelle, Gegenprobe und konkretem Prüfstand weiterführen.', state:'PUBLIC_PROJECT_ROUTE' },
    { id:'worlds', title:'Grafik, Figuren & Bewegung', intent:'Organische Formen, überzeugende Menschen, Licht und spürbaren Bodenkontakt gestalten.', href:'https://juri-halveth.github.io/#gestaltung', source:'https://github.com/Juri-Halveth/halveth-morrowind-genesis', next:'Material, Körperproportionen und Fußkontakt an einer konkreten Spielfigur im laufenden Spiel prüfen.', state:'PUBLIC_PROJECT_ROUTE' },
    { id:'learning', title:'Lernen im Alltag', intent:'Eine gemeinsame Lernwelt mit einfachen Wegen für Eltern, Rentner und neugierige Menschen.', href:'https://juri-halveth.github.io/lernstudio/eltern/', source:'https://github.com/Juri-Halveth/lernstudio', next:'Eine alltagsnahe Aufgabe auf Deutsch, Englisch und Russisch verständlich durchführen.', state:'PUBLIC_PROJECT_ROUTE' },
    { id:'software', title:'Software, Glück & neue Ideen', intent:'Möglichkeiten vergleichen und ihre Folgen sichtbar machen; Freude gehört zur Gestaltung.', href:'https://juri-halveth.github.io/#software', source:'https://github.com/Juri-Halveth/fortuna', next:'Eigene steuerbare Optionen und ihre tatsächlichen Ergebnisse vergleichen. Externe Gewinnchancen benötigen ein eigenes Wirkungsmodell.', state:'PUBLIC_PROJECT_ROUTE' },
    { id:'provenance', title:'Herkunft & nachprüfbare Arbeiten', intent:'Eigene Fähigkeiten anhand zugeordneter Arbeiten, Quellen und Prüfstände zeigen.', href:'https://juri-halveth.github.io/#nachweise', source:'https://juri-halveth.github.io/werkzertifikate/', next:'Arbeitsnachweise mit ihrem Quellstand verbinden; formale Qualifikationen mit dem jeweiligen Aussteller belegen.', state:'PUBLIC_PROJECT_ROUTE' }
  ],
  expressions: [
    { id:'relationships', title:'Liebe, Beziehungen & erwachsene Sexualität', intent:'Nähe, Humor, Attraktion und selbstbestimmten Ausdruck als Gestaltungsräume mitnehmen.', areaIds:['worlds','software'], next:'Eine freiwillige, respektvolle Begegnung oder Erzählung mit echter Wahlfreiheit entwerfen.', state:'OPEN_DESIGN' },
    { id:'appearance', title:'Körper, Aussehen & lebendige Identität', intent:'Erscheinung darf sich entwickeln; Bewegung und Reaktion sollen zusammenpassen.', areaIds:['worlds','research'], next:'Anatomie, Material, Animation und Umgebung derselben Figur gemeinsam beurteilen.', state:'OPEN_DESIGN' },
    { id:'cinematic', title:'Film, Klang & Vermittlung', intent:'Licht, Bewegung, Sound und klare Kommunikation zu einem fühlbaren Erlebnis verbinden.', areaIds:['worlds','software','provenance'], next:'Eine kurze Szene mit nachvollziehbaren Übergängen, eigener Gestaltung und geklärter Asset-Herkunft bauen.', state:'OPEN_DESIGN' }
  ],
  additionalRoutes: [
    {label:'FORTUNA öffnen',href:'https://juri-halveth.github.io/fortuna/'},
    {label:'Bewegungskomposition ansehen',href:'https://juri-halveth.github.io/motion/'},
    {label:'Handbuch & Quellen',href:'https://juri-halveth.github.io/handbuch/'}
  ]
};

export function validateProjectUniverse(value) {
  if(value?.schema !== 'halveth.project-context.v1' || !Array.isArray(value.areas) || !Array.isArray(value.expressions)) throw new TypeError('public project context required');
  const ids = new Set();
  for(const record of [...value.areas,...value.expressions]) {
    if(typeof record.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(record.id) || ids.has(record.id)) throw new TypeError('unique project IDs required');
    ids.add(record.id);
    for(const key of ['title','intent','next']) if(typeof record[key] !== 'string' || !record[key].trim()) throw new TypeError(`${key} required`);
  }
  for(const area of value.areas) {
    if(area.state !== 'PUBLIC_PROJECT_ROUTE') throw new TypeError('project route status required');
    for(const key of ['href','source']) {
      const url=new URL(area[key]);
      if(url.protocol !== 'https:' || !['github.com','juri-halveth.github.io'].includes(url.hostname)) throw new TypeError('public source destination required');
    }
  }
  for(const expression of value.expressions) {
    if(expression.state !== 'OPEN_DESIGN' || !Array.isArray(expression.areaIds) || !expression.areaIds.length || expression.areaIds.some(id=>!value.areas.some(area=>area.id===id))) throw new TypeError('design intentions need existing project routes');
  }
  if(!Array.isArray(value.additionalRoutes)) throw new TypeError('additional public routes required');
  for(const route of value.additionalRoutes) {
    if(typeof route.label !== 'string' || !route.label.trim() || typeof route.href !== 'string') throw new TypeError('route label and destination required');
    const url=new URL(route.href);
    if(url.protocol !== 'https:' || !['github.com','juri-halveth.github.io'].includes(url.hostname)) throw new TypeError('public route destination required');
  }
  return value;
}
