import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { buildHubIndex,validateReadLedger } from './build-ai-bootstrap-index.mjs';
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'halveth-ai-index-'));
  t.after(()=>{const resolved=fs.realpathSync(dir);assert.equal(path.dirname(resolved),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('halveth-ai-index-'));fs.rmSync(resolved,{recursive:true,force:true});});
  const git=(...args)=>{const r=spawnSync('git',args,{cwd:dir,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
  git('init');git('config','user.name','Fixture Author');git('config','user.email','fixture.invalid');
  fs.writeFileSync(path.join(dir,'unicode.txt'),'Äuge 🫀\n');fs.writeFileSync(path.join(dir,'opaque.bin'),Buffer.from([255,0,1]));fs.writeFileSync(path.join(dir,'empty.txt'),'');
  git('add','.');git('commit','-m','Bound fixture');return {dir,git};
}
test('every tracked blob is byte-bound and valid Unicode counts are explicit',t=>{
  const {dir}=fixture(t),index=buildHubIndex({cwd:dir});assert.equal(index.counts.trackedEntries,3);
  const text=index.files.find(f=>f.path==='unicode.txt');assert.equal(text.textMetrics.unicodeCodePoints,7);assert.equal(text.textMetrics.wordTokens,1);assert.equal(text.textMetrics.lineCount,2);
  assert.equal(text.semanticReview,'NOT_REVIEWED');assert.equal(index.files.find(f=>f.path==='opaque.bin').contentKind,'OPAQUE_BLOB');assert.equal(index.actions.networkRequests,0);
});
test('worktree edits and untracked files never change the bound commit inventory',t=>{
  const {dir}=fixture(t),before=buildHubIndex({cwd:dir});fs.writeFileSync(path.join(dir,'unicode.txt'),'different');fs.writeFileSync(path.join(dir,'untracked.txt'),'not in source');
  assert.deepEqual(buildHubIndex({cwd:dir}),before);
});
test('a new committed source changes the exact blob binding',t=>{
  const {dir,git}=fixture(t),before=buildHubIndex({cwd:dir});fs.writeFileSync(path.join(dir,'unicode.txt'),'changed');git('add','.');git('commit','-m','New source');const after=buildHubIndex({cwd:dir});
  assert.notEqual(after.source.commit,before.source.commit);assert.notEqual(after.files.find(f=>f.path==='unicode.txt').sha256,before.files.find(f=>f.path==='unicode.txt').sha256);
});
test('partial and overlapping reads retain the rest and cannot double count',t=>{
  const {dir}=fixture(t),index=buildHubIndex({cwd:dir}),f=index.files.find(f=>f.path==='unicode.txt');
  const read=(a,b)=>({path:f.path,sha256:f.sha256,startByte:a,endByte:b});
  const result=validateReadLedger(index,[read(0,4),read(2,6)]),row=result.coverage.find(r=>r.path===f.path);
  assert.equal(row.declaredReadBytes,6);assert.equal(row.remainingBytes,f.byteLength-6);assert.equal(row.state,'DECLARED_PARTIAL_BYTE_READ');assert.equal(result.semanticUnderstandingProven,false);
});
test('invalid read hash, path, range and extra fields are rejected explicitly',t=>{
  const {dir}=fixture(t),index=buildHubIndex({cwd:dir}),f=index.files[0],base={path:f.path,sha256:f.sha256,startByte:0,endByte:f.byteLength};
  for(const r of [{...base,path:'missing'},{...base,sha256:'wrong'},{...base,endByte:f.byteLength+1},{...base,startByte:-1},{...base,extra:true}])assert.throws(()=>validateReadLedger(index,[r]));
});
test('a declared complete byte read does not become understanding or authority',t=>{
  const {dir}=fixture(t),index=buildHubIndex({cwd:dir}),f=index.files[0];const result=validateReadLedger(index,[{path:f.path,sha256:f.sha256,startByte:0,endByte:f.byteLength}]);
  assert.equal(result.coverage.find(r=>r.path===f.path).state,'DECLARED_FULL_BYTE_READ');assert.equal(result.semanticUnderstandingProven,false);
});
test('unsupported refs fail without a silent fallback',t=>{
  const {dir}=fixture(t);for(const ref of ['--all','missing-ref','HEAD\n'])assert.throws(()=>buildHubIndex({cwd:dir,ref}));
});
