// ============================================================
// 手写 call / apply / bind / instanceof / new
// ============================================================

// ---------- call ----------
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx ?? window;
  const fn = Symbol('fn');
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};

// ---------- apply ----------
Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx ?? window;
  const fn = Symbol('fn');
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};

// ---------- bind ----------
// bind 要点：① 返回新函数 ② 支持预设参数 ③ 支持 new（this 指向实例）
Function.prototype.myBind = function (ctx, ...boundArgs) {
  const fn = this;
  function boundFn(...callArgs) {
    // new 调用时 this 指向实例，否则用绑定的 ctx
    return fn.apply(this instanceof boundFn ? this : ctx, [...boundArgs, ...callArgs]);
  }
  // 原型继承
  boundFn.prototype = Object.create(fn.prototype);
  return boundFn;
};

// ---------- new ----------
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);  // 1. 创空对象 + 绑原型
  const result = Constructor.apply(obj, args);        // 2. 执行构造函数
  const isObject = result !== null && (typeof result === 'object' || typeof result === 'function');
  return isObject ? result : obj;                      // 3. 返回
}

// ---------- instanceof ----------
function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left);
  const prototype = right.prototype;
  while (proto) {
    if (proto === prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
