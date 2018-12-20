declare class Test<R> {
  // @Times(3)
  // basic<T>(arg: T): Promise<R>;

  // @Times(4)
  // basicWithResult<T>(arg: T): T;

  // @Times(4)
  // basicWithMultiResult<T>(arg: T): R | T | null;

  @Times(2, 'T', { args: { arg: 'multi' }, returnType: 'multi' })
  basicWithPromiseMultiResult<T>(arg: T): Promise<T | null>;
}
