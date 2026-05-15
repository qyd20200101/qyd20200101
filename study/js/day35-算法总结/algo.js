function preOrderIterative(root) {
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

function midOrderIterative(root) {
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

function postOrderIterative(root) {
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
  return result;
}

function TreeNode(val) {
  this.val = val;
  this.left = this.right = null;
}
