declare class Test<R> {
  @Times(3)
  get<T>(arg: T): Test<R>;
}
