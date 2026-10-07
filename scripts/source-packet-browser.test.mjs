import test from 'node:test';
import assert from 'node:assert/strict';
import {makePacket,runEntry,decodePacket} from './halveth-entry.mjs';
import {decodeBrowserPacket} from './source-packet-browser.mjs';
import {readFileSync} from 'node:fs';
test('browser and Node data consumers interpret the same source-bound indication',async()=>{
 for(const file of ['source-packet-browser.mjs','plain-json.mjs'])assert.deepEqual(readFileSync(new URL(file,import.meta.url)),readFileSync(new URL('../branches/security-impact-learning/source-entry/'+file,import.meta.url)));
 const packet=runEntry(['indicate','F02']);assert.deepEqual(await decodeBrowserPacket(packet),decodePacket(packet));
});
test('browser adapter rejects changed bytes and markup stays payload data',async()=>{
 const packet=makePacket('TEST',{commit:'a'.repeat(40),tree:'b'.repeat(40),coverage:'SYNTHETIC_TEST'},{text:'<script>inert source</script>'});
 assert.equal((await decodeBrowserPacket(packet)).text,'<script>inert source</script>');
 packet.payloadSha256='0'.repeat(64);await assert.rejects(()=>decodeBrowserPacket(packet));
});
