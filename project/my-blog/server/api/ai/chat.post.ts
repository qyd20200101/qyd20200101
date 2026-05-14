import { askDeepSeek } from '../../utils/ai-service'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  // 权限检查：所有环境都需要认证
  requireAdmin(event)

  const body = await readBody(event)
  const { messages, skill } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: '消息格式错误'
    })
  }

  try {
    const reply = await askDeepSeek({
      messages,
      skill
    })

    return {
      reply
    }
  } catch (err: any) {
    console.error('AI API Error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'AI 服务异常'
    })
  }
})
