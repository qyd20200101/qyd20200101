class EventEmitter {
  constructor() {
    this.events = {};
  }
  //on注册回调,把fn塞进事件仓库,同一个事件可以有多个回调,每个都放进数组
  on(event, fn) {
    (this.events[event] || []).push(fn); //注册回调
  }
  //删除指定回调,从click数组里删掉fn
  off(event, fn) {
    this.events[event] = this.events[event]?.filter((f) => f !== fn); //删回调
  }
  //触发执行,从仓库取出click对应的所有fn,遍历调用fn
  emit(event, ...args) {
    this.events[event]?.forEach((fn) => fn(...args));
  }
}
