#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import * as minimist from 'minimist';

const args = minimist(process.argv.slice(2));
const { debug, out } = args;

const indexpath = path.resolve(__dirname, '../index.js');
const hookpath = [
  path.resolve(__dirname, '../../prettier-hook/bin/prettier-hook.js'),
  // debug
  path.resolve(__dirname, '../../node_modules/prettier-hook/bin/prettier-hook.js'),
].find(fs.existsSync);

const command = `${hookpath} --require ${indexpath} ${args._}`;
const res = execSync(command).toString();

if (debug || !out) {
  console.log(res); //tslint:disable-line
}
if (out) {
  fs.writeFileSync(out, res);
}
