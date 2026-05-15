// ============================================================
// 二叉树：遍历 / 最大深度 / 对称 / 最近公共祖先 / 路径和
// ============================================================

// ------------------------ 前中后序遍历（递归 + 迭代） ------------------------
// 前序：根→左→右
function preorderRecursive(root) {
  const res = [];
  function dfs(node) { if (!node) return; res.push(node.val); dfs(node.left); dfs(node.right); }
  dfs(root);
  return res;
}
function preorderIterative(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    res.push(node.val);
    if (node.right) stack.push(node.right); // 先右后左，保证左先弹
    if (node.left) stack.push(node.left);
  }
  return res;
}

// 中序：左→根→右
function inorderRecursive(root) {
  const res = [];
  function dfs(node) { if (!node) return; dfs(node.left); res.push(node.val); dfs(node.right); }
  dfs(root);
  return res;
}
function inorderIterative(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }  // 一路向左到底
    cur = stack.pop();
    res.push(cur.val);
    cur = cur.right;
  }
  return res;
}

// 后序：左→右→根  (巧法: 前序「根→右→左」再 reverse)
function postorderRecursive(root) {
  const res = [];
  function dfs(node) { if (!node) return; dfs(node.left); dfs(node.right); res.push(node.val); }
  dfs(root);
  return res;
}
function postorderIterative(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    res.push(node.val);
    if (node.left) stack.push(node.left);   // 先左后右 → 弹栈时右先
    if (node.right) stack.push(node.right);
  }
  return res.reverse();
}

// ------------------------ 层序遍历 BFS ------------------------
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}

// ------------------------ 最大深度 ------------------------
function maxDepth(root) {
  if (!root) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}

// ------------------------ 对称二叉树 ------------------------
function isSymmetric(root) {
  if (!root) return true;
  function isMirror(left, right) {
    if (!left && !right) return true;
    if (!left || !right) return false;
    return left.val === right.val && isMirror(left.left, right.right) && isMirror(left.right, right.left);
  }
  return isMirror(root.left, root.right);
}

// ------------------------ 最近公共祖先 ------------------------
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left || right;
}

// ------------------------ 路径和 ------------------------
function hasPathSum(root, targetSum) {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  return hasPathSum(root.left, targetSum - root.val) || hasPathSum(root.right, targetSum - root.val);
}
