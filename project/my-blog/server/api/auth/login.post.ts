import jwt from 'jsonwebtoken'
import { defineEventHandler, readBody, createError, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const { username, password } = body

  if (username === config.adminUsername && password === config.adminPassword) {
    // 向后兼容：保留简单 token cookie
    setCookie(event, 'auth_token', 'authenticated-admin-session', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 24小时
    })

    // 签发 JWT (优先使用)
    if (config.jwtSecret) {
      const token = jwt.sign(
        { username },
        config.jwtSecret,
        { expiresIn: '7d' }
      )
      setCookie(event, 'admin_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      })
    }

    return { message: '登录成功' }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message: '账号或密码错误'
  })
})
