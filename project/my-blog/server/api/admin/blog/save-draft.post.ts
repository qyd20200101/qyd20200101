import fs from 'node:fs/promises'
import { join } from 'pathe'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, content } = body

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: '内容不能为空'
    })
  }

  // 处理文件名：移除非法字符，默认使用标题或时间戳
  const safeTitle = (title || 'Untitled_Draft').replace(/[\\/:*?"<>|]/g, '_').trim()
  const filename = `${safeTitle}_${Date.now()}.md`
  const draftsDir = join(process.cwd(), 'content', 'blog')

  try {
    await fs.mkdir(draftsDir, { recursive: true })
    const filePath = join(draftsDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
    
    return {
      success: true,
      path: filePath,
      filename
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: '保存草稿失败: ' + e.message
    })
  }
})
