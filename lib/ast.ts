type AstResolver = (node: any, key: any) => void;

export class Ast {
  readonly targetType: string;
  readonly resolver: AstResolver;
  constructor(targetType: string, resolver: AstResolver) {
    this.targetType = targetType;
    this.resolver = resolver;
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
    console.log('ｷﾀ ━━━ヽ(´ω`)ﾉ ━━━!!', type, this.targetType);
    if (type === this.targetType) {
      return this.resolver(parent, key);
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
        return this.resolveAst(tree, 'body');
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
        return;
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
    }
  }

  private resolveAll(parent, keys = []) {
    keys.forEach(key => this.resolveAst(parent, key));
  }
}
