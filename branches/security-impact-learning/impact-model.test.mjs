import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { assess } from './impact-model.mjs';
const fixtures = JSON.parse(fs.readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
test('public readable metadata is not upgraded by neighboring denied controls', () => {
  const result=assess(fixtures[0]);assert.equal(result.route,'PUBLIC_BEHAVIOR_WITHIN_BOUND_FIXTURE');assert.equal(result.severity,'NOT_ASSIGNED');
});
test('unknown policy remains open rather than becoming zero or closed', () => {
  const result=assess(fixtures[1]);assert.equal(result.route,'HOLD_CLAIM_CONTINUE_SOURCE_REVIEW');assert.ok(result.openAxes.includes('protectedProperty'));
});
test('a declared protected read does not require persistence', () => {
  assert.equal(fixtures[2].persistent,false);assert.equal(assess(fixtures[2]).route,'BOUND_IMPACT_CANDIDATE_REVIEW');
});
test('unbound deployment retains a local hardening route', () => {
  assert.equal(assess(fixtures[3]).route,'LOCAL_MODEL_HARDENING_REVIEW');
});
test('source context cannot silently cross scopes or referents', () => {
  for(const key of ['scope','referent']){const c=structuredClone(fixtures[0]);c.sources[0][key]='OTHER';assert.throws(()=>assess(c),/context mismatch/);}
});
test('source reference, evidence state and required fields are exact', () => {
  for(const mutate of [c=>delete c.scope,c=>c.extra=true,c=>c.axes.expectedPublic.state='TRUE',c=>c.axes.expectedPublic.sourceIds=['missing'],c=>c.axes.expectedPublic.sourceIds=[]]){
    const c=structuredClone(fixtures[0]);mutate(c);assert.throws(()=>assess(c));
  }
});
test('declared cluster labels never become independent corroboration', () => {
  const c=structuredClone(fixtures[2]);c.sources.push({...c.sources[0],id:'second',cluster:'different-label'});
  assert.equal(assess(c).independentSourceProof,false);assert.equal(assess(c).truthVerified,false);
});
test('policy/effect contradiction is retained as a conflict', () => {
  const c=structuredClone(fixtures[2]);c.axes.expectedPublic.state='SUPPORTED';assert.equal(assess(c).route,'CONFLICT_REVIEW');
});
test('synthetic fixture does not authorize external effects or submission', () => {
  for(const c of fixtures){const r=assess(c);assert.equal(r.externalEffects,0);assert.equal(r.publication,'NO_ACTION');}
  const c=structuredClone(fixtures[0]);c.fixtureKind='LIVE';assert.throws(()=>assess(c),/only synthetic/);
});
test('evaluation leaves the supplied source records unchanged', () => {
  const c=structuredClone(fixtures[0]);const before=JSON.stringify(c);assess(c);assert.equal(JSON.stringify(c),before);
});
