//promise.retry实现有限次自动重试请求，
function retry(fn, timers) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      fn()
        .then(resolve)
        .catch((err) => {
          if (n <= timers) {
            reject(err);
          } else attempt(n - 1);
        });
    }
    attempt(timers);
  });
}

retry(() => fetch("/api/data"), 3);

//promise并发调度器:一共十个请求，最大可以一起请求三个，有完成的就补充
// 三个关键变量：limit（并发上限）、running（当前几个在跑）、index（下一个该谁跑）

function asyncPool(limit, tasks) {
  const results = [];
  let running = 0,
    index = 0;
  return new Promise((resolve) => {
    function next() {
      if (index >= tasks.length && running === 0) {
        return resolve(results); //全部完成
      }
      //没到上限塞任务
      while (running < limit && index < tasks.length) {
        const i = index++;
        running++;
        tasks[i]()
          .then((r) => {
            results[i] = r;
          })
          .catch((e) => {
            results[i] = e;
          })
          //完成一个启动下一个
          .finally(() => {
            running--;
            next();
          });
      }
    }
  });
}
