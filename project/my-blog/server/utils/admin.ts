import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

export function requireAdmin(event: any) {
  const config = useRuntimeConfig(event)
  const token = getCookie(event, 'admin_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录'
    })
  }

  if (!config.jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'JWT_SECRET 未配置'
    })
  }

  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: '登录已失效'
    })
  }
}
