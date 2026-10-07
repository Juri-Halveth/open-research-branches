import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { makeGateway } from './github-knowledge-gateway.mjs';
const name='Juri-Halveth/open-research-branches',sha='a'.repeat(40),blob=createHash('sha1').update('blob 5\0hello').digest('hex'),tree='c'.repeat(40);
function fixture({push=true,truncated=false}={}){
  const calls=[];const request=async(method,p,body)=>{
    calls.push({method,p,body});
    if(p==='user')return {login:'reader'};
    if(p==='repos/'+name)return {full_name:name,default_branch:'main',permissions:{pull:true,push}};
    if(p.includes('/commits/'))return {sha,commit:{tree:{sha:tree}}};
    if(p.includes('/git/trees/'))return {truncated,tree:[{path:'README.md',sha:blob,type:'blob',size:5,mode:'100644'}]};
    if(p.includes('/git/blobs/'))return {sha:blob,encoding:'base64',size:5,content:Buffer.from('hello').toString('base64')};
    if(method==='POST')return {ref:body.ref};if(method==='PUT')return {commit:{sha},content:{sha:blob}};
    throw new Error('unexpected transport path');
  };return {calls,request,gateway:makeGateway({request,allowedRepositories:[name]})};
}
test('login is bound to server-provided repo permissions and exact source commit',async()=>{
  const {gateway,calls}=fixture();const r=await gateway.read(name,'README.md');assert.equal(r.utf8Text,'hello');assert.equal(r.commit,sha);assert.equal(r.dataOnly,true);assert.equal(r.programExecuted,false);assert.ok(calls.every(c=>c.method==='GET'));
});
test('unselected repo and traversal paths never reach the transport',async()=>{
  const {gateway,calls}=fixture();await assert.rejects(gateway.inventory('someone/else'));await assert.rejects(gateway.read(name,'../outside'));assert.equal(calls.length,0);
});
test('an incomplete tree cannot masquerade as complete knowledge',async()=>{
  const {gateway}=fixture({truncated:true});await assert.rejects(gateway.inventory(name),/incomplete/);
});
test('a read-capable login cannot create a contribution branch without push permission',async()=>{
  const {gateway,calls}=fixture({push:false});await assert.rejects(gateway.write(name,'note.md',{branch:'codex/note',content:'text',message:'Note'}),/write permission/);assert.ok(calls.every(c=>c.method==='GET'));
});
test('writer creates a separate branch and binds the existing blob for an update',async()=>{
  const {gateway,calls}=fixture();const r=await gateway.write(name,'README.md',{branch:'codex/note',content:'new text',message:'Note'});const put=calls.find(c=>c.method==='PUT');assert.equal(put.body.sha,blob);assert.equal(put.body.branch,'codex/note');assert.equal(r.merged,false);
});
test('default branch names and key material are rejected before transport',async()=>{
  const {gateway,calls}=fixture();await assert.rejects(gateway.write(name,'note.md',{branch:'main',content:'text',message:'Note'}));await assert.rejects(gateway.write(name,'private.key',{branch:'codex/note',content:'text',message:'Note'}));assert.equal(calls.length,0);
});
test('a failed branch creation is not replaced by ref reset or another write',async()=>{
  const calls=[];const gateway=makeGateway({allowedRepositories:[name],request:async(m,p,b)=>{calls.push(m);if(m==='POST')throw new Error('collision');if(p.includes('/git/trees/'))return {truncated:false,tree:[]};return m==='GET'&&p==='user'?{login:'reader'}:p==='repos/'+name?{full_name:name,default_branch:'main',permissions:{pull:true,push:true}}:{sha,commit:{tree:{sha:tree}}};}});
  await assert.rejects(gateway.write(name,'note.md',{branch:'codex/note',content:'text',message:'Note'}),/collision/);assert.ok(calls.includes('POST'));assert.ok(!calls.includes('PUT'));
});
test('an explicit branch/commit read stays pinned and forged blob bytes fail',async()=>{
  const {gateway,calls}=fixture();await gateway.read(name,'README.md',{ref:'codex/read-source'});assert.ok(calls.some(c=>c.p.endsWith('codex%2Fread-source')));
  const f=fixture();const bad=makeGateway({allowedRepositories:[name],request:async(m,p,b)=>p.includes('/git/blobs/')?{sha:blob,encoding:'base64',size:5,content:Buffer.from('wrong').toString('base64')}:f.request(m,p,b)});
  await assert.rejects(bad.read(name,'README.md'),/do not match/);
});
