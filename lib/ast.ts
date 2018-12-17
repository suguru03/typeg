type AstResolver = (node: any, key: any, ast?: Ast) => any;

interface ResolverMap {
  [targetType: string]: AstResolver;
}

export class Ast {
  private readonly resolverMap: ResolverMap = {};
  private readonly resolver: AstResolver;

  set(type: string, resolver: AstResolver) {
    this.resolverMap[type] = resolver;
    return this;
  }

  resolveAst(parent: any, key: any) {
    const tree = parent[key];
    if (!tree) {
      return;
    }
    if (Array.isArray(tree)) {
      for (let i = 0; i < tree.length; i++) {
        this.resolveAst(tree, i);
      }
      return;
    }
    const { type } = tree;
    if (this.resolverMap[type]) {
      return this.resolverMap[type](parent, key, this);
    }
    switch (type) {
      case 'Program':
        return this.resolveAst(tree, 'body');
      case 'ImportDeclaration':
        return;
      case 'ExportDefaultDeclaration':
      case 'ExportNamedDeclaration':
        return this.resolveAst(tree, 'declaration');
      // class
      case 'ClassBody':
        return this.resolveAst(tree, 'body');
      case 'ClassProperty':
        return this.resolveAst(tree, 'typeAnnotation');
      case 'ClassDeclaration':
        return this.resolveAst(tree, 'body');
      case 'MethodDefinition':
        return;
      case 'TemplateLiteral':
        return this.resolveAst(tree, 'expressions');
      case 'ObjectExpression':
        return this.resolveAst(tree, 'properties');
      case 'Property':
        return this.resolveAst(tree, 'value');
      case 'FunctionExpression':
        return this.resolveAll(tree, ['body', 'returnType']);
      case 'ArrowFunctionExpression':
        return this.resolveAst(tree, 'body');
      case 'ReturnStatement':
      case 'UpdateExpression':
      case 'UnaryExpression':
        return this.resolveAst(tree, 'argument');
      case 'BlockStatement':
        return this.resolveAst(tree, 'body');
      case 'IfStatement':
        return this.resolveAll(tree, ['test', 'consequent']);
      case 'SwitchStatement':
        return this.resolveAll(tree, ['discriminant', 'cases']);
      case 'SwitchCase':
        return this.resolveAll(tree, ['test', 'consequent']);
      case 'ExpressionStatement':
        return this.resolveAst(tree, 'expression');
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'AssignmentExpression':
        return this.resolveAll(tree, ['left', 'right']);
      case 'MemberExpression':
        return this.resolveAst(tree, 'object');
      case 'CallExpression':
        return this.resolveAll(tree, ['callee', 'arguments']);
      case 'TryStatement':
        return this.resolveAll(tree, ['block', 'handler', 'finalizer']);
      case 'CatchClause':
        return this.resolveAst(tree, 'body');
      case 'Super':
      case 'ThisExpression':
        return;
      case 'ForStatement':
        return this.resolveAll(tree, ['init', 'test', 'update', 'body']);
      case 'ForOfStatement':
        return this.resolveAll(tree, ['left', 'right', 'body']);
      case 'Identifier':
        return this.resolveAst(tree, 'typeAnnotation');
      // variables
      case 'VariableDeclaration':
        return this.resolveAst(tree, 'declarations');
      case 'VariableDeclarator':
        return this.resolveAst(tree, 'init');
      case 'AwaitExpression':
        return;
      // TS
      case 'TSModuleBlock':
      case 'TSModuleDeclaration':
      case 'TSAbstractClassDeclaration':
        return this.resolveAst(tree, 'body');
      case 'TSTypeAnnotation':
        return this.resolveAst(tree, 'typeAnnotation');
      case 'TSAsExpression':
        return this.resolveAst(tree, 'expression');
      case 'TSNamespaceExportDeclaration':
      case 'TSTypeQuery':
      case 'TSAnyKeyword':
      case 'TSStringKeyword':
      case 'TSNumberKeyword':
        return;
      case 'TSUnionType':
        return this.resolveAst(tree, 'types');
      case 'TSTypeReference':
        return this.resolveAst(tree, 'typeName');
      case 'TSFunctionType':
        return this.resolveAll(tree, ['typeParameters', 'parameters', 'typeAnnotation']);
      case 'TSTypeParameterInstantiation':
        return this.resolveAst(tree, 'params');
      case 'TSTupleType':
        return this.resolveAst(tree, 'elementTypes');
    }
    return;
  }

  private resolveAll(parent, keys = []) {
    keys.forEach(key => this.resolveAst(parent, key));
  }
}
