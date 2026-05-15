Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx || window;
  const fn = Symbol();
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};
