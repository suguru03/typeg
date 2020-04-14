class Promise {
  @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
  all<T>(values: [T | PromiseLike<T>]): Promise<[T]>;

  @Times(5, 'E', { args: { filter: 'multi' } })
  catch<T, E>(filter: Aigle.CatchFilter<E>, onReject: (error: E) => Aigle.ReturnType<T>): Aigle<T | R>;
}
