import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSymbolSpan} from './symbol-source-frame.mjs';
test('a section sign binds its source and codepoint while applicability and effect remain separate',()=>{
 const frame=bindSymbolSpan('§',{startUTF16:0,endUTF16:1,language:'JURISTIC_REFERENCE'});assert.deepEqual(frame.span.codePoints,['U+00A7']);assert.equal(frame.role.state,'UNKNOWN');assert.equal(frame.effect.state,'UNKNOWN');assert.equal(frame.authorityEffect,'NONE');
});
test('a property role is a context-bound hypothesis rather than a conclusion from its name',()=>{
 const a=bindSymbolSpan('children: "Close account"',{startUTF16:0,endUTF16:8,language:'DECLARED_UI_SOURCE',roleHypothesis:'RENDER_CONTENT_SLOT'});
 const b=bindSymbolSpan('children: ["other"]',{startUTF16:0,endUTF16:8,language:'DECLARED_UI_SOURCE',roleHypothesis:'RENDER_CONTENT_SLOT'});
 assert.equal(a.role.state,'HYPOTHESIS');assert.notEqual(a.context.contextChecksum,b.context.contextChecksum);assert.equal(a.relation.state,'UNKNOWN');assert.equal(a.syntax.parser,'NOT_RUN');
});
test('UTF-16 spans cannot cut through a scalar or silently repair an invalid range',()=>{
 for(const span of [{startUTF16:0,endUTF16:1},{startUTF16:1,endUTF16:2},{startUTF16:-1,endUTF16:2},{startUTF16:0,endUTF16:3}])assert.throws(()=>bindSymbolSpan('🧬',span));
 assert.deepEqual(bindSymbolSpan('🧬',{startUTF16:0,endUTF16:2}).span.codePoints,['U+1F9EC']);
});
