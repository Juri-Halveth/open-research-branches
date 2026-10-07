import {decodeBrowserPacket} from './source-packet-browser.mjs';
const byId=id=>document.getElementById(id);
async function show(packet){
 try{
  const data=await decodeBrowserPacket(packet);
  for(const [id,value] of Object.entries({type:packet.type,class:packet.dataClass,commit:packet.source.commit,digest:packet.payloadSha256,payload:JSON.stringify(data,null,2),packet:JSON.stringify(packet,null,2)}))byId(id).textContent=value;
  byId('result').hidden=false;byId('status').textContent='Byteanzahl und Payload-Digest stimmen. Daten sind dargestellt.';
 }catch(error){byId('result').hidden=true;byId('status').textContent='Paketprüfung: '+error.message;}
}
byId('demo').addEventListener('click',async()=>{
 try{const response=await fetch('./example.json');if(!response.ok)throw new Error('Beispiel nicht verfügbar');const raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await response.arrayBuffer());await show(JSON.parse(raw));}catch(error){byId('status').textContent=error.message;}
});
byId('file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 if(file.size>16*1024*1024){byId('status').textContent='Paket überschreitet das Eingabelimit.';return;}
 try{const raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());await show(JSON.parse(raw));}catch(error){byId('status').textContent='Datei: '+error.message;}
});
