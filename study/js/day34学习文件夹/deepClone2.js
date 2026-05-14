//浅拷贝只复制第一层，深拷贝要递归复制所有层级
//难点:循环引用，特殊类型Date,RexExp,Map,Set,Function,Symbol key,不可枚举

function deepClone(target, map = new WeakMap()) {
  if (typeof target !== "object" || target === null) {
    return target;
  }
  if (map.has(target)) {
    return map.get(target);
  }
  const clone = new Array.isArray(target) ? [] : {};
  map.set(target, clone);
  for (const key of Reflect.ownKeys(target)) {
    clone[key] = deepClone(target[key], map);
  }
  return clone;
}
