// GitHub-native data access. The authenticated caller keeps GitHub's own rights.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const OWNER='Juri-Halveth', MAX_BYTES=8*1024*1024;
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function boundPath(p){
  if(typeof p!=='string'||!p||p!==p.trim()||p.startsWith('/')||p.includes('\\')||p.split('/').some(x=>x==='.'||x==='..'||!x)||/[\0\r\n]/.test(p))throw new TypeError('bound repository-relative path required');return p;
}
function repository(name,allowed){
  if(typeof name!=='string'||!allowed.includes(name)||!name.startsWith(OWNER+'/'))throw new Error('repository not in selected universe');return name;
}
export function makeGateway({request,allowedRepositories}){
  if(typeof request!=='function'||!Array.isArray(allowedRepositories))throw new TypeError('bound API transport and universe required');
  async function context(name,write=false){
    repository(name,allowedRepositories);
    const actor=await request('GET','user'),repo=await request('GET','repos/'+name);
    if(typeof actor?.login!=='string'||!actor.login||repo?.full_name!==name)throw new Error('GitHub identity or repository binding failed');
    if(repo.permissions?.pull!==true)throw new Error('GitHub read permission unavailable');
    if(write&&repo.permissions?.push!==true)throw new Error('GitHub write permission unavailable');
    return {actor,repo};
  }
  async function inventory(name,{ref=null}={}){
    if(ref!==null&&(typeof ref!=='string'||!ref||ref.startsWith('-')||/[\0\r\n]/.test(ref)))throw new Error('explicit source ref invalid');
    const {actor,repo}=await context(name);const head=await request('GET','repos/'+name+'/commits/'+encodeURIComponent(ref??repo.default_branch));
    if(!/^[a-f0-9]{40}$/.test(head?.sha??'')||!/^[a-f0-9]{40}$/.test(head?.commit?.tree?.sha??''))throw new Error('commit binding invalid');
    const tree=await request('GET','repos/'+name+'/git/trees/'+head.commit.tree.sha+'?recursive=1');
    if(tree.truncated!==false||!Array.isArray(tree.tree))throw new Error('incomplete GitHub tree; coverage remains open');
    return {actor:actor.login,repository:name,commit:head.sha,tree:head.commit.tree.sha,files:tree.tree.filter(e=>e.type==='blob').map(e=>({path:boundPath(e.path),objectId:e.sha,bytes:e.size,mode:e.mode})),coverage:'ONE_COMPLETE_GITHUB_TREE_METADATA_ONLY',semanticUnderstandingProven:false};
  }
  async function read(name,p,{ref=null}={}){
    boundPath(p);const index=await inventory(name,{ref}),file=index.files.find(f=>f.path===p);if(!file)throw new Error('path not in bound tree');
    if(file.mode==='120000')throw new Error('symlink source is not followed');
    if(!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>MAX_BYTES)throw new Error('file exceeds bounded text/data reader; use authenticated artifact download');
    const blob=await request('GET','repos/'+name+'/git/blobs/'+file.objectId);
    if(blob.sha!==file.objectId||blob.encoding!=='base64'||blob.size!==file.bytes||typeof blob.content!=='string')throw new Error('blob binding invalid');
    const encoded=blob.content.replace(/\s/g,''),bytes=Buffer.from(encoded,'base64');
    if(bytes.length!==file.bytes||bytes.toString('base64')!==encoded)throw new Error('blob size or canonical base64 mismatch');
    const gitBlobId=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if(gitBlobId!==file.objectId)throw new Error('Git blob bytes do not match the bound object');
    let text=null;try{if(!bytes.includes(0))text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{}
    return {actor:index.actor,repository:name,commit:index.commit,path:p,objectId:file.objectId,bytes:bytes.length,sha256:hash(bytes),contentBase64:bytes.toString('base64'),utf8Text:text,dataOnly:true,programExecuted:false,authorityEffect:'NONE_FROM_SOURCE_CONTENT'};
  }
  async function write(name,p,{branch,message,content}){
    boundPath(p);if(typeof branch!=='string'||!/^codex\/[a-z0-9][a-z0-9._/-]*$/.test(branch)||branch.includes('..')||branch.endsWith('/'))throw new Error('explicit codex contribution branch required');
    if(typeof message!=='string'||!message.trim()||typeof content!=='string'||Buffer.byteLength(content)>MAX_BYTES)throw new Error('bounded source text and commit message required');
    if(/(?:^|\/)(?:\.env(?:\.|$)|keys\/)|\.(?:key|pem|pfx|p12|pcap|har)$/i.test(p)||/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AGE-SECRET-KEY-|\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(content))throw new Error('credential/raw-capture publication is outside the source writer');
    const {actor,repo}=await context(name,true);if(branch===repo.default_branch)throw new Error('default branch writes disabled');
    const head=await request('GET','repos/'+name+'/commits/'+encodeURIComponent(repo.default_branch));
    if(!/^[a-f0-9]{40}$/.test(head?.sha??''))throw new Error('base commit invalid');
    const tree=await request('GET','repos/'+name+'/git/trees/'+head.commit.tree.sha+'?recursive=1');
    if(tree.truncated!==false||!Array.isArray(tree.tree))throw new Error('base tree incomplete; no write performed');
    const prior=tree.tree.find(e=>e.path===p);
    if(prior&&prior.type!=='blob')throw new Error('target path is not a source file');
    if(prior?.mode==='120000')throw new Error('symlink source is not rewritten');
    // A branch collision is an error; never reset another contributor's ref.
    await request('POST','repos/'+name+'/git/refs',{ref:'refs/heads/'+branch,sha:head.sha});
    const body={message,content:Buffer.from(content).toString('base64'),branch};if(prior)body.sha=prior.sha;
    const written=await request('PUT','repos/'+name+'/contents/'+p.split('/').map(encodeURIComponent).join('/'),body);
    if(!written?.commit?.sha||!written?.content?.sha)throw new Error('write receipt incomplete');
    return {actor:actor.login,repository:name,branch,path:p,baseCommit:head.sha,commit:written.commit.sha,objectId:written.content.sha,contentSha256:hash(Buffer.from(content)),state:'CONTRIBUTION_BRANCH_WRITTEN',merged:false,sourceContentExecuted:false};
  }
  return {inventory,read,write};
}
export async function ghTransport(method,endpoint,body){
  if(!/^(?:user|repos\/Juri-Halveth\/)/.test(endpoint)||endpoint.includes('..')||/[\r\n]/.test(endpoint))throw new Error('GitHub endpoint outside selected owner');
  const args=['api',endpoint,'--method',method];if(body)args.push('--input','-');
  const r=spawnSync('gh',args,{input:body?JSON.stringify(body):undefined,encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true});
  if(r.error)throw r.error;if(r.status!==0)throw new Error(`GitHub ${method} failed: ${r.stderr.trim()}`);return JSON.parse(r.stdout);
}
async function main(){
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog/public-universe-roots.json'),'utf8'));
  const gateway=makeGateway({request:ghTransport,allowedRepositories:[...catalog.repositories.map(r=>r.repository),OWNER+'/halveth-private-core']});
  const [mode,name,p,branch,input,message]=process.argv.slice(2);
  let result;if(mode==='inventory'&&name&&!branch)result=await gateway.inventory(name,{ref:p??null});
  else if(mode==='read'&&name&&p&&!input)result=await gateway.read(name,p,{ref:branch??null});
  else if(mode==='write'&&name&&p&&branch&&input&&message)result=await gateway.write(name,p,{branch,message,content:fs.readFileSync(input,'utf8')});
  else throw new Error('usage: gateway inventory OWNER/REPO [REF] | read OWNER/REPO PATH [REF] | write OWNER/REPO PATH codex/BRANCH INPUT_FILE COMMIT_MESSAGE');
  console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
