function preOrder(root) {
  let stack = [root];
  let result = [];
  while (stack.length) {
    //弹
    let node = stack.pop();
    //存
    result.push(node.val);
    if (node.right) {
      stack.push(node.right);
    }
    if (node.left) {
      stack.push(node.left);
    }
  }
  return result;
}

function deepClone(target, map = new WeakMap()) {
  if (typeof target !== "object" || target === null) {
    return target;
  }
  if (map.has(target)) {
    return map.get(target);
  }
  let clone = Array.isArray(target) ? [] : {};
  map.set(target, clone);
  Reflect.ownKeys(target).forEach((key) => {
    clone[key] = deepClone(target[key], map);
  });
  return clone;
}

class EventEmitter {
  constructor() {
    this.events = {};
  }
  //往this.events[event]数组里面push一个回调
  on(event, fn) {
    //如果没有这个事件，先建空数组
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(fn);
  }
  //emit:找到this.events[event]数组，遍历执行每个fn
  emit(event, ...args) {
    //如果这个事件有回调，就挨个调用
    if (this.events[event]) {
      this.events[event].forEach((fn) => fn(...args));
    }
  }
  off(event, fn) {
    this.events[event] = this.events[event].filter((f) => f !== fn);
  }
  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}
//链表反转
function reverseList(head) {
  let prev = null;
  let cur = head;
  while (cur) {
    let next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}
//快慢指针
function hasCycle(head) {
  let fast = head;
  let slow = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      return true;
    }
  }
  return false;
}

Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx || window;
  const fn = Symbol();
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};

Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx || window;
  const fn = Symbol();
  ctx[fn] = this;
  const result = ctx[fn](...args);
  delete ctx[fn];
  return result;
};
Function.prototype.myBind = function (ctx, ...arg) {
  const fn = this;
  function bindArg(...args) {
    //new 调用时this instanceof boundFn ?this"ctx,[...args,...arg];
    return fn.apply(this instanceof bindArg ? this : ctx, [...args, ...arg]);
  }
  bindArg.prototype = Object.create(fn.prototype);
  return bindArg;
};
function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left);
  const prototype = right.prototype;
  while (proto) {
    if (proto === prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
function myNew(Constructor, ...args) {
  let obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  const isObject =
    result !== null &&
    (typeof result === "object" || typeof result === "function");
  return isObject ? result : obj;
}

//防抖
function debounce(fn, delay, immediate = false) {
  let timer = null;

  const debounced = function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate) {
      //立即执行:第一次立刻调用，设冷却
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (callNow) {
        fn.apply(this, args);
      }
    } else {
      //非立即执行：延迟执行
      timer = setTimeout(() => {
        fn.apply(this, args);
      });
    }
  };
  //取消功能
  debounced.cancel = function () {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

function preOrderList(root) {
  let stack = [root];
  let result = [];
  while (stack.length) {
    let node = stack.pop();
    result.push(node.val);
    if (node.right) {
      stack.push(node.right);
    }
    if (node.left) {
      stack.push(node.left);
    }
  }
  return result;
}

function inOrder(root) {
  let stack = [];
  let result = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur);
      cur = cur.left;
    }
    cur = stack.pop();
    result.push(cur.val);
    cur = cur.right;
  }
  return result;
}

function postOrder(root) {
  let stack = [root];
  let result = [];
  while (stack.length) {
    let node = stack.pop();
    result.push(node.val);
    if (node.left) {
      stack.push(node.left);
    }
    if (node.right) {
      stack.push(node.right);
    }
  }
  return result.reverse();
}
