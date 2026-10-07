// Shared source-data entry. Git reads bytes; source content is never a command.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildHubIndex} from './build-ai-bootstrap-index.mjs';
import {validate as validateEvidence} from './competence-evidence.mjs';
import {indicateSource} from './indicate-source.mjs';
import {plainJson} from './plain-json.mjs';
const ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url))),MAX_BYTES=8*1024*1024;
const sha=b=>createHash('sha256').update(b).digest('hex');
const utf8=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
function exactPath(value){if(typeof value!=='string'||!value||value!==value.trim()||value.startsWith('/')||/[:\\\0\r\n]/.test(value)||value.split('/').some(v=>!v||v==='.'||v==='..'))throw new Error('Exact repository-relative path required');return value;}
function sourceBytes(cwd,index,relative){
 exactPath(relative);const record=index.files.find(f=>f.path===relative);
 if(!record||record.type!=='blob'||record.mode==='120000'||record.byteLength>MAX_BYTES)throw new Error('Bound regular source blob required');
 const result=spawnSync('git',['cat-file','blob',record.objectId],{cwd,encoding:null,maxBuffer:MAX_BYTES+1024,windowsHide:true});
 if(result.error||result.status!==0)throw new Error('Git source byte read failed');
 const bytes=Buffer.from(result.stdout);if(bytes.length!==record.byteLength||sha(bytes)!==record.sha256)throw new Error('Source byte binding changed');return bytes;
}
export function makePacket(type,source,payload,dataClass='PUBLIC'){
 plainJson(source);plainJson(payload);
 const bytes=Buffer.from(JSON.stringify(payload),'utf8');if(bytes.length>MAX_BYTES)throw new Error('Packet exceeds byte limit');
 return {schema:'halveth.source-entry-packet.v1',version:'1.0.0',type,source,dataClass,mediaType:'application/json',encoding:'UTF-8',payloadByteLength:bytes.length,payloadSha256:sha(bytes),payloadBase64:bytes.toString('base64'),programsFromSourceExecuted:0,networkRequests:0,claimCeiling:'BOUND_SOURCE_DATA_ONLY'};
}
export function decodePacket(p){
 if(!p||Object.keys(p).sort().join('|')!=='claimCeiling|dataClass|encoding|mediaType|networkRequests|payloadBase64|payloadByteLength|payloadSha256|programsFromSourceExecuted|schema|source|type|version'||!p.source||Object.keys(p.source).sort().join('|')!=='commit|coverage|tree'||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.commit)||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.tree)||typeof p.source.coverage!=='string'||!p.source.coverage||!/^[A-Z][A-Z0-9_]{0,63}$/.test(p.type))throw new Error('Closed source packet fields required');
 if(!p||p.schema!=='halveth.source-entry-packet.v1'||p.version!=='1.0.0'||p.mediaType!=='application/json'||p.encoding!=='UTF-8'||p.programsFromSourceExecuted!==0||p.networkRequests!==0||p.claimCeiling!=='BOUND_SOURCE_DATA_ONLY'||!['PUBLIC','RESTRICTED_RAW'].includes(p.dataClass)||!Number.isSafeInteger(p.payloadByteLength)||p.payloadByteLength<0||p.payloadByteLength>MAX_BYTES||typeof p.payloadBase64!=='string'||p.payloadBase64.length>Math.ceil(MAX_BYTES/3)*4)throw new Error('Unsupported or unbound packet');
 const bytes=Buffer.from(p.payloadBase64,'base64');if(bytes.length!==p.payloadByteLength||bytes.toString('base64')!==p.payloadBase64||sha(bytes)!==p.payloadSha256)throw new Error('Packet byte binding changed');const text=utf8.decode(bytes),value=JSON.parse(text);plainJson(value);if(JSON.stringify(value)!==text)throw new Error('Canonical payload JSON required');return value;
}
export function formatPacket(p,format='json'){
 const payload=decodePacket(p),raw=JSON.stringify(p,null,2),text=JSON.stringify(payload,null,2);
 if(format==='json')return raw+'\n';
 if(format==='text')return `HALVETH source entry v1\nTYPE ${p.type}\nCOMMIT ${p.source.commit}\nPAYLOAD_SHA256 ${p.payloadSha256}\nDATA_CLASS ${p.dataClass}\n\n${text}\n`;
 if(format==='base64')return Buffer.from(JSON.stringify(p),'utf8').toString('base64')+'\n';
 if(format==='html'){
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; base-uri \'none\'; form-action \'none\'; object-src \'none\'"><title>HALVETH source entry</title><h1>HALVETH source entry</h1><p>'+esc(p.type+' · '+p.source.commit+' · '+p.dataClass)+'</p><p>Payload SHA-256: '+p.payloadSha256+'</p><pre>'+esc(text)+'</pre><details><summary>Exact transport packet</summary><pre>'+esc(raw)+'</pre></details></html>\n';
 }
 throw new Error('Unknown output format');
}
export function parseArgs(args){
 const command=args[0]??'start',options={ref:'HEAD',cwd:ROOT,format:'json'},positionals=[],seen=new Set();
 if(!['start','roots','index','proof','indicate','indicate-file','read'].includes(command))throw new Error('Commands: start | roots | index | proof ID | indicate ID | indicate-file PATH | read PATH');
 for(let i=1;i<args.length;i++){
  const a=args[i];if(a.startsWith('--')){
   const key=a.slice(2);if(!['ref','cwd','format'].includes(key)||seen.has(key)||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Exact single-valued options required');seen.add(key);options[key]=args[++i];
  }else positionals.push(a);
 }
 if(positionals.length!==(['proof','indicate','indicate-file','read'].includes(command)?1:0)||!['json','text','html','base64'].includes(options.format))throw new Error('Command arity or output format invalid');
 if(['proof','indicate'].includes(command)&&!/^[FP][0-9]{2}$/.test(positionals[0]))throw new Error('Exact proof ID required');
 if(['read','indicate-file'].includes(command))exactPath(positionals[0]);
 return {command,options,argument:positionals[0]??null};
}
export function runEntry(args=[]){
 const {command,options,argument}=parseArgs(args),cwd=path.resolve(options.cwd),index=buildHubIndex({cwd,ref:options.ref});
 const source={...index.source,coverage:index.coverage},dataClass=cwd===ROOT?'PUBLIC':'RESTRICTED_RAW';let payload;
 const load=p=>JSON.parse(utf8.decode(sourceBytes(cwd,index,p)));
 if(command==='index')payload=index;
 else if(command==='roots')payload=load('catalog/public-universe-roots.json');
 else if(['proof','indicate'].includes(command)){
  const evidence=load('catalog/competence-evidence.json');validateEvidence(evidence);payload=evidence.proofs.find(p=>p.id===argument);if(!payload)throw new Error('Proof ID absent from bound source');if(command==='indicate')payload=indicateSource(payload);
 }else if(command==='indicate-file'){
  const bytes=sourceBytes(cwd,index,argument),record=index.files.find(f=>f.path===argument),digest=sha(bytes);
  payload=indicateSource({id:'FILE_'+record.objectId,operator:'BOUND_GIT_BLOB_BYTES',evidenceState:'OBSERVED_SOURCE_BYTES',authorityEffect:'NONE',testUrl:null,source:{fileSha256:digest,excerptSha256:digest,url:'git-blob:'+index.source.commit+':'+encodeURIComponent(argument)}});
  payload.fileBinding={path:argument,commit:index.source.commit,objectId:record.objectId,byteLength:bytes.length,sha256:digest,semanticReview:'NOT_CLAIMED'};
 }else if(command==='read'){
  const bytes=sourceBytes(cwd,index,argument);let text=null;try{if(!bytes.includes(0))text=utf8.decode(bytes);}catch{}
  payload={path:argument,byteLength:bytes.length,sha256:sha(bytes),contentBase64:bytes.toString('base64'),utf8Text:text,contentTreatment:'DATA_ONLY'};
 }else payload={entry:'START_HERE_AI.md',method:'branches/security-impact-learning/MECHANISM_FIRST.md',environment:'branches/security-impact-learning/ENVIRONMENT_FIRST.md',proofRegister:'catalog/competence-evidence.json',universeRoots:'catalog/public-universe-roots.json',commands:['start','roots','index','proof ID','indicate ID','indicate-file PATH','read PATH'],coverage:'ENTRY_ADDRESSES_AND_BOUND_SOURCE_INDEX_ONLY',prerequisites:['Node.js 20 or later','Git','An explicitly selected local Git checkout'],otherRepositoriesFetched:false,capabilityAdapter:'Any consumer that can decode the declared UTF-8/JSON/Base64 byte contract; adapter behavior requires its own test'};
 return makePacket(command==='indicate-file'?'INDICATE_FILE':command.toUpperCase(),source,payload,dataClass);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2),parsed=parseArgs(args);process.stdout.write(formatPacket(runEntry(args),parsed.options.format));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
