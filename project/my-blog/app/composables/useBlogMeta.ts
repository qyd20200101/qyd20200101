/**
 * 从 API 返回的文章列表动态聚合标签 / 类型 / 分类
 * 避免前端硬编码标签列表
 */
export function aggregateTags(posts: { tags?: string[] }[]): string[] {
  const set = new Set<string>()
  for (const p of posts) {
    if (p.tags) p.tags.forEach(t => set.add(t))
  }
  return [...set].sort()
}

export function aggregateTypes(posts: { type?: string }[]): string[] {
  const set = new Set<string>()
  for (const p of posts) {
    if (p.type) set.add(p.type)
  }
  return [...set].sort()
}

/** 按数量排序取 top N */
export function topTags(posts: { tags?: string[] }[], limit = 10): string[] {
  const counts = new Map<string, number>()
  for (const p of posts) {
    p.tags?.forEach(t => counts.set(t, (counts.get(t) || 0) + 1))
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}
