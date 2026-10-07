import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const MAX_FILE_BYTES=8*1024*1024, MAX_TOTAL_BYTES=128*1024*1024;
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function git(cwd,args,input=null){
  const r=spawnSync('git',args,{cwd,input,encoding:null,maxBuffer:MAX_TOTAL_BYTES+8*1024*1024,windowsHide:true});
  if(r.error)throw r.error;if(r.status!==0)throw new Error(`Git source read failed: ${r.stderr.toString('utf8').trim()}`);return r.stdout;
}
function revision(cwd,ref){
  if(typeof ref!=='string'||!ref||ref.startsWith('-')||/[\0\r\n]/.test(ref))throw new TypeError('explicit safe Git ref required');
  const id=git(cwd,['rev-parse','--verify',`${ref}^{commit}`]).toString('ascii').trim();
  if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(id))throw new Error('invalid resolved commit');return id;
}
export function buildHubIndex({cwd=root,ref='HEAD'}={}){
  const commit=revision(cwd,ref), tree=git(cwd,['rev-parse',`${commit}^{tree}`]).toString('ascii').trim();
  const raw=git(cwd,['ls-tree','-r','-z','--full-tree',commit]);
  const entries=raw.toString('utf8').split('\0').filter(Boolean).map(line=>{
    const tab=line.indexOf('\t');if(tab<0)throw new Error('invalid tree record');
    const [mode,type,objectId]=line.slice(0,tab).split(' ');const p=line.slice(tab+1);
    if(p.includes('\uFFFD')||p.startsWith('/')||p.split('/').some(s=>s==='..'||s==='.'||!s))throw new Error('unrepresentable path');
    return {path:p,mode,type,objectId};
  }).sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path)));
  const blobs=entries.filter(e=>e.type==='blob'),ids=[...new Set(blobs.map(e=>e.objectId))];
  if(ids.length){
    const meta=git(cwd,['cat-file','--batch-check'],ids.join('\n')+'\n').toString('ascii').trim().split('\n');
    let total=0;for(const line of meta){const [id,type,size]=line.split(' ');const n=Number(size);if(!ids.includes(id)||type!=='blob'||!Number.isSafeInteger(n)||n<0||n>MAX_FILE_BYTES)throw new Error('blob limit or metadata violation');total+=n;}
    if(meta.length!==ids.length||total>MAX_TOTAL_BYTES)throw new Error('bounded inventory limit exceeded');
  }
  const data=new Map();
  if(ids.length){
    const batch=git(cwd,['cat-file','--batch'],ids.join('\n')+'\n');let cursor=0;
    for(const expected of ids){
      const end=batch.indexOf(10,cursor);if(end<0)throw new Error('truncated batch header');
      const [id,type,size]=batch.subarray(cursor,end).toString('ascii').split(' ');const n=Number(size);
      if(id!==expected||type!=='blob'||!Number.isSafeInteger(n)||n<0||n>MAX_FILE_BYTES||end+1+n>=batch.length)throw new Error('batch binding violation');
      const bytes=batch.subarray(end+1,end+1+n);if(batch[end+1+n]!==10)throw new Error('batch terminator missing');
      data.set(id,bytes);cursor=end+2+n;
    }
    if(cursor!==batch.length)throw new Error('unexpected batch tail');
  }
  const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
  const files=entries.map(e=>{
    if(e.type!=='blob')return {...e,contentKind:'SUBMODULE_OR_NON_BLOB',byteLength:null,sha256:null,textMetrics:null,semanticReview:'NOT_REVIEWED'};
    const bytes=data.get(e.objectId);let textMetrics=null,contentKind=e.mode==='120000'?'SYMLINK_BLOB':'OPAQUE_BLOB';
    if(e.mode!=='120000'&&!bytes.includes(0))try{
      const text=decoder.decode(bytes);contentKind='UTF8_TEXT';
      textMetrics={unicodeCodePoints:[...text].length,wordTokens:[...text.matchAll(/\p{L}[\p{L}\p{M}\p{N}_]*|\p{N}+/gu)].length,lineCount:text.length?text.split('\n').length:0};
    }catch{/* Opaque bytes stay visible; decoding never falls back silently. */}
    return {...e,contentKind,byteLength:bytes.length,sha256:digest(bytes),textMetrics,semanticReview:'NOT_REVIEWED'};
  });
  return {schema:'halveth.ai-bootstrap-index.v1',source:{commit,tree},processing:'GIT_BLOB_BYTES_HASHED_AND_VALID_UTF8_COUNTED',
    wordDefinition:'Unicode letter followed by letters/marks/numbers/underscore, or a run of numbers',
    files,counts:{trackedEntries:files.length,blobs:blobs.length,utf8Texts:files.filter(e=>e.contentKind==='UTF8_TEXT').length,bytes:files.reduce((s,e)=>s+(e.byteLength??0),0),unicodeCodePoints:files.reduce((s,e)=>s+(e.textMetrics?.unicodeCodePoints??0),0),wordTokens:files.reduce((s,e)=>s+(e.textMetrics?.wordTokens??0),0)},
    coverage:'ALL_RECURSIVE_TREE_ENTRIES_AT_ONE_BOUND_COMMIT',
    excluded:['UNTRACKED_WORKTREE','UNREACHABLE_HISTORY','OTHER_REPOSITORY_BODIES','ISSUES_AND_DISCUSSIONS','LFS_MEDIA_BEYOND_POINTER_BLOB','SUBMODULE_CONTENT'],
    actions:{networkRequests:0,sourceWrites:0,programsFromRepositoryExecuted:0},claimCeiling:'BOUND_BYTE_INVENTORY_AND_DEFINED_TEXT_COUNTS_NOT_SEMANTIC_UNDERSTANDING'};
}
export function validateReadLedger(index,records){
  if(index?.schema!=='halveth.ai-bootstrap-index.v1'||!Array.isArray(index.files)||!Array.isArray(records))throw new TypeError('index and declared read ledger required');
  const files=new Map(index.files.map(f=>[f.path,f])),ranges=new Map();
  for(const r of records){
    if(!r||Object.keys(r).sort().join('|')!=='endByte|path|sha256|startByte')throw new TypeError('exact byte-read fields required');
    const f=files.get(r.path);if(!f||f.type!=='blob'||r.sha256!==f.sha256)throw new Error('read source binding mismatch');
    if(!Number.isSafeInteger(r.startByte)||!Number.isSafeInteger(r.endByte)||r.startByte<0||r.endByte<r.startByte||r.endByte>f.byteLength||(r.endByte===r.startByte&&f.byteLength!==0))throw new Error('read range invalid');
    const list=ranges.get(r.path)??[];list.push([r.startByte,r.endByte]);ranges.set(r.path,list);
  }
  const coverage=index.files.filter(f=>f.type==='blob').map(f=>{
    const list=(ranges.get(f.path)??[]).sort((a,b)=>a[0]-b[0]);let covered=0,start=null,end=null;
    for(const [a,b] of list){if(start===null){start=a;end=b;}else if(a<=end)end=Math.max(end,b);else{covered+=end-start;start=a;end=b;}}
    if(start!==null)covered+=end-start;
    return {path:f.path,declaredReadBytes:covered,remainingBytes:f.byteLength-covered,state:ranges.has(f.path)&&covered===f.byteLength?'DECLARED_FULL_BYTE_READ':covered?'DECLARED_PARTIAL_BYTE_READ':'UNREAD'};
  });
  return {sourceCommit:index.source.commit,coverage,claimCeiling:'DECLARED_BYTE_READ_COVERAGE_ONLY',semanticUnderstandingProven:false};
}
const invoked=process.argv[1]?path.resolve(process.argv[1]):null;
if(invoked===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--ref'))throw new Error('usage: node scripts/build-ai-bootstrap-index.mjs [--ref HEAD]');console.log(JSON.stringify(buildHubIndex({ref:args[1]??'HEAD'}),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
