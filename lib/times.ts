import * as dcp from 'dcp';
import * as ts from 'typescript';

import { times, get, set } from './util';
import { Ast } from './';

export default resolveTimes;

let cloneIndex = 0;

function resolveTimes(parent: any[], index: number, args: any[] = []): void {
  const [length, target = 'T'] = args.map(arg => arg.value);
  if (!Number.isSafeInteger(length)) {
    throw new TimesError('Invalid the first argument');
  }

  // validate type params
  const tree = parent[index];
  cloneIndex++;
  const list = times(length, t => new Node(tree, t + 1, target).resolve().getNode());
  parent.splice(index, 1, ...list);
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
  readonly cloneIndex = cloneIndex;
  constructor(tree: any, size: number, target: string = 'T') {
    this.node = dcp.clone(this.getKey('tree'), tree);
    this.size = size;
    this.target = target;
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
    const { node, target, size } = this;
    const { params = [] } = node.value;
    times(params.length, index => this.resolveUnionTypes(params, index));
    const argPath = ['typeAnnotation', 'typeAnnotation', 'typeName', 'name'];
    const targetArgIndex = params.findIndex(p => get(p, argPath) === target);
    const targetArg = params[targetArgIndex];
    if (!targetArg) {
      return this;
    }
    const argKey = this.getKey('arg');
    const targets = times(size, n => {
      const arg = dcp.clone(argKey, targetArg);
      arg.name = `${arg.name}${++n}`;
      return set(arg, argPath, `${target}${n}`);
    });
    node.value.params.splice(targetArgIndex, 1, ...targets);
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
