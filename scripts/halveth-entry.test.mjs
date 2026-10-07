import test from 'node:test';
import assert from 'node:assert/strict';
import {makePacket,decodePacket,formatPacket,parseArgs,runEntry} from './halveth-entry.mjs';
const source={commit:'a'.repeat(40),tree:'b'.repeat(40),coverage:'SYNTHETIC_TEST'};
test('a shared packet preserves Unicode and separates source bytes from execution',()=>{
 const value={label:'Auge · Ä · 🧬',content:'<script>displayed as data</script>'},p=makePacket('TEST',source,value);
 assert.deepEqual(decodePacket(p),value);assert.equal(p.networkRequests,0);assert.equal(p.programsFromSourceExecuted,0);
});
test('changed payload bytes, length and noncanonical Base64 are rejected',()=>{
 for(const mutate of [p=>p.payloadBase64+=' ',p=>p.payloadByteLength++,p=>p.payloadSha256='0'.repeat(64),p=>p.networkRequests=1,p=>p.version='999.0.0']){
  const p=makePacket('TEST',source,{value:'kept'});mutate(p);assert.throws(()=>decodePacket(p));
 }
});
test('undefined values, nonfinite numbers and unpaired Unicode are rejected before serialization',()=>{
 for(const value of [{x:undefined},{x:NaN},{x:-0},{x:()=>1},{x:'\ud800'},new Date(),[1,,3]])assert.throws(()=>makePacket('TEST',source,value));
 const getter=[];Object.defineProperty(getter,0,{enumerable:true,get(){throw Error('Getter was invoked');}});assert.throws(()=>makePacket('TEST',source,getter),/data property/);
});
test('HTML output keeps source markup inert and has no active loader',()=>{
 const html=formatPacket(makePacket('TEST',source,{content:'</pre><script>alert(1)</script>'}),'html');
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes("default-src 'none'"));
});
test('unknown commands, extra values, duplicate flags and path traversal are exact errors',()=>{
 for(const args of [['scan','example.com'],['roots','extra'],['proof','F02','--format','json','--format','text'],['read','../secret'],['index','--format','future'],['proof','F999']])assert.throws(()=>parseArgs(args));
});
test('committed proof lookup retains its original exact source and emits only a data packet',()=>{
 const p=runEntry(['proof','F02']),proof=decodePacket(p);assert.equal(proof.operator,'Fegefeuer.arrive');assert.match(proof.source.url,/#L145-L161$/);assert.equal(p.dataClass,'PUBLIC');
});
test('the universe entry preserves metadata coverage instead of claiming sibling content execution',()=>{
 const roots=decodePacket(runEntry(['roots']));assert.equal(roots.publicRepositoryCount,15);assert.equal(roots.collectionState,'FINITE_SNAPSHOT');
 const start=decodePacket(runEntry(['start']));assert.equal(start.otherRepositoriesFetched,false);assert.equal(start.entry,'START_HERE_AI.md');
});
test('any explicitly selected committed file has its own indication without inventing a function or effect',()=>{
 const p=runEntry(['indicate-file','CODE_DNA.md']),data=decodePacket(p);assert.match(data.sourceProofId,/^FILE_[a-f0-9]{40}$/);assert.equal(data.fileBinding.path,'CODE_DNA.md');assert.equal(data.fileBinding.semanticReview,'NOT_CLAIMED');assert.equal(data.axes.find(a=>a.id==='PRODUCT_EFFECT').state,'UNKNOWN');
});
