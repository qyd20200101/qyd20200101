export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDb()

  const tags = Array.isArray(body.tags)
    ? body.tags.join(',')
    : (body.tags || '')

  try {
    db.prepare(`
      UPDATE posts 
      SET title = ?, slug = ?, type = ?, category = ?, theme = ?, tags = ?, description = ?, content = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      body.title,
      body.slug,
      body.type,
      body.category,
      body.theme,
      tags,
      body.description,
      body.content,
      body.status,
      id
    )

    return { success: true }
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed: posts.slug')) {
      throw createError({ statusCode: 400, statusMessage: 'slug 已存在，请换一个' })
    }
    throw e
  }
})
