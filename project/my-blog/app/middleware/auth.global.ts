export default defineNuxtRouteMiddleware((to) => {
  const authToken = useCookie('auth_token')

  // 如果访问的是 /admin 开头的页面，且没有 auth_token
  if (to.path.startsWith('/admin') && !authToken.value) {
    // 强制跳转到登录页
    return navigateTo('/login')
  }
})
