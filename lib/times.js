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
  const { typeParameters, params = [], returnType } = tree.value;
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

  console.log(require("util").inspect(returnType, false, null));

  // create node
  const treeKey = `resolveTimes:tree:${count++}`;
  const typeKey = `resolveTimes:type:${count}`;
  const argKey = `resolveTimes:arg:${count}`;
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

    // create arguments
    if (targetArg) {
      const args = times(t + 1, n => {
        const arg = dcp.clone(argKey, targetArg);
        arg.name = `${arg.name}${++n}`;
        return set(arg, argPath, `${target}${n}`);
      });
      node.value.params.splice(targetArgIndex, 1, ...args);
    }

    resolveReturnType(node, t + 1, target, returnType);
    return node;
  });
  parent.splice(index, 1, ...list);
}

function resolveReturnType(node, count, target, returnType) {
  node.value.returnType = returnType;
  if (!returnType) {
    return;
  }
  const types = times(count, n => ({
    type: "TSTypeReference",
    typeName: {
      type: "Identifier",
      name: `${target}${++n}`
    }
  }));
  const key = `resolveTimes:returnType:${count}`;
  const annotation = returnType.typeAnnotation;
  switch (annotation.type) {
    case "TSTypeReference":
      if (annotation.typeName.name !== target) {
        return;
      }
      node.value.returnType = {
        type: "TSTypeAnnotation",
        typeAnnotation: {
          type: "TSUnionType",
          types: types
        }
      };
      break;
    case "TSUnionType":
      const index = annotation.types.findIndex(
        t => t.typeName && t.typeName.name === target
      );
      if (index < 0) {
        return;
      }
      returnType = dcp.clone(key, returnType);
      returnType.typeAnnotation.types.splice(index, 1, ...types);
      node.value.returnType = returnType;
      break;
  }
}
