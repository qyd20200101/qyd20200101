<script setup lang="ts">
const logout = async () => {
    await $fetch('/api/admin/logout', { method: 'POST' })
    await navigateTo('/login')
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <header class="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                <NuxtLink to="/admin" class="flex items-center gap-2 text-lg font-bold tracking-tight">
                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-xs">B</span>
                    Blog Admin
                </NuxtLink>
                <button class="text-xs font-medium text-slate-500 hover:text-slate-900 transition" @click="logout">
                    退出登录
                </button>
            </div>
        </header>

        <div class="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
            <aside class="sticky top-8 h-fit space-y-1 rounded-2xl border bg-white p-2 shadow-sm">
                <nav class="space-y-1 text-sm font-medium">
                    <NuxtLink to="/admin" class="block rounded-lg px-3 py-2 transition hover:bg-slate-50 hover:text-blue-600"
                        active-class="bg-blue-50 text-blue-600">
                        仪表盘
                    </NuxtLink>
                    <NuxtLink to="/admin/posts" class="block rounded-lg px-3 py-2 transition hover:bg-slate-50 hover:text-blue-600"
                        active-class="bg-blue-50 text-blue-600">
                        文章管理
                    </NuxtLink>
                    <NuxtLink to="/admin/posts/new" class="block rounded-lg px-3 py-2 transition hover:bg-slate-50 hover:text-blue-600"
                        active-class="bg-blue-50 text-blue-600">
                        发布文章
                    </NuxtLink>
                </nav>
            </aside>

            <main class="min-w-0">
                <slot />
            </main>
        </div>
    </div>
</template>
