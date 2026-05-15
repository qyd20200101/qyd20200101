// ============================================================
// 二分查找：基础版 / 左右边界 / 旋转数组 / 峰值 / 二维矩阵
// ============================================================

// ------------------------ 基础二分 ------------------------
function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (left = mid + 1) : (right = mid - 1);
  }
  return -1;
}

// ------------------------ 左边界 ------------------------
function leftBound(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    nums[mid] >= target ? (right = mid - 1) : (left = mid + 1);
  }
  return (left < nums.length && nums[left] === target) ? left : -1;
}

// ------------------------ 右边界 ------------------------
function rightBound(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    nums[mid] <= target ? (left = mid + 1) : (right = mid - 1);
  }
  return (right >= 0 && nums[right] === target) ? right : -1;
}

// ------------------------ 旋转数组查找 ------------------------
function searchRotated(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) { // 左半有序
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else { // 右半有序
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
}

// ------------------------ 旋转数组找最小值 ------------------------
function findMin(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    nums[mid] < nums[right] ? (right = mid) : (left = mid + 1);
  }
  return nums[left];
}

// ------------------------ 寻找峰值 ------------------------
function findPeakElement(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    nums[mid] < nums[mid + 1] ? (left = mid + 1) : (right = mid);
  }
  return left;
}

// ------------------------ 二维有序矩阵查找 (右上角开始) ------------------------
function searchMatrix(matrix, target) {
  if (!matrix.length || !matrix[0].length) return false;
  let row = 0, col = matrix[0].length - 1;
  while (row < matrix.length && col >= 0) {
    if (matrix[row][col] === target) return true;
    matrix[row][col] > target ? col-- : row++;
  }
  return false;
}
