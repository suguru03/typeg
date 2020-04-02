import { hooks, Ast } from 'prettier-hook';

import { decoratorMap } from './lib';

hooks.typescript.addHook(parse);

function parse(ast) {
  new Ast().set('MethodDefinition', resolveDecorators).resolveAst(ast);
  return ast;
}

function resolveDecorators(parent, key) {
  const tree = parent[key];
  if (!tree.decorators) {
    return false;
  }
  for (const { expression } of tree.decorators) {
    const func = decoratorMap[expression.callee.name];
    if (func) {
      func(parent, key, expression.arguments);
    }
  }
  return false;
}
