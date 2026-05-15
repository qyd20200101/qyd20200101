const pinia = {
  _s: new Map(),
};

function defineStore(id, setup) {
  function useStore() {
    //关键：先缓存
    if (pinia._s.has(id)) {
      return pinia._s.get(id);
    }
    //首次执行setup,创建store
    const store = setup();
    pinia._s.set(id, store);
    return store;
  }

  return useStore;
}
//使用
const useCounterStore = defineStore("counter", () => {
  const count = ref(0);
  const increment = () => count.value++;
  return { count, increment };
});

//不管在哪调用多少次，拿到的是同一个对象
const s1 = useCounterStore();
const s2 = useCounterStore();
s1 === s2;
