// ============================================================
// 动态规划：爬楼梯 / 打家劫舍 / LIS / 零钱兑换 / 背包
// ============================================================

// ------------------------ 爬楼梯 (dp[i] = dp[i-1] + dp[i-2]) ------------------------
function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;               // a=dp[i-2], b=dp[i-1]
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// ------------------------ 打家劫舍 ------------------------
function rob(nums) {
  if (!nums.length) return 0;
  if (nums.length === 1) return nums[0];
  let prev2 = nums[0], prev1 = Math.max(nums[0], nums[1]);
  for (let i = 2; i < nums.length; i++) {
    [prev2, prev1] = [prev1, Math.max(prev1, prev2 + nums[i])];
  }
  return prev1;
}

// ------------------------ 最长递增子序列 LIS ------------------------
function lengthOfLIS(nums) {
  const dp = Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    max = Math.max(max, dp[i]);
  }
  return max;
}

// ------------------------ 零钱兑换 ------------------------
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let j = coin; j <= amount; j++) {
      dp[j] = Math.min(dp[j], dp[j - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

// ------------------------ 0-1 背包 (一维优化) ------------------------
function knapsack(weights, values, capacity) {
  const dp = Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let j = capacity; j >= weights[i]; j--) {  // 倒着走，保证每件只用一次
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}
