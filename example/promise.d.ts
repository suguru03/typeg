class Promise {
  @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
  all<T>(values: [T | PromiseLike<T>]): Promise<[T]>;
}
