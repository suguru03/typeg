#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const minimist = require('minimist');

const args = minimist(process.argv.slice(2));
const { debug, out } = args;

const argv = process.argv.slice(2);
if (out) {
  const index = argv.indexOf(out) - 1;
  argv.splice(index, 2);
}

const indexpath = path.resolve(__dirname, '../dist/index.js');
const hookpath = path.resolve(__dirname, '../node_modules/prettier-hook/bin/prettier-hook.js');

const command = `${hookpath} --require ${indexpath} ` + argv.join(' ');
let res = execSync(command).toString();

if (debug || !out) {
  console.log(res);
}
if (out) {
  fs.writeFileSync(out, res);
}
