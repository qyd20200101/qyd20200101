import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

export function requireAdmin(event: any) {
  const token = getCookie(event, 'auth_token')

  if (!token || token !== 'authenticated-admin-session') {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录'
    })
  }

  return { username: 'admin' }
}
