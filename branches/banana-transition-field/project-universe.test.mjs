import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECT_UNIVERSE,validateProjectUniverse} from './project-universe.mjs';
test('all five public topic routes and all three declared expression spaces remain connected',()=>{
  assert.equal(validateProjectUniverse(PROJECT_UNIVERSE),PROJECT_UNIVERSE);
  assert.deepEqual(PROJECT_UNIVERSE.areas.map(x=>x.id),['research','worlds','learning','software','provenance']);
  assert.deepEqual(PROJECT_UNIVERSE.expressions.map(x=>x.id),['relationships','appearance','cinematic']);
  assert.equal(PROJECT_UNIVERSE.areas.find(x=>x.id==='learning').href,'https://juri-halveth.github.io/lernstudio/eltern/');
});
test('a dropped connection, duplicate identity or private destination fails before rendering',()=>{
  for(const mutate of [x=>x.expressions[0].areaIds.push('missing'),x=>x.areas[1].id=x.areas[0].id,x=>x.areas[0].source='http://127.0.0.1/private',x=>x.additionalRoutes[0].href='http://127.0.0.1/private',x=>x.additionalRoutes[0].label='']){
    const altered=structuredClone(PROJECT_UNIVERSE);mutate(altered);assert.throws(()=>validateProjectUniverse(altered));
  }
});
