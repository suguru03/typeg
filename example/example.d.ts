declare class Test<R> {
  @Times(3)
  basic<T>(arg: T): Promise<R>;

  @Times(4)
  basicWithResult<T>(arg: T): T;
}
