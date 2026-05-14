<script setup lang="ts">
definePageMeta({
    layout: 'admin',
    middleware: 'admin'
})

const route = useRoute()
const id = route.params.id as string

const form = reactive({
    title: '',
    slug: '',
    type: '',
    category: '',
    theme: '',
    tags: '',
    description: '',
    content: '',
    status: 'draft' as 'draft' | 'published'
})

const loading = ref(false)
const fetching = ref(true)
const errorMsg = ref('')

import { BLOG_CONFIG } from '~~/server/utils/config'
const typeOptions = [...BLOG_CONFIG.typeOptions, '其他']
const selectedType = ref('')

watch(selectedType, (newVal) => {
    if (newVal !== '其他') {
        form.type = newVal
    }
})

// 获取文章详情
onMounted(async () => {
    try {
        const data = await $fetch<any>(`/api/admin/posts/${id}`)
        Object.assign(form, data)
        if (typeOptions.includes(form.type)) {
            selectedType.value = form.type
        } else if (form.type) {
            selectedType.value = '其他'
        }
    } catch (error: any) {
        errorMsg.value = error?.data?.statusMessage || '获取文章失败'
    } finally {
        fetching.value = false
    }
})

const submit = async () => {
    loading.value = true
    errorMsg.value = ''

    try {
        await $fetch(`/api/admin/posts/${id}`, {
            method: 'PATCH',
            body: form
        })

        await navigateTo('/admin/posts')
    } catch (error: any) {
        errorMsg.value = error?.data?.statusMessage || '保存失败'
    } finally {
        loading.value = false
    }
}

const fileInput = ref<HTMLInputElement | null>(null)
const triggerUpload = () => fileInput.value?.click()

const handleFileUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        const text = e.target?.result as string
        if (!text) return

        const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
        if (match) {
            const yamlText = match[1]
            const body = match[2]

            const lines = yamlText.split('\n')
            const fields: Record<string, any> = {}
            let currentKey = ''

            lines.forEach(line => {
                const trimmed = line.trim()
                if (!trimmed) return

                if (trimmed.startsWith('-')) {
                    if (currentKey && Array.isArray(fields[currentKey])) {
                        fields[currentKey].push(trimmed.replace(/^- /, '').replace(/^["']|["']$/g, ''))
                    }
                } else if (trimmed.includes(':')) {
                    const [key, ...rest] = trimmed.split(':')
                    const value = rest.join(':').trim().replace(/^["']|["']$/g, '')
                    currentKey = key.trim()
                    if (value === '') {
                        fields[currentKey] = []
                    } else {
                        fields[currentKey] = value
                    }
                }
            })

            if (fields.title) form.title = fields.title
            if (fields.description) form.description = fields.description
            if (fields.category) form.category = fields.category
            if (fields.theme) form.theme = fields.theme

            if (Array.isArray(fields.tags)) {
                form.tags = fields.tags.join(', ')
            } else if (fields.tags) {
                form.tags = fields.tags.toString().replace(/\[|\]/g, '')
            }

            if (fields.type) {
                if (typeOptions.includes(fields.type)) {
                    selectedType.value = fields.type
                } else {
                    selectedType.value = '其他'
                    form.type = fields.type
                }
            }

            form.content = body.trim()
        } else {
            form.content = text.trim()
        }
        
        if (fileInput.value) fileInput.value.value = ''
    }
    reader.readAsText(file)
}
</script>

<template>
    <div class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <!-- 顶部标题与操作栏 -->
        <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:px-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">编辑文章</h1>
                <p class="mt-1 text-sm text-slate-500 font-medium">修改文章信息和内容</p>
            </div>
            
            <div class="flex items-center gap-3">
                <input ref="fileInput" type="file" accept=".md" class="hidden" @change="handleFileUpload" />
                <button type="button" @click="triggerUpload"
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                    <svg class="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    导入 MD
                </button>
                <NuxtLink to="/admin/posts" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                    返回列表
                </NuxtLink>
            </div>
        </div>

        <div v-if="fetching" class="flex h-64 items-center justify-center">
            <div class="flex flex-col items-center gap-3">
                <svg class="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p class="text-sm font-medium text-slate-500">正在获取文章内容...</p>
            </div>
        </div>

        <form v-else class="p-6 md:p-8 space-y-8" @submit.prevent="submit">
            <!-- 第一组：基础信息 -->
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-slate-900 border-l-4 border-indigo-500 pl-3">
                    <h2 class="text-sm font-bold uppercase tracking-wider">基础信息</h2>
                </div>
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">文章标题</label>
                        <input v-model="form.title" type="text" placeholder="输入文章标题"
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">Slug (URL 路径)</label>
                        <input v-model="form.slug" type="text" placeholder="不填则根据标题自动生成"
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                    </div>
                </div>
            </div>

            <!-- 第二组：分类信息 -->
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-slate-900 border-l-4 border-emerald-500 pl-3">
                    <h2 class="text-sm font-bold uppercase tracking-wider">分类信息</h2>
                </div>
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">分类</label>
                        <input v-model="form.category" type="text" placeholder="JavaScript/Vue..."
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">类型</label>
                        <div class="space-y-2">
                            <select v-model="selectedType"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50">
                                <option value="" disabled>选择类型</option>
                                <option v-for="opt in typeOptions" :key="opt" :value="opt">{{ opt }}</option>
                            </select>
                            <input v-if="selectedType === '其他'" v-model="form.type" type="text" placeholder="手动输入类型"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
                        </div>
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">主题</label>
                        <input v-model="form.theme" type="text" placeholder="性能优化/组件化..."
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">发布状态</label>
                        <select v-model="form.status"
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50">
                            <option value="draft">草稿 (Draft)</option>
                            <option value="published">已发布 (Published)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 第三组：内容信息 -->
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-slate-900 border-l-4 border-blue-500 pl-3">
                    <h2 class="text-sm font-bold uppercase tracking-wider">内容信息</h2>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">标签 (逗号分隔)</label>
                        <input v-model="form.tags" type="text" placeholder="Vue, Nuxt, 性能优化"
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">文章摘要</label>
                        <textarea v-model="form.description" rows="2" placeholder="简短介绍文章内容..."
                            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                    </div>
                    <div>
                        <label class="mb-1.5 block text-[13px] font-bold text-slate-700">正文内容 (Markdown)</label>
                        <textarea v-model="form.content" rows="15" placeholder="# 文章正文..."
                            class="w-full rounded-xl border border-slate-200 px-4 py-4 text-sm font-mono outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between border-t border-slate-100 pt-8">
                <p v-if="errorMsg" class="text-sm font-bold text-red-500 flex items-center gap-2">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                    {{ errorMsg }}
                </p>
                <div v-else></div>
                
                <button type="submit" :disabled="loading"
                    class="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-10 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-slate-200 active:scale-95 disabled:opacity-50">
                    <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {{ loading ? '正在保存...' : '更新文章内容' }}
                </button>
            </div>
        </form>
    </div>
</template>
