import {plainJson} from './plain-json.mjs';
// Browser adapter for the source-data packet; no source payload is evaluated.
const LIMIT=8*1024*1024;
export async function decodeBrowserPacket(p){
 if(!p||Object.keys(p).sort().join('|')!=='claimCeiling|dataClass|encoding|mediaType|networkRequests|payloadBase64|payloadByteLength|payloadSha256|programsFromSourceExecuted|schema|source|type|version'||p.schema!=='halveth.source-entry-packet.v1'||p.version!=='1.0.0'||p.encoding!=='UTF-8'||p.mediaType!=='application/json'||p.claimCeiling!=='BOUND_SOURCE_DATA_ONLY'||p.networkRequests!==0||p.programsFromSourceExecuted!==0||!['PUBLIC','RESTRICTED_RAW'].includes(p.dataClass)||!/^[A-Z][A-Z0-9_]{0,63}$/.test(p.type)||!p.source||Object.keys(p.source).sort().join('|')!=='commit|coverage|tree'||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.commit)||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.tree)||typeof p.source.coverage!=='string'||!Number.isSafeInteger(p.payloadByteLength)||p.payloadByteLength<0||p.payloadByteLength>LIMIT||typeof p.payloadBase64!=='string'||p.payloadBase64.length>Math.ceil(LIMIT/3)*4)throw new Error('Unsupported source packet');
 const binary=atob(p.payloadBase64);if(btoa(binary)!==p.payloadBase64||binary.length!==p.payloadByteLength)throw new Error('Canonical Base64 or length binding failed');
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==p.payloadSha256)throw new Error('Payload digest mismatch');
 const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes),value=JSON.parse(text);
 plainJson(value);if(JSON.stringify(value)!==text)throw new Error('Canonical payload JSON required');
 return value;
}
