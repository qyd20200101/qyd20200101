export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{
    title: string
    slug?: string
    type?: string
    category?: string
    theme?: string
    tags?: string | string[]
    description?: string
    content: string
    status?: 'draft' | 'published'
  }>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: '标题不能为空' })
  }

  const db = useDb()
  const slug = body.slug?.trim() || toSlug(body.title)

  const tags = Array.isArray(body.tags)
    ? body.tags.join(',')
    : (body.tags || '')

  try {
    const info = db.prepare(`
      INSERT INTO posts (title, slug, type, category, theme, tags, description, content, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.title.trim(),
      slug,
      body.type?.trim() || '',
      body.category?.trim() || '',
      body.theme?.trim() || '',
      tags,
      body.description?.trim() || '',
      body.content,
      body.status || 'draft'
    )

    return {
      success: true,
      id: info.lastInsertRowid
    }
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed: posts.slug')) {
      throw createError({ statusCode: 400, statusMessage: 'slug 已存在，请换一个' })
    }
    throw e
  }
})
