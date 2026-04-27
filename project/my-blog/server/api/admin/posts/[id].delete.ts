export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const db = useDb()
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id)

  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在' })
  }

  return { success: true }
})
