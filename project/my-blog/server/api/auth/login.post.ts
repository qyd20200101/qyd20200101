import { defineEventHandler, readBody, createError, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const { username, password } = body

  // 验证账号密码 (对应 .env 中的 ADMIN_USERNAME 和 ADMIN_PASSWORD)
  if (username === config.adminUsername && password === config.adminPassword) {
    // 登录成功，设置一个简单的 Cookie
    // 注意：在实际生产中建议使用 JWT，这里为了快速实现使用基础 Token
    setCookie(event, 'auth_token', 'authenticated-admin-session', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 24小时
    })

    return { message: '登录成功' }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message: '账号或密码错误'
  })
})
