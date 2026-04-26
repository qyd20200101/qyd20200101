/**
 * 性能优化工具集
 */

/**
 * 防抖函数：限制函数在短时间内高频触发
 */
export function debounce(fn: Function, delay: number) {
  let timer: number | null = null
  return function(this: any, ...args: any[]) {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数：限制函数在固定频率触发
 */
export function throttle(fn: Function, limit: number) {
  let inThrottle: boolean
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
