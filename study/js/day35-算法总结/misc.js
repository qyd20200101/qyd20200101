// ============================================================
// 杂项：两数之和 / 三数之和 / 盛水最多容器 / 有效括号 / 最长子串 / 每日温度
// ============================================================

// ------------------------ 两数之和 (Map) ------------------------
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}

// ------------------------ 三数之和 (排序 + 定一找二) ------------------------
function threeSum(nums) {
  const res = [];
  nums.sort((a, b) => a - b);
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;  // 去重
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        res.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;   // 去重
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++; right--;
      } else if (sum < 0) left++;
      else right--;
    }
  }
  return res;
}

// ------------------------ 盛水最多容器 ------------------------
function maxArea(height) {
  let left = 0, right = height.length - 1, max = 0;
  while (left < right) {
    max = Math.max(max, Math.min(height[left], height[right]) * (right - left));
    height[left] < height[right] ? left++ : right--;
  }
  return max;
}

// ------------------------ 有效括号 ------------------------
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (!map[char]) { stack.push(char); }
    else if (stack.pop() !== map[char]) return false;
  }
  return stack.length === 0;
}

// ------------------------ 无重复字符最长子串 (滑动窗口) ------------------------
function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) { set.delete(s[left]); left++; }
    set.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  return max;
}

// ------------------------ 每日温度 (单调栈) ------------------------
function dailyTemperatures(temperatures) {
  const res = Array(temperatures.length).fill(0), stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const idx = stack.pop();
      res[idx] = i - idx;
    }
    stack.push(i);
  }
  return res;
}
