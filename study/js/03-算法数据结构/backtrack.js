// ============================================================
// 回溯：全排列 / 子集 / 组合 / 括号生成 / N皇后
// ============================================================

// ------------------------ 全排列 (used 数组避免同一元素复用) ------------------------
function permute(nums) {
  const res = [], path = [], used = Array(nums.length).fill(false);
  function backtrack() {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      path.push(nums[i]); used[i] = true;
      backtrack();
      path.pop(); used[i] = false;
    }
  }
  backtrack();
  return res;
}

// ------------------------ 子集 (start 保证不回头选) ------------------------
function subsets(nums) {
  const res = [], path = [];
  function backtrack(start) {
    res.push([...path]);              // 每个节点都是一个子集
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }
  backtrack(0);
  return res;
}

// ------------------------ 组合 (限制长度 k，剪枝优化) ------------------------
function combine(n, k) {
  const res = [], path = [];
  function backtrack(start) {
    if (path.length === k) { res.push([...path]); return; }
    // 剪枝: 剩余元素不够就不用走了
    for (let i = start; i <= n - (k - path.length) + 1; i++) {
      path.push(i);
      backtrack(i + 1);
      path.pop();
    }
  }
  backtrack(1);
  return res;
}

// ------------------------ 括号生成 (left < n 可加左, right < left 可加右) ------------------------
function generateParenthesis(n) {
  const res = [];
  function backtrack(left, right, path) {
    if (path.length === 2 * n) { res.push(path.join('')); return; }
    if (left < n) { path.push('('); backtrack(left + 1, right, path); path.pop(); }
    if (right < left) { path.push(')'); backtrack(left, right + 1, path); path.pop(); }
  }
  backtrack(0, 0, []);
  return res;
}

// ------------------------ N皇后 ------------------------
function solveNQueens(n) {
  const res = [], board = Array.from({ length: n }, () => Array(n).fill('.'));
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function backtrack(row) {
    if (row === n) { res.push(board.map(r => r.join(''))); return; }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      board[row][col] = 'Q'; cols.add(col); diag1.add(row - col); diag2.add(row + col);
      backtrack(row + 1);
      board[row][col] = '.'; cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
    }
  }
  backtrack(0);
  return res;
}
