export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) return null

  // 1. 尝试从数据库读取
  const db = useDb()
  const post = db.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'").get(slug)

  // 3. 浏览量统计 (统一逻辑)
  const stats = db.prepare("SELECT views FROM stats WHERE slug = ?").get(slug) as { views: number } | undefined
  let currentViews = (stats?.views || 0) + 1
  
  // 更新统计表
  db.prepare("INSERT OR REPLACE INTO stats (slug, views) VALUES (?, ?)").run(slug, currentViews)
  
  // 如果是数据库文章，同步更新 posts 表
  if (post) {
    db.prepare("UPDATE posts SET views = views + 1 WHERE slug = ?").run(slug)
  }

  let finalPost: any = null

  if (post) {
    try {
      const parsed = await parseMarkdown(post.content)
      const normalizedToc = parsed.toc?.links ? parsed.toc : { links: parsed.toc || [] }
      finalPost = {
        ...post,
        body: parsed,
        toc: normalizedToc,
        views: currentViews
      }
    } catch (err) {
      console.error('Markdown parsing failed:', err)
    }
  }

  if (!finalPost) {
    // 2. 如果数据库没有，尝试从本地 Content 读取
    const path = slug.startsWith('/') ? slug : `/${slug}`
    try {
      const localPost = await (queryCollection as any)(event as any, 'blog')
        .where('path', '=', path)
        .first()
      
      if (localPost) {
        // 规范化 TOC 结构，确保前端能正确读到 links
        const rawToc = (localPost as any).toc || (localPost as any).body?.toc
        const normalizedToc = rawToc?.links ? rawToc : { links: rawToc || [] }

        finalPost = {
          ...localPost,
          toc: normalizedToc,
          views: currentViews
        }
      }
    } catch (e) {
      console.error('Local content fetch failed:', e)
    }
  }

  return finalPost
})
