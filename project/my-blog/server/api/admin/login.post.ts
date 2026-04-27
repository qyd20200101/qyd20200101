import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    username: string
    password: string
  }>(event)

  const config = useRuntimeConfig(event)

  if (
    !config.adminUsername ||
    !config.adminPassword ||
    !config.jwtSecret
  ) {
    throw createError({
      statusCode: 500,
      statusMessage: '后台环境变量未配置'
    })
  }

  if (
    body.username !== config.adminUsername ||
    body.password !== config.adminPassword
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  const token = jwt.sign(
    { username: body.username },
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

  return {
    success: true
  }
})
