#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const indexpath = path.resolve(__dirname, '../index.js');
const hookpath = path.resolve(
  __dirname,
  '../node_modules/prettier-hook/bin/prettier-hook.js',
);

const command = `${hookpath} --require ${indexpath} ${process.argv
  .slice(2)
  .join(' ')}`;
const res = execSync(command);
console.log(res.toString());
