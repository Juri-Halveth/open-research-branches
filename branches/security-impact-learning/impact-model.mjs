// A local teaching model. Every result is relative to declared synthetic facts.
const STATES = new Set(['SUPPORTED', 'CONTRADICTED', 'UNKNOWN']);
const AXES = ['expectedPublic', 'protectedProperty', 'unauthorizedEffect', 'productBinding'];
const KEYS = ['id', 'referent', 'scope', 'fixtureKind', 'sources', 'axes', 'effectKind', 'persistent'];
const EFFECTS = new Set(['NONE', 'CONFIDENTIALITY_READ', 'INTEGRITY_CHANGE', 'AVAILABILITY_LOSS']);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
function exact(object, keys, name) {
  if (!plain(object) || Object.keys(object).sort().join('|') !== [...keys].sort().join('|')) throw new TypeError(`${name}: exact fields required`);
}
export function assess(candidate) {
  exact(candidate, KEYS, 'candidate');
  for (const key of ['id', 'referent', 'scope']) if (typeof candidate[key] !== 'string' || !/^[A-Za-z0-9_-]+$/.test(candidate[key])) throw new TypeError(`${key}: bound ASCII ID required`);
  if (candidate.fixtureKind !== 'SYNTHETIC') throw new TypeError('This teaching model accepts only synthetic fixtures');
  if (!EFFECTS.has(candidate.effectKind) || typeof candidate.persistent !== 'boolean') throw new TypeError('effect contract invalid');
  if (!Array.isArray(candidate.sources) || !candidate.sources.length) throw new TypeError('source records required');
  const sources = new Map();
  for (const source of candidate.sources) {
    exact(source, ['id', 'referent', 'scope', 'content', 'cluster'], 'source');
    if (sources.has(source.id) || typeof source.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(source.id)) throw new TypeError('unique source ID required');
    if (source.referent !== candidate.referent || source.scope !== candidate.scope) throw new TypeError('source context mismatch');
    if (typeof source.content !== 'string' || !source.content.trim() || typeof source.cluster !== 'string' || !source.cluster.trim()) throw new TypeError('source content and declared cluster required');
    sources.set(source.id, source);
  }
  exact(candidate.axes, AXES, 'axes');
  for (const axis of AXES) {
    const fact = candidate.axes[axis];exact(fact, ['state', 'sourceIds'], axis);
    if (!STATES.has(fact.state) || !Array.isArray(fact.sourceIds) || new Set(fact.sourceIds).size !== fact.sourceIds.length) throw new TypeError('typed fact required');
    if (fact.state !== 'UNKNOWN' && !fact.sourceIds.length) throw new TypeError('positive or negative fact needs source');
    if (fact.sourceIds.some(id => !sources.has(id))) throw new TypeError('unknown source reference');
  }
  const state = key => candidate.axes[key].state;
  const conflicts = [];
  if (state('expectedPublic') === 'SUPPORTED' && state('unauthorizedEffect') === 'SUPPORTED') conflicts.push('PUBLIC_POLICY_AND_UNAUTHORIZED_EFFECT_REQUIRE_DISCRIMINATION');
  if (candidate.effectKind === 'NONE' && state('unauthorizedEffect') === 'SUPPORTED') conflicts.push('EFFECT_KIND_CONFLICT');
  let route;
  if (conflicts.length) route = 'CONFLICT_REVIEW';
  else if (state('unauthorizedEffect') === 'SUPPORTED' && state('protectedProperty') === 'SUPPORTED') route = state('productBinding') === 'SUPPORTED' ? 'BOUND_IMPACT_CANDIDATE_REVIEW' : 'LOCAL_MODEL_HARDENING_REVIEW';
  else if (state('expectedPublic') === 'SUPPORTED' && state('unauthorizedEffect') === 'CONTRADICTED') route = 'PUBLIC_BEHAVIOR_WITHIN_BOUND_FIXTURE';
  else route = 'HOLD_CLAIM_CONTINUE_SOURCE_REVIEW';
  return {
    candidateId: candidate.id, referent: candidate.referent, scope: candidate.scope,
    route, conflicts, openAxes: AXES.filter(key => state(key) === 'UNKNOWN'),
    inputClass: 'DECLARED_SYNTHETIC_FACTS', truthVerified: false,
    independentSourceProof: false, severity: 'NOT_ASSIGNED', publication: 'NO_ACTION',
    externalEffects: 0, claimCeiling: 'MODEL_DECISION_WITHIN_BOUND_FIXTURE_ONLY'
  };
}
