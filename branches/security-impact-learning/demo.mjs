import fs from 'node:fs/promises';
import { assess } from './impact-model.mjs';
const fixtures = JSON.parse(await fs.readFile(new URL('./fixtures.json', import.meta.url), 'utf8'));
console.log(JSON.stringify(fixtures.map(assess), null, 2));
