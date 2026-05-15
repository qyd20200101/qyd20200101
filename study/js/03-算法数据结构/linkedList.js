// ============================================================
// 链表：反转 / 环检测 / 合并 / 中间节点 / 倒数第N / 相交点
// ============================================================

// ------------------------ 反转链表 ------------------------
function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}

// ------------------------ 环检测（快慢指针） ------------------------
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// ------------------------ 合并有序链表 ------------------------
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(-1);
  let cur = dummy;
  while (l1 && l2) {
    if (l1.val < l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return dummy.next;
}

// ------------------------ 中间节点 ------------------------
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}

// ------------------------ 倒数第 N 个节点 ------------------------
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let slow = dummy, fast = dummy;
  while (n--) fast = fast.next;               // fast 先走 n 步
  while (fast.next) { slow = slow.next; fast = fast.next; }
  slow.next = slow.next.next;
  return dummy.next;
}

// ------------------------ 相交链表 ------------------------
function getIntersectionNode(headA, headB) {
  let pa = headA, pb = headB;
  while (pa !== pb) {
    pa = pa ? pa.next : headB;
    pb = pb ? pb.next : headA;
  }
  return pa;
}
