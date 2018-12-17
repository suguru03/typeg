import * as dcp from 'dcp';
import * as ts from 'typescript';

import { times, get, set } from './util';
import { Ast } from './';

export default resolveTimes;

enum ArgumentType {
  Single = 'sigle',
  Multi = 'multi',
}

interface Opts {
  [key: string]: ArgumentType;
}

let cloneIndex = 0;

function resolveTimes(parent: any[], index: number, args: any[] = []): void {
  const [length, target = 'T', opts] = getArguments(args);
  if (!Number.isSafeInteger(length)) {
    throw new TimesError('Invalid the first argument');
  }

  // validate type params
  const tree = parent[index];
  cloneIndex++;
  const list = times(length, t => new Node(tree, t + 1, target, opts).resolve().getNode());
  parent.splice(index, 1, ...list);
}

function getArguments(args: any[] = []) {
  return args.map((arg, i) => {
    let result: any;
    new Ast()
      .set('Literal', (node, key) => {
        const { value } = node[key];
        if (result) {
          result[node.key.name] = value;
        } else {
          result = value;
        }
      })
      .set('ObjectExpression', (node, key, ast) => {
        result = {};
        ast.resolveAst(node[key], 'properties');
      })
      .resolveAst(args, i);
    return result;
  });
}

class TimesError extends Error {
  constructor(msg) {
    super(`[Times] ${msg}`);
  }
}

class Node {
  readonly node: any;
  readonly size: number;
  readonly target: string;
  readonly opts: Opts;
  readonly cloneIndex = cloneIndex;
  constructor(tree: any, size: number, target: string = 'T', opts: Opts = {}) {
    this.node = dcp.clone(this.getKey('tree'), tree);
    this.size = size;
    this.target = target;
    this.opts = opts;
  }

  getNode() {
    return this.node;
  }

  resolve(): this {
    return this.resolveTypeParams().resolveArgs();
    // .resolveReturnType();
  }

  private resolveTypeParams(): this {
    const { node, target, size } = this;
    const { typeParameters } = node.value;
    if (!typeParameters) {
      throw new TimesError('Type definition not found');
    }
    const targetIndex = typeParameters.params.findIndex(p => p.name === target);
    const targetType = typeParameters.params[targetIndex];
    if (!targetType) {
      throw new TimesError(`${target} not found`);
    }

    const typeKey = this.getKey('type');
    delete node.decorators;

    // create types
    const types = times(size, n => {
      const type = dcp.clone(typeKey, targetType);
      type.name = `${target}${++n}`;
      return type;
    });
    node.value.typeParameters.params.splice(targetIndex, 1, ...types);
    return this;
  }

  private resolveArgs(): this {
    const { node, opts } = this;
    const { params = [] } = node.value;
    for (const [index, param] of params.entries()) {
      if (opts[param.name] === ArgumentType.Multi) {
        this.resolveMultiArgs(params, index);
      } else {
        this.resolveUnionTypes(params, index);
      }
    }
    return this;
  }

  private resolveMultiArgs(params: any[], index: number): this {
    const { node, target, size } = this;
    const param = params[index];
    const argKey = this.getKey(`arg:${param.name}`);
    const newArgs = times(size, n => {
      const arg = dcp.clone(argKey, param);
      arg.name += ++n;
      new Ast()
        .set('TSTypeReference', (parent, parentKey, ast) => {
          const tree = parent[parentKey];
          ast.resolveAst(tree, 'typeParameters');
          ast.resolveAst(tree, 'typeName');
          if (tree.typeName.name === target) {
            tree.typeName.name += n;
          }
        })
        .resolveAst(arg, 'typeAnnotation');
      return arg;
    });
    node.value.params.splice(index, 1, ...newArgs);
    return this;
  }

  private resolveReturnType(): this {
    return this.resolveUnionTypes(this.node.value.returnType, 'typeAnnotation');
  }

  private resolveUnionTypes(node: any, key: any): this {
    if (!node) {
      return this;
    }
    const { target, size } = this;
    const types = times(size, n => ({
      type: 'TSTypeReference',
      typeName: {
        type: 'Identifier',
        name: `${target}${++n}`,
      },
    }));
    new Ast()
      .set('TSTypeReference', (parent, parentKey, ast) => {
        const tree = parent[parentKey];
        ast.resolveAst(tree, 'typeParameters');
        ast.resolveAst(tree, 'typeName');
        if (tree.typeName.name !== target) {
          return;
        }
        parent[parentKey] = {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSUnionType',
            types,
          },
        };
      })
      .set('TSUnionType', (parent, parentKey, ast) => {
        const tree = parent[parentKey];
        ast.resolveAst(tree, 'types');
        const index = tree.types.findIndex(t => t.typeName && t.typeName.name === target);
        if (index >= 0) {
          tree.types.splice(index, 1, ...types);
        }
      })
      .resolveAst(node, key);
    return this;
  }

  private getKey(key: string) {
    return `Times:${key}:${this.cloneIndex}`;
  }
}
