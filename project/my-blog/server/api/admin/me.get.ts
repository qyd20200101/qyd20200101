export default defineEventHandler((event) => {
  const user = requireAdmin(event)
  return {
    success: true,
    user
  }
})
