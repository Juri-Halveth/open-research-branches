import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { initialState, advance, exchange, initialGraph, expand, validateGraph, STAGE_GROUPS } from './model.mjs';
test('zero time is exact identity; inputs remain unchanged', () => {
  const state = Object.freeze(initialState()); assert.deepEqual(advance(state, 0), state);
  advance(state, 2); assert.deepEqual(state, initialState());
});
test('transitions conserve total material and stay bounded for variable time steps', () => {
  let state = initialState();
  for (let i = 0; i < 1000; i++) {
    state = advance(state, (i % 37) / 37);
    assert.ok(Math.abs(state.starch + state.sugar + state.other - 1) < 1e-12);
    for (const key of ['starch', 'sugar', 'other', 'ethylene', 'firmness', 'aroma']) assert.ok(state[key] >= 0 && state[key] <= 1);
  }
});
test('invalid numerical inputs are rejected explicitly', () => {
  for (const bad of [NaN, Infinity, -1, '1', null]) assert.throws(() => advance(initialState(), bad));
  assert.throws(() => advance({ ...initialState(), sugar: .9 }, 1));
});
test('directional changes follow the declared illustrative equations', () => {
  const a = initialState(), b = advance(a, 3);
  assert.ok(b.starch < a.starch && b.sugar > a.sugar && b.firmness < a.firmness && b.aroma > a.aroma);
});
test('exchange conserves arbitrary quantities without negative compartments', () => {
  for (const input of [[0, 0, 0], [100, 0, 0], [0, 1e6, 1], [.6, .3, .1]]) {
    const original = [...input]; let out = input;
    for (let i = 0; i < 50; i++) out = exchange(out, 7);
    assert.deepEqual(input, original);
    assert.ok(out.every(x => x >= 0));
    assert.ok(Math.abs(out.reduce((a,b) => a+b, 0) - input.reduce((a,b) => a+b, 0)) < 1e-8);
  }
});
test('both absorption and microbiome retain two subsequent levels', () => {
  const { nodes } = initialGraph();
  for (const path of [['absorption','transport','tissue'], ['microbiome','metabolites','host-state']]) {
    for (let i = 1; i < path.length; i++) assert.equal(nodes.find(n => n.id === path[i]).parent, path[i-1]);
    assert.equal(nodes.filter(n => n.parent === path[2] && n.kind === 'OPEN').length, 3);
  }
});
test('upper influences retain three research continuations each', () => {
  const { nodes } = initialGraph();
  for (const id of ['environment', 'material-properties', 'observer', 'route']) assert.equal(nodes.filter(n => n.parent === id && n.kind === 'OPEN').length, 3);
});
test('expanding any node preserves the exact original prefix and collision-free IDs', () => {
  const a = initialGraph(), b = expand(a, 'absorption'); const c = expand(b, 'absorption');
  assert.deepEqual(c.nodes.slice(0, a.nodes.length), a.nodes); assert.equal(c.nodes.length, a.nodes.length + 6);
  assert.equal(new Set(c.nodes.map(n => n.id)).size, c.nodes.length); assert.equal(validateGraph(c), true);
});
test('graph refuses cycles, invalid sources and unidentified parents', () => {
  const graph = initialGraph();
  for (const patch of [{ parent: 'absorption' }, { source: 'javascript:alert(1)' }, { id: 'Bad ID' }]) {
    const bad = structuredClone(graph); Object.assign(bad.nodes[0], patch); assert.throws(() => validateGraph(bad));
  }
  assert.throws(() => expand(graph, 'absent'));
});
test('each supplied stage grouping has three named inquiries and three open continuations each', () => {
  const graph=initialGraph(); validateGraph(graph);
  for(const group of STAGE_GROUPS) {
    assert.equal(group.items.length,3);
    for(const [id] of group.items) assert.equal(graph.nodes.filter(n=>n.parent===id&&n.kind==='OPEN').length,3);
  }
});
test('public statement digest binds exactly its UTF-8 text', () => {
  const record=JSON.parse(fs.readFileSync(new URL('./statement.json',import.meta.url),'utf8'));
  const bytes=Buffer.from(record.text,'utf8');
  assert.equal(bytes.length,record.byteLength); assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
});
test('all declared public branch checksums match their exact file bytes', () => {
  const lines=fs.readFileSync(new URL('./SHA256SUMS.txt',import.meta.url),'utf8').trim().split('\n');
  for(const line of lines) {
    const [digest,file]=line.split('  ');
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./'+file,import.meta.url))).digest('hex'),digest,file);
  }
});
