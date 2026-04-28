import { useDb } from '../../../utils/sqlite'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, content, tags, category } = body

  if (!title || !content) {
    throw createError({
      statusCode: 400,
      statusMessage: '标题和内容不能为空'
    })
  }

  const db = useDb()
  
  // 生成一个临时的 slug
  const slug = `draft-${Date.now()}`

  try {
    const result = db.prepare(`
      INSERT INTO posts (title, slug, content, tags, category, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(title, slug, content, tags || '', category || '未分类')

    return {
      success: true,
      id: result.lastInsertRowid,
      slug
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `保存草稿失败: ${e.message}`
    })
  }
})
