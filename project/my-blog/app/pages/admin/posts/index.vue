<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: 'admin'
})

type AdminPost = {
    id: string
    title: string
    slug: string
    type: string
    category: string
    theme: string
    status: string
    createdAt: string
}

const { data: posts, refresh, error } = await useAsyncData<AdminPost[]>('admin-posts', () =>
    $fetch('/api/admin/posts', {
        headers: process.server ? useRequestHeaders(['cookie']) : undefined
    })
)

const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
        await $fetch(`/api/admin/posts/${id}`, {
            method: 'DELETE'
        })
        await refresh()
    } catch (error: any) {
        alert(error?.data?.statusMessage || '删除失败')
    }
}

const handleImportMd = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
        const content = event.target?.result as string
        
        // 简单的 frontmatter 解析
        let title = file.name.replace('.md', '')
        let body = content
        let category = ''
        let tags = ''
        
        if (content.startsWith('---')) {
            const endIdx = content.indexOf('---', 3)
            if (endIdx !== -1) {
                const fm = content.slice(3, endIdx)
                body = content.slice(endIdx + 3).trim()
                
                fm.split('\n').forEach(line => {
                    const colonIndex = line.indexOf(':')
                    if (colonIndex === -1) return
                    
                    const key = line.slice(0, colonIndex).trim()
                    const val = line.slice(colonIndex + 1).trim()
                    
                    if (key === 'title') title = val
                    if (key === 'category') category = val
                    if (key === 'tags') tags = val
                })
            }
        }

        try {
            await $fetch('/api/admin/posts', {
                method: 'POST',
                body: {
                    title,
                    category,
                    tags,
                    content: body,
                    status: 'draft'
                }
            })
            alert('导入成功！已保存为草稿。')
            await refresh()
        } catch (error: any) {
            alert(error?.data?.statusMessage || '导入失败')
        }
    }
    reader.readAsText(file)
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold">文章列表</h1>
                <p class="mt-2 text-sm text-slate-500">管理你所有的博客文章</p>
            </div>

            <div class="flex gap-3">
                <button class="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50" @click="() => refresh()">
                    刷新
                </button>
                <label
                    class="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    导入 MD
                    <input type="file" accept=".md" class="hidden" @change="handleImportMd" />
                </label>
                <NuxtLink to="/admin/posts/new"
                    class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
                    新增文章
                </NuxtLink>
            </div>
        </div>

        <div v-if="error" class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            数据库连接失败，请检查数据库配置。
        </div>

        <div class="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-500">
                    <tr>
                        <th class="px-4 py-2.5">标题</th>
                        <th class="px-4 py-2.5 text-center">分类</th>
                        <th class="px-4 py-2.5 text-center">类型</th>
                        <th class="px-4 py-2.5 text-center">主题</th>
                        <th class="px-4 py-2.5 text-center">状态</th>
                        <th class="px-4 py-2.5 text-center">日期</th>
                        <th class="px-4 py-2.5 text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="post in posts || []" :key="post.id" class="border-t hover:bg-slate-50/50 transition-colors">
                        <td class="px-4 py-2.5">
                            <div class="font-medium text-slate-900 line-clamp-1">{{ post.title }}</div>
                            <div class="text-[10px] text-slate-400 font-mono">{{ post.slug }}</div>
                        </td>
                        <td class="px-4 py-2.5 text-center text-slate-600">{{ post.category || '-' }}</td>
                        <td class="px-4 py-2.5 text-center text-slate-600">
                            <span class="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-600" v-if="post.type">
                                {{ post.type }}
                            </span>
                            <span v-else>-</span>
                        </td>
                        <td class="px-4 py-2.5 text-center text-slate-600">{{ post.theme || '-' }}</td>
                        <td class="px-4 py-2.5 text-center">
                            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" :class="post.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                                ">
                                {{ post.status }}
                            </span>
                        </td>
                        <td class="px-4 py-2.5 text-center text-slate-400 text-xs">{{ post.createdAt?.slice(0, 10) }}</td>
                        <td class="px-4 py-2.5 text-right">
                            <div class="flex justify-end gap-2">
                                <NuxtLink :to="`/admin/posts/${post.id}`"
                                    class="text-blue-600 hover:text-blue-800">编辑</NuxtLink>
                                <button @click="handleDelete(post.id)" class="text-red-600 hover:text-red-800">
                                    删除
                                </button>
                            </div>
                        </td>
                    </tr>

                    <tr v-if="!posts?.length">
                        <td colspan="7" class="px-4 py-10 text-center text-slate-500">
                            暂无文章，请先新增一篇。
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
