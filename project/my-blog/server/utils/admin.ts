import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

/**
 * 统一管理后台认证
 * 支持 JWT (优先) 和简单 token 两种模式，兼容平滑迁移
 */
export function requireAdmin(event: any) {
  const config = useRuntimeConfig(event)

  // 1. 优先检查 JWT token (admin_token)
  const adminToken = getCookie(event, 'admin_token')
  if (adminToken && config.jwtSecret) {
    try {
      const payload = jwt.verify(adminToken, config.jwtSecret) as { username: string }
      return { username: payload.username }
    } catch {
      // JWT 无效，继续尝试简单 token
    }
  }

  // 2. 兼容简单 token (auth_token) — 向后兼容
  const authToken = getCookie(event, 'auth_token')
  if (authToken === 'authenticated-admin-session') {
    return { username: 'admin' }
  }

  throw createError({
    statusCode: 401,
    statusMessage: '未登录'
  })
}
