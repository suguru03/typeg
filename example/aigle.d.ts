export default AigleCore.Aigle;
export class Aigle<R> extends AigleCore.Aigle<R> {}
export as namespace Aigle;

declare namespace AigleCore {
  export class Aigle<R> implements PromiseLike<R> {
    @Times(2, 'T')
    all<T>(this: Aigle<[T | PromiseLike<T>]>): Aigle<[T]>;
  }
}
