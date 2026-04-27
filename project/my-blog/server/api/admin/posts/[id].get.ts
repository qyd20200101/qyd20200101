export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const db = useDb()
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在' })
  }

  return {
    ...post,
    tags: post.tags || '' // 前端编辑页期望逗号分隔的字符串
  }
})
