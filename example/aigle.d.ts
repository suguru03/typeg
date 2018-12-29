export default AigleCore.Aigle;
export class Aigle<R> extends AigleCore.Aigle<R> {}
export as namespace Aigle;

declare namespace AigleCore {
  export class Aigle<R> implements PromiseLike<R> {
    @Times(2, 'T', { args: { values: 'multi' }, returnType: 'arrayMulti' })
    static all<T>(values: [T | PromiseLike<T>]): Aigle<[T, null]>;
  }
}
