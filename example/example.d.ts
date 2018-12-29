declare class Test<R> {
  @Times(3)
  basic<T>(arg: T): Promise<R | T | null>;

  @Times(4)
  basicWithResult<T>(value: T): T;

  @Times(4)
  basicWithMultiResult<T>(value: T): R | T | null;

  @Times(3, 'T', { args: { value: 'multi' } })
  basicWithPromiseMultiResult<T>(value: T): Promise<T | null>;

  @Times(3, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
  basicWithPromiseMultiResult<T>(values: [T]): Promise<[T | null]>;
}
