// Prepare a native GitHub Wiki copy from one committed source version.
// This command writes local Markdown only. Review the diff before a wiki push.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const [ref,output]=process.argv.slice(2);
if(!ref || !output || process.argv.length!==4 || ref.startsWith('-')) throw new Error('Usage: node scripts/prepare-wiki-copy.mjs COMMIT_OR_TAG OUTPUT_DIRECTORY');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});
const commit=git(['rev-parse','--verify','--end-of-options',ref+'^{commit}']).trim();
const files=git(['ls-tree','-r','--name-only',commit,'--','wiki']).trim().split('\n').filter(p=>/^wiki\/[A-Za-z0-9_-]+\.md$/.test(p));
if(!files.includes('wiki/Home.md')) throw new Error('Committed Wiki Home is missing');
const destination=path.resolve(output);
if(destination===root || destination===path.join(root,'wiki')) throw new Error('Choose a separate local wiki working copy');
fs.mkdirSync(destination,{recursive:true});
const repository='https://github.com/Juri-Halveth/open-research-branches';
const pages=new Set(files.map(p=>path.basename(p)));
const receipt=[];
for(const file of files){
  const original=git(['show',commit+':'+file]);
  let text=original.replace(/\]\(([A-Za-z0-9_-]+\.md)(#[^)]*)?\)/g,(whole,target,anchor='')=>{
    if(!pages.has(target)) throw new Error('Unbound wiki page: '+target);
    return ']('+repository+'/wiki/'+target.slice(0,-3)+anchor+')';
  });
  // Bind illustrations to the same source version as the page text.
  text=text.replaceAll('https://raw.githubusercontent.com/Juri-Halveth/open-research-branches/main/','https://raw.githubusercontent.com/Juri-Halveth/open-research-branches/'+commit+'/');
  if(!path.basename(file).startsWith('_')) text+='\n\n---\n[Versionierte Quelle]('+repository+'/blob/'+commit+'/'+file+') · Wiki-Kopie dieser Fassung.\n';
  fs.writeFileSync(path.join(destination,path.basename(file)),text,'utf8');
  receipt.push({page:path.basename(file),sourceCommit:commit,sha256:createHash('sha256').update(text).digest('hex')});
}
console.log(JSON.stringify({state:'LOCAL_WIKI_COPY_PREPARED',sourceCommit:commit,pages:receipt,remoteMutation:false},null,2));
