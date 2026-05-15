// ============================================================
// 贪心：股票 / 跳跃游戏 / 分饼干 / 加油站
// ============================================================

// ------------------------ 买卖一次 (记录最低价) ------------------------
function maxProfit1(prices) {
  let minPrice = Infinity, max = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    max = Math.max(max, p - minPrice);
  }
  return max;
}

// ------------------------ 买卖多次 (累加所有上坡) ------------------------
function maxProfit2(prices) {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
  }
  return profit;
}

// ------------------------ 跳跃游戏 (维护最远到达) ------------------------
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}

// ------------------------ 跳跃游戏2 — 最少步数 ------------------------
function jump(nums) {
  let maxReach = 0, curEnd = 0, steps = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    maxReach = Math.max(maxReach, i + nums[i]);
    if (i === curEnd) { steps++; curEnd = maxReach; }
  }
  return steps;
}

// ------------------------ 分饼干 ------------------------
function findContentChildren(g, s) {
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);
  let i = 0, j = 0;
  while (i < g.length && j < s.length) {
    if (s[j] >= g[i]) i++;
    j++;
  }
  return i;
}
