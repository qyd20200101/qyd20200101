<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: 'admin'
})

type AdminPost = {
    id: string
    title: string
    slug: string
    status: string
}

const { data: posts } = await useAsyncData<AdminPost[]>('admin-home-posts', () =>
    $fetch('/api/admin/posts', {
        headers: process.server ? useRequestHeaders(['cookie']) : undefined
    })
)
</script>

<template>
    <div class="space-y-6">
        <section class="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 class="text-3xl font-bold">后台仪表盘</h1>
            <p class="mt-2 text-slate-600">
                欢迎回来，这里可以管理文章内容。
            </p>
        </section>

        <section class="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 class="text-xl font-bold">文章统计</h2>
            <p class="mt-3 text-slate-600">
                当前文章数：<span class="font-semibold text-slate-900">{{ posts?.length || 0 }}</span>
            </p>
        </section>
    </div>
</template>
