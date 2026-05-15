const num2 = [1, 2, 3, 4];
return num2.map((item) => item * 2);

const nums = [1, 2, 3, 4, 5, 6];
return nums.filter((item) => item % 2 === 0);

const num3 = [1, 2, 2, 3, 4, 4, 3, 5];
const result = [...setInterval(num3)];

const res = num3.filter((item, index) => num3.indexOf(item) === index);

const words = ["hi", "hello", "hey", "world"];
const res1 = words.find((item) => item.length > 3);
const str = "abcdeaabce";
const res2 = str.split("").reduce((acc, char) => {
  acc[char] = (acc[char] || 0) + 1;
  return acc;
}, {});

return num2.reduce((acc, cur) => {
  acc.push(cur * 2);
  return acc;
}, []);

return nums.reduce((acc, cur) => {
  if (cur % 2 === 0) acc.push(cur);
  return acc;
}, []);
const arr = [1, [2, 3], [[4, 5], 6]];
function flatten(arr) {
  return arr.reduce((acc, cur) => {
    return acc.concat(Array.isArray(cur) ? flatten(cur) : cur);
  });
}
const maxArr = [3, 7, 1, 8, 4];
return maxArr.reduce((acc, cur) => {
  return cur > acc ? cur : acc;
});
const users = [
  { name: "张三", age: 18 },
  { name: "李四", age: 18 },
  { name: "王五", age: 18 },
  { name: "赵六", age: 18 },
];
return users.reduce((acc, cur) => {
  const key = cur.age;
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(cur.name);
  return acc;
}, {});

class LRU {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) {
      return -1;
    }
    //取出值
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) {
      //key存在就删除
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      //拿第一个key最久,set是顺序插入,keys（）返回的迭代器第一个就是最早的
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(key, value);
  }
}

function deepClone(target, map = new WeakMap()) {
  if (typeof target !== "object" || target === null) {
    return target;
  }
  if (map.has(target)) {
    return map.get(target);
  }
  const cloneTarget = Array.isArray(target) ? [] : {};
  map.set(target, cloneTarget);
  Reflect.ownKeys(target).forEach((key) => {
    cloneTarget[key] = deepClone(target[key], map);
  });
  return cloneTarget;
}
class EventEmitter {
  constructor() {
    this.events = {};
  }
  //注册（简单往数组里面塞）
  on(event, fn) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(fn);
  }
  //触发(取出数组挨个执行)
  emit(event, ...args) {
    this.events[event]?.forEach((fn) => fn(...args));
  }
  off(event, fn) {
    this.events[event] = this.events[event]?.filter((f) => f !== fn);
  }
  //一次性(用wrapper包装，执行自删)
  once() {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}
