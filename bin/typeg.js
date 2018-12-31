#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const minimist = require('minimist');

const args = minimist(process.argv.slice(2));
const options = ['_', 'debug', 'out'];
const { debug, out } = args;

const argv = process.argv.slice(2);
if (out) {
  argv.splice(index, 2);
}

const indexpath = path.resolve(__dirname, '../dist/index.js');
const hookpath = path.resolve(
  __dirname,
  debug ? '../node_modules' : '../..',
  './prettier-hook/bin/prettier-hook.js',
);

for (const key of options) {
  delete args[key];
}
const str = Object.entries(args)
  .map(([key, str]) => `--${key} ${str}`)
  .join(' ');
const command = `${hookpath} --require ${indexpath} ${str}`;
const res = execSync(command).toString();

if (debug || !out) {
  console.log(res);
}
if (out) {
  fs.writeFileSync(out, res);
}
