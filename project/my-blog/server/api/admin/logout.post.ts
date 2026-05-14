export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'admin_token', { path: '/' })

  return { success: true }
})
