export { times, get, set };

function times<T>(n: number, iterator: (index: number) => T): T[] {
  const arr: T[] = Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = iterator(i);
  }
  return arr;
}

function get<T>(obj: object, paths: string[], def?: T): T {
  let i = -1;
  const size = paths.length;
  let target: T | object = obj;
  while (target && ++i < size) {
    target = target[paths[i]];
  }
  return obj === undefined ? def : (target as T);
}

function set<T extends object>(obj: T, paths: string[], value: any): T {
  let i = -1;
  const size = paths.length;
  let target: T | object = obj;
  while (++i < size) {
    const p = paths[i];
    if (i === size - 1) {
      target[p] = value;
    } else {
      target = target[p] = target[p] || {};
    }
  }
  return obj;
}
