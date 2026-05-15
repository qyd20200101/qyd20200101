// ============================================================
// 深拷贝 — 含循环引用 + Map/Set
// ============================================================
// 面试加分点：
// 1. WeakMap 弱引用，原对象销毁后 key 自动 GC，避免内存泄漏
// 2. Reflect.ownKeys 能拿到 Symbol 键和不可枚举属性
// 3. for...in + hasOwnProperty 只拿可枚举字符串键，不拿 Symbol

function deepClone(target, map = new WeakMap()) {
  // 1. 基本类型 + null
  if (typeof target !== 'object' || target === null) {
    return target;
  }

  // 2. 特殊对象
  if (target instanceof Date) return new Date(target);
  if (target instanceof RegExp) return new RegExp(target);

  // 3. 循环引用：查缓存
  if (map.has(target)) {
    return map.get(target);
  }

  // 4. 初始化容器
  const clone = Array.isArray(target) ? [] : {};

  // 5. 存入缓存（必须先存再递归，否则循环引用会死循环）
  map.set(target, clone);

  // 6. 递归拷贝
  Reflect.ownKeys(target).forEach(key => {
    clone[key] = deepClone(target[key], map);
  });

  return clone;
}
