'use strict';

Object.assign(exports, { times, get, set });

function times(n, iterator) {
  const arr = Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = iterator(i);
  }
  return arr;
}

function get(obj, paths, def) {
  let i = -1;
  let size = paths.length;
  while (obj && ++i < size) {
    obj = obj[paths[i]];
  }
  return obj === undefined ? def : obj;
}

function set(obj, paths, value) {
  let o = obj;
  let i = -1;
  let size = paths.length;
  while (++i < size) {
    const p = paths[i];
    if (i === size - 1) {
      o[p] = value;
    } else {
      o = o[p] = o[p] || {};
    }
  }
  return obj;
}
