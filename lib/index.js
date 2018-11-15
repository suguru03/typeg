"use strict";

const fs = require("fs");
const path = require("path");

fs.readdirSync(__dirname).forEach(name => {
  const key = name.slice(0, 1).toUpperCase() + name.slice(1, -3);
  module.exports[key] = require(path.resolve(__dirname, name));
});
