#!/usr/bin/env node
'use strict';

const { observeSequence } = require('./observer');

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
let input = '';
let inputBytes = 0;
let inputTooLarge = false;
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputBytes += Buffer.byteLength(chunk, 'utf8');
  if (inputBytes > MAX_INPUT_BYTES) {
    inputTooLarge = true;
    input = '';
    return;
  }
  if (inputTooLarge) return;
  input += chunk;
});

process.stdin.on('end', () => {
  if (inputTooLarge) {
    process.stderr.write(`${JSON.stringify({ error: `input exceeds ${MAX_INPUT_BYTES} bytes` })}\n`);
    process.exitCode = 1;
    return;
  }
  try {
    const result = observeSequence(JSON.parse(input));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
});
