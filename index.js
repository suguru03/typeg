'use strict';

const { addHook } = require('prettier-hook/hooks/parser-typescript');

const decoratorMap = require('./lib');

addHook(parse);

function parse(ast) {
  resolveAst(ast, 'body');
  return ast;
}

function resolveAll(parent, keys = []) {
  keys.forEach(key => resolveAst(parent, key));
}

function resolveAst(parent, key) {
  const tree = parent[key];
  if (!tree) {
    return;
  }
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      resolveAst(tree, i);
    }
    return;
  }
  switch (tree.type) {
    case 'Program':
      return resolveAst(tree, 'body');
    case 'ImportDeclaration':
      return;
    case 'ExportNamedDeclaration':
      return resolveAst(tree, 'declaration');
    // class
    case 'ClassBody':
      return resolveAst(tree, 'body');
    case 'ClassProperty':
      return resolveAst(tree, 'typeAnnotation');
    case 'ClassDeclaration':
      return resolveAst(tree, 'body');
    case 'MethodDefinition':
      return resolveDecorators(parent, key);
    case 'TemplateLiteral':
      return resolveAst(tree, 'expressions');
    case 'ObjectExpression':
      return resolveAst(tree, 'properties');
    case 'Property':
      return resolveAst(tree, 'value');
    case 'FunctionExpression':
      return resolveAst(tree, 'body');
    case 'ArrowFunctionExpression':
      return resolveAst(tree, 'body');
    case 'ReturnStatement':
    case 'UpdateExpression':
    case 'UnaryExpression':
      return resolveAst(tree, 'argument');
    case 'BlockStatement':
      return resolveAst(tree, 'body');
    case 'IfStatement':
      return resolveAll(tree, ['test', 'consequent']);
    case 'SwitchStatement':
      return resolveAll(tree, ['discriminant', 'cases']);
    case 'SwitchCase':
      return resolveAll(tree, ['test', 'consequent']);
    case 'ExpressionStatement':
      return resolveAst(tree, 'expression');
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'AssignmentExpression':
      return resolveAll(tree, ['left', 'right']);
    case 'MemberExpression':
      return resolveAst(tree, 'object');
    case 'CallExpression':
      return resolveAll(tree, ['callee', 'arguments']);
    case 'TryStatement':
      return resolveAll(tree, ['block', 'handler', 'finalizer']);
    case 'CatchClause':
      return resolveAst(tree, 'body');
    case 'Super':
    case 'ThisExpression':
      return;
    case 'ForStatement':
      return resolveAll(tree, ['init', 'test', 'update', 'body']);
    case 'ForOfStatement':
      return resolveAll(tree, ['left', 'right', 'body']);
    case 'Identifier':
      return checkTarget(targetMap[tree.name], parent);
    // variables
    case 'VariableDeclaration':
      return resolveAst(tree, 'declarations');
    case 'VariableDeclarator':
      return resolveAst(tree, 'init');
    case 'AwaitExpression':
      return;
    // TS
    case 'TSAbstractClassDeclaration':
      return resolveAst(tree, 'body');
    case 'TSTypeAnnotation':
      return resolveAst(tree, 'typeAnnotation');
    case 'TSAsExpression':
      return resolveAst(tree, 'expression');
    case 'TSTypeQuery':
      return;
    case 'TSAnyKeyword':
    case 'TSStringKeyword':
    case 'TSNumberKeyword':
      return;
  }
}

function resolveDecorators(parent, key) {
  const tree = parent[key];
  if (!tree.decorators) {
    return;
  }
  for (const { expression } of tree.decorators) {
    const func = decoratorMap[expression.callee.name];
    func && func(parent, key, expression.arguments);
  }
}
