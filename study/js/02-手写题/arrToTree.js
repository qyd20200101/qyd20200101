//arrToTree核心：Map结合parentld
//异常遍历建map,找父节点往里塞
function arrToTree(arr) {
  const map = new Map();
  const res = [];
  for (const item of arr) {
    //全部放进Map
    map.set(item.id, { ...item, children: [] });
  }
  for (const item of arr) {
    //找到父节点就塞进去，
    if (item.pid) {
      map.get(item.pid).children.push(map.get(item.id));
    } else {
      //没有父节点说明是根节点
      res.push(map.get(item.id));
    }
  }
}
//treeToArr:树扁平化，用栈或队列遍历俗话，把嵌套节点铺平
