"use strict";

const dcp = require("dcp");

const { times, get, set } = require("./util");

module.exports = resolveTimes;

class TimesError extends Error {
  constructor(msg) {
    super(`[Times] ${msg}`);
  }
}

let count = 0;
const argPath = ["typeAnnotation", "typeAnnotation", "typeName", "name"];

function resolveTimes(parent, index, args = []) {
  const [length, target = "T"] = args.map(arg => arg.value);
  if (!Number.isSafeInteger(length)) {
    throw new TimesError("Invalid the first argument");
  }
  // validate type params
  const tree = parent[index];
  const { typeParameters, params = [] } = tree.value;
  if (!typeParameters) {
    throw new TimesError("Type definition not found");
  }
  const targetIndex = typeParameters.params.findIndex(p => p.name === target);
  const targetType = typeParameters.params[targetIndex];
  if (!targetType) {
    throw new TimesError(`${target} not found`);
  }
  const targetArgIndex = params.findIndex(p => get(p, argPath) === target);
  const targetArg = params[targetArgIndex];

  // create node
  const treeKey = `${resolveTimes}:tree:${count++}`;
  const typeKey = `${resolveTimes}:type:${count}`;
  const argKey = `${resolveTimes}:arg:${count}`;
  const list = times(length, t => {
    const node = dcp.clone(treeKey, tree);
    node.decorators = [];

    // create types
    const types = times(t + 1, n => {
      const type = dcp.clone(typeKey, targetType);
      type.name = `${target}${++n}`;
      return type;
    });
    node.value.typeParameters.params.splice(targetIndex, 1, ...types);

    if (targetArg) {
      const args = times(t + 1, n => {
        const arg = dcp.clone(argKey, targetArg);
        arg.name = `${arg.name}${++n}`;
        return set(arg, argPath, `${target}${n}`);
      });
      node.value.params.splice(targetArgIndex, 1, ...args);
    }

    // create arguments
    return node;
  });
  parent.splice(index, 1, ...list);
}
