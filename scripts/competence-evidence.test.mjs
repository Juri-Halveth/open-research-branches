import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate} from './competence-evidence.mjs';
const data=JSON.parse(readFileSync(new URL('../catalog/competence-evidence.json',import.meta.url),'utf8'));
test('public competence register binds every source span, project and topic without importing an award',()=>assert.equal(validate(data),true));
test('changed bytes, floating source revisions and unsupported qualifications are rejected',()=>{
 for(const mutate of [d=>d.proofs[0].source.excerpt+='changed',d=>d.proofs[0].source.url=d.proofs[0].source.url.replace(d.proofs[0].source.commit,'main'),d=>d.benchmarks[0].issuerAwardStatus='AWARDED',d=>d.benchmarks[0].authorityEffect='THIRD_PARTY_ACCESS',d=>d.projectCertificates[0].repository='another-project']){
  const d=structuredClone(data);mutate(d);assert.throws(()=>validate(d));
 }
});
