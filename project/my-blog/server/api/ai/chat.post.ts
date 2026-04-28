import { askDeepSeek } from '../../utils/ai-service'

export default defineEventHandler(async (event) => {
  // 简单权限检查
  const user = event.context.user
  if (!user && process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 401,
      statusMessage: '未授权访问'
    })
  }

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
