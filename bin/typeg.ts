#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import * as minimist from 'minimist';

const args = minimist(process.argv.slice(2));
const { debug, out } = args;

const indexpath = path.resolve(__dirname, '../index.js');
const binpath = 'prettier-hook/bin/prettier-hook.js';
const hookpath = ['../..', '../../node_modules']
  .map((prefix) => path.join(__dirname, prefix, binpath))
  .find(fs.existsSync);

const command = `${hookpath} --require ${indexpath} ${args._}`;
const res = execSync(command).toString();

if (debug || !out) {
  console.log(res); //tslint:disable-line
}
if (out) {
  fs.writeFileSync(out, res);
}
