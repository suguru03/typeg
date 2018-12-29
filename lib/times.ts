import * as dcp from 'dcp';
import * as ts from 'typescript';

import { times, get, set } from './util';
import { Ast } from './';

export default resolveTimes;

enum ArgumentType {
  Single = 'sigle',
  Multi = 'multi',
  ArrayMulti = 'arrayMulti',
}

enum ReturnType {
  Single = 'sigle',
  ArrayMulti = 'arrayMulti',
}

interface Opts {
  args?: {
    [key: string]: ArgumentType;
  };
  returnType?: ReturnType;
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
    let origin: any;
    let current: any;
    new Ast()
      .set('Literal', (node, key) => {
        const { value } = node[key];
        if (origin) {
          current[node.key.name] = value;
        } else {
          origin = value;
        }
      })
      .set('ObjectExpression', (node, key, ast) => {
        const cur = current;
        if (origin) {
          current = origin[node.key.name] = {};
        } else {
          current = origin = {};
        }
        ast.resolveAst(node[key], 'properties');
        current = cur;
      })
      .resolveAst(args, i);
    return origin;
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
    return this.resolveTypeParams()
      .resolveArgs()
      .resolveReturnType();
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
    // need to search from right because of splice
    let index = params.length;
    while (--index >= 0) {
      const param = params[index];
      switch (get(opts, ['args', param.name])) {
        case ArgumentType.Multi:
          this.resolveMultiArgs(params, index);
          break;
        case ArgumentType.ArrayMulti:
          this.resolveM(param);
          break;
        default:
          this.resolveUnionTypes(params, index);
          break;
      }
    }
    return this;
  }

  private resolveMultiArgs(params: any[], index: number): this {
    const { target, size } = this;
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
          if (get(tree, ['typeName', 'name']) === target) {
            tree.typeName.name += n;
          }
        })
        .resolveAst(arg, 'typeAnnotation');
      return arg;
    });
    params.splice(index, 1, ...newArgs);
    return this;
  }

  private resolveArrayMultiArgs(params: any[], index: number): this {
    const { target, size } = this;
    const param = params[index];
    const cloneKey = this.getKey(`ArrayMulti:${param.range}`);
    const newArgs = times(size, n => {
      n++;
      const arg = dcp.clone(cloneKey, param);
      new Ast()
        .set('TSTypeReference', (parent, parentKey, ast) => {
          const tree = parentKey === undefined ? parent : parent[parentKey];
          ast.resolveAst(tree, 'typeParameters');
          ast.resolveAst(tree, 'typeName');
          if (get(tree, ['typeName', 'name']) === target) {
            tree.typeName.name += n;
          }
        })
        .resolveAst(arg);
      return arg;
    });
    params.splice(index, 1, ...newArgs);
    return this;
  }

  private resolveM(node: any): this {
    const { target } = this;
    new Ast()
      .set('TSTupleType', (parent, key, ast) => {
        const tree = parent[key];
        const types = tree.elementTypes || [];
        // need to search from right because of splice
        let index = types.length;
        while (--index >= 0) {
          if (this.hasTarget(types[index])) {
            this.resolveArrayMultiArgs(types, index);
          } else {
            ast.resolveAst(types, index);
          }
        }
      })
      .resolveAst(node);
    return this;
  }

  private hasTarget(node: any) {
    const { target } = this;
    return new Ast()
      .set('TSTypeReference', (parent, parentKey, ast) => {
        const tree = parentKey === undefined ? parent : parent[parentKey];
        return (
          get(tree, ['typeName', 'name']) === target ||
          ast.resolveAst(tree, 'typeParameters') ||
          ast.resolveAst(tree, 'typeName')
        );
      })
      .resolveAst(node);
  }

  private resolveReturnType(): this {
    const { node, target, opts } = this;
    const { returnType } = node.value;
    switch (opts.returnType) {
      case ReturnType.ArrayMulti:
        return this.resolveM(returnType);
      default:
        return this.resolveUnionTypes(returnType, 'typeAnnotation');
    }
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
