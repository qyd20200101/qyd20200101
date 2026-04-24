// 思路：1.初始化一个空的数组
// 2.遍历数组中的每一个元素
// 对每一个元素检测是否存在空数组中，如果存在，说明存在重复元素
// 不存在，则将元素添加到数组中
// 3.遍历整个数组都没发现重复的元素返回false
// function containsDuplicate(nums){
//     // Set集合中的元素只会出现一次，唯一
//     // 插入方法Set.add()
//     // 调用add()方法时集合中不存在相同的元素
//     // has()方法检测某个值是否存在集合中
//     // 性能方面：比Array.prototype.includes平均速度快
//     const seen = new Set();
//     for (const num of nums) {
//         if(seen.has(num)){
//             return true;
//         }
//         seen.add(num);
//     }
//     return false;
// }
// console.log(containsDuplicate([1,2,2,3,4,5]));
/*
哈希表实现功能
*/
function contaionsDuplicate(nums) {
    // Map的键只能出现一次
    /*
    通过for...of迭代后，每次会形成[key,value]的数组，迭代按顺序插入，通过set()方法插入到集合中
    */
    const hashTable = new Map();
    for (const num of nums) {
        if (hashTable.has(num)) {
            return true;
        }
        hashTable.set(num, true);
    }
    return false
}
console.log(contaionsDuplicate([1, 2, 3, 4, 5, 6]));
/*
初始化两个哈希映射:分别存储字符串s和t每个字符出现的次数
遍历字符串:遍历字符串s和t,在哈希映射中记录每个字符出现的次数
比较哈希映射:比较两个哈希映射是否完全相同
*/

function isAnagram(s, t) {
    if (s.length !== t.length) {
        return false;
    }

    const mapS = {}, mapT = {};
    // 同时创建两个哈希映射
    for (let i = 0; i < s.length; i++) {
        mapS[s[i]] = (mapS[s[i]] || 0) + 1;
        mapT[t[i]] = (mapT[t[i]] || 0) + 1;

    }

    // 直接比较两个映射
    for (let key in mapS) {
        if (mapS[key] !== mapT[key]) {
            return false;
        }
    }
    // 确保t中的每个字符也在s中出现相同的次数
    for (let key in mapT) {
        if (mapS[key] === undefined) {
            return false;
        }
    }

    return true;
}

const s1 = "asddsaas",t1="dsadsads";
console.log(isAnagram(s1,t1));




