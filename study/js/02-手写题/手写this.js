//手写call
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx ?? window;
  const fn = Symbol();
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};

//手写apply
Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx ?? window;
  const fn = Symbol();
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};

//手写bind
Function.prototype.myBind = function (ctx, ...boundArgs) {
  const fn = this;
  return function (...args) {
    return fn.apply([...boundArgs, ...args]); //合并预设参数和实际参数
  };
};
//验证
function say(greeting) {
  return `${greeting},${this.name}`;
}
const obj1 = { name: "Alice" };
say.myApply(obj1, "Hi");

const obj2 = { name: "Tom" };
function say2(prefix, suffix) {
  return `${prefix}${this.name}${suffix}`;
  const bound = say.myBind(obj2, "Hello");
  bound("!");
}
