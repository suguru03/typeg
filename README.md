# Typeg

Typeg generates type definitions for TypeScript using decorators using [Prettier](https://github.com/prettier/prettier).

`@Times` creates similar type definitions such as [`Promise.all`](https://github.com/Microsoft/TypeScript/blob/v3.2.2/lib/lib.es2015.promise.d.ts#L41) easily.

Currently, It will only work where you can define TypeScript decorators.

```ts
class Promise {
  @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
  all<T>(values: [T | PromiseLike<T>]): Promise<[T]>;
}
```

```ts
yarn typeg promise.d.ts --out _promise.d.ts
```

```ts
class Promise {
  all<T1>(values: [T1 | PromiseLike<T1>]): Promise<[T1]>;
  all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Promise<[T1, T2]>;
  all<T1, T2, T3>(
    values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>],
  ): Promise<[T1, T2, T3]>;
  all<T1, T2, T3, T4>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>
    ],
  ): Promise<[T1, T2, T3, T4]>;
  ...
}
```

Other examples are [here](https://github.com/suguru03/typeg/tree/master/examples)!

## Usage

```
npm install -D prettier typeg
// or
yarn add -D prettier typeg
```

```
npx typeg <filepath> --out <dirpath>
// or
yarn typeg <filepath> --out <dirpath>
```

## Use case

- [Aigle](https://github.com/suguru03/aigle/blob/master/typings/aigle-base.d.ts)
