import test from 'node:test';
import assert from 'node:assert/strict';
import {indicateSource} from './indicate-source.mjs';
const proof={id:'F02',operator:'arrive',evidenceState:'OBSERVED_SOURCE_BYTES',authorityEffect:'NONE',source:{excerptSha256:'a'.repeat(64),fileSha256:'b'.repeat(64),url:'https://example.invalid/source'},testUrl:'https://example.invalid/test'};
test('multiple axes retain one source cluster without producing a vulnerability or severity verdict',()=>{
 const result=indicateSource(proof);assert.equal(result.state,'INDICATED');assert.equal(result.axes.length,4);assert.equal(result.independence,'COMMON_SOURCE_CLUSTER_NOT_INDEPENDENT_CONFIRMATIONS');assert.equal(result.vulnerabilityVerdict,'NOT_EVALUATED');assert.equal(result.externalEffects,0);
});
test('a new defined axis extends the model without granting evidence or action authority',()=>{
 const result=indicateSource(proof,{extraAxes:[{id:'MY_NEW_AXIS',definition:'A separately declared research variable',state:'HYPOTHESIS',sourceReference:'own-model-v1'}]});assert.equal(result.axes.length,5);assert.equal(result.axes[4].state,'HYPOTHESIS');assert.equal(result.authorityEffect,'NONE');
 for(const axis of [{id:'SOURCE_BYTES',definition:'collision',state:'DECLARED',sourceReference:'x'},{id:'NEW',definition:'invented effect',state:'OBSERVED',sourceReference:'x'},{id:'NEW',definition:'',state:'UNKNOWN',sourceReference:'x'}])assert.throws(()=>indicateSource(proof,{extraAxes:[axis]}));
});
