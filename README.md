# Typeg

Typeg generates type definitions for TypeScript using annotations.

Currently, it only supports `Times` which generates generic types `n` times.

## Example

```ts
// example.d.ts
declare class Test<R> {
  // func1
  @Times(3)
  func1<T>(arg: T): R;

  // func2
  @Times(3)
  func2<T>(arg: T): T;

  // func3
  @Times(4)
  func3<T>(arg: T): Promise<R | T | null>;

}
```


```ts
yarn typeg example.d.ts --out _example.d.ts
```

```ts
declare class Test<R> {
  // func1
  func1<T1>(arg1: T1): R;

  func1<T1, T2>(arg1: T1, arg2: T2): R;

  func1<T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): R;

  // func2
  func2<T1>(arg1: T1): T1;

  func2<T1, T2>(arg1: T1, arg2: T2): T1 | T2;

  func2<T1, T2, T3>(arg1: T1, arg2: T2, arg3: T3): T1 | T2 | T3;

  // func3
  func3<T1>(arg1: T1): Promise<R | T1 | null>;

  func3<T1, T2>(arg1: T1, arg2: T2): Promise<R | T1 | T2 | null>;

  func3<T1, T2, T3>(
    arg1: T1,
    arg2: T2,
    arg3: T3,
  ): Promise<R | T1 | T2 | T3 | null>;

  func3<T1, T2, T3, T4>(
    arg1: T1,
    arg2: T2,
    arg3: T3,
    arg4: T4,
  ): Promise<R | T1 | T2 | T3 | T4 | null>;
}
```
