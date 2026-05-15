// ============================================================
// EventEmitter 发布订阅 — on / emit / once / off
// ============================================================

class EventEmitter {
  constructor() {
    this.events = {};
  }

  // 注册事件
  on(event, fn) {
    (this.events[event] = this.events[event] || []).push(fn);
  }

  // 触发事件
  emit(event, ...args) {
    this.events[event]?.forEach(fn => fn(...args));
  }

  // 删除指定回调
  off(event, fn) {
    this.events[event] = this.events[event]?.filter(f => f !== fn);
  }

  // 只执行一次
  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}
