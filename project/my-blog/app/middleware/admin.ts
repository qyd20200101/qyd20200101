export default defineNuxtRouteMiddleware(async () => {
  try {
    const headers = process.server ? useRequestHeaders(['cookie']) : undefined

    await $fetch('/api/admin/me', {
      headers
    })
  } catch {
    return navigateTo('/login')
  }
})
