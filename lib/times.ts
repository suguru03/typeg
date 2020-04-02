import dcp from 'dcp';
import { Ast } from 'prettier-hook';

import { times, get } from './util';

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
  const list = times(length, (t) => new Node(tree, t + 1, target, opts).resolve().getNode());
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
        return false;
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
        return false;
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
    return this.resolveTypeParams().resolveArgs().resolveReturnType();
  }

  private resolveTypeParams(): this {
    const { node, target, size } = this;
    const { typeParameters } = node.value;
    if (!typeParameters) {
      throw new TimesError('Type definition not found');
    }
    const targetIndex = typeParameters.params.findIndex((p) => p.name.name === target);
    const targetType = typeParameters.params[targetIndex];
    if (!targetType) {
      throw new TimesError(`${target} not found`);
    }

    const typeKey = this.getKey('type');
    delete node.decorators;

    // create types
    const types = times(size, (n) => {
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
          this.resolveTargetForMulti(params, index);
          break;
        case ArgumentType.ArrayMulti:
          this.resolveArrayMulti(param);
          break;
        default:
          this.resolveTargetForSingle(params, index);
          break;
      }
    }
    return this;
  }

  private resolveReturnType(): this {
    const { node, target, opts } = this;
    const { returnType } = node.value;
    switch (opts.returnType) {
      case ReturnType.ArrayMulti:
        return this.resolveArrayMulti(returnType);
      default:
        return this.resolveTargetForSingle(returnType, 'typeAnnotation');
    }
  }

  private resolveArrayMulti(node: any): this {
    const { target } = this;
    const checked = new Ast()
      .set('TSTupleType', (parent, key, ast) => {
        const tree = parent[key];
        const types = tree.elementTypes || [];
        // need to search from right because of splice
        let index = types.length;
        while (--index >= 0) {
          if (this.hasTarget(types[index])) {
            this.resolveTargetForArrayMulti(types, index);
          } else {
            ast.resolveAst(types, index);
          }
        }
        return true;
      })
      .resolveAst(node);
    if (!checked) {
      throw new TimesError('Invalid arrayMulti option');
    }
    return this;
  }

  private hasTarget(node: any): boolean {
    const { target } = this;
    return new Ast()
      .set('TSTypeReference', (parent, parentKey, ast) => {
        const tree = parent[parentKey];
        return (
          get(tree, ['typeName', 'name']) === target ||
          ast.resolveAst(tree, 'typeParameters') ||
          ast.resolveAst(tree, 'typeName')
        );
      })
      .resolveAst(node);
  }

  private resolveTargetForSingle(node: any, key: any): this {
    if (!node) {
      return this;
    }
    const { target, size } = this;
    const types = times(size, (n) => ({
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
          return false;
        }
        parent[parentKey] = {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSUnionType',
            types,
          },
        };
        return true;
      })
      .set('TSUnionType', (parent, parentKey, ast) => {
        const tree = parent[parentKey];
        ast.resolveAst(tree, 'types');
        const index = tree.types.findIndex((t) => t.typeName && t.typeName.name === target);
        if (index >= 0) {
          tree.types.splice(index, 1, ...types);
        }
        return false;
      })
      .resolveAst(node, key);
    return this;
  }

  private resolveTargetForMulti(params: any[], index: number): this {
    const { target, size } = this;
    const param = params[index];
    const argKey = this.getKey(`multi:${param.name}`);
    const newArgs = times(size, (n) => {
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
          return false;
        })
        .resolveAst(arg);
      return arg;
    });
    params.splice(index, 1, ...newArgs);
    return this;
  }

  private resolveTargetForArrayMulti(params: any[], index: number): this {
    const { target, size } = this;
    const param = params[index];
    const cloneKey = this.getKey(`ArrayMulti:${param.range}`);
    const newArgs = times(size, (n) => {
      n++;
      const arg = dcp.clone(cloneKey, param);
      new Ast()
        .set('TSTypeReference', (parent, parentKey, ast) => {
          const tree = parent[parentKey];
          ast.resolveAst(tree, 'typeParameters');
          ast.resolveAst(tree, 'typeName');
          if (get(tree, ['typeName', 'name']) === target) {
            tree.typeName.name += n;
          }
          return false;
        })
        .resolveAst(arg);
      return arg;
    });
    params.splice(index, 1, ...newArgs);
    return this;
  }

  private getKey(key: string) {
    return `Times:${key}:${this.cloneIndex}`;
  }
}
