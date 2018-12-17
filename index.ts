import { addHook } from 'prettier-hook/hooks/parser-typescript';

import { Ast, decoratorMap } from './lib';

addHook(parse);

function parse(ast) {
  new Ast('MethodDefinition', resolveDecorators).resolveAst(ast, 'body');
  return ast;
}

function resolveDecorators(parent, key) {
  const tree = parent[key];
  if (!tree.decorators) {
    return;
  }
  for (const { expression } of tree.decorators) {
    const func = decoratorMap[expression.callee.name];
    if (func) {
      func(parent, key, expression.arguments);
    }
  }
}
