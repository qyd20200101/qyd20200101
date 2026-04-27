import { defineEventHandler, getRequestIP, createError } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const path = event.path
  
  // 仅针对后台页面和管理接口进行 IP 过滤
  const isProtectedPath = path.startsWith('/admin') || 
                          path.startsWith('/api/admin') || 
                          path.startsWith('/api/auth')

  if (!isProtectedPath) return

  // 获取配置的白名单 IP (从 .env 读取)
  const allowedIpsStr = config.allowedIps
  if (!allowedIpsStr) return // 如果没配置，则不启用 IP 过滤

  const allowedIps = allowedIpsStr.split(',').map(ip => ip.trim())
  
  // 获取真实访客 IP (开启 x-forwarded-for 支持)
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || ''

  // 开发环境常用本地 IP
  const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1']
  
  // 检查是否在白名单中
  const isAllowed = allowedIps.includes(clientIp) || localIps.includes(clientIp)

  if (!isAllowed) {
    console.warn(`[Security] 拦截非法后台访问: IP=${clientIp}, Path=${path}`)
    
    // 如果是 API 请求，返回 403
    if (path.startsWith('/api/')) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            message: '您的 IP 不在允许访问名单中'
        })
    }
    
    // 如果是页面请求，重定向到首页
    return sendRedirect(event, '/')
  }
})
