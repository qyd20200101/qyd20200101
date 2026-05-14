<script setup lang="ts">
import BlogCard from '~/components/BlogCard.vue'
import { BLOG_CONFIG } from '~~/server/utils/config'

type BlogPost = {
    path: string
    title?: string
    description?: string
    date?: string
    tags?: string[]
}

const { data: posts } = await useAsyncData<BlogPost[]>('home-posts', async () => {
    // 1. 获取本地 Markdown 文章
    const localPostsRaw = await queryCollection('blog')
        .order('date', 'DESC')
        .select('path', 'title', 'description', 'date', 'tags', 'stem')
        .all()

    const localPosts = localPostsRaw.map((p: any) => {
        let date = p.date
        if (!date && p.stem) {
            // 从文件名 04_26学习日报 提取日期
            const match = p.stem.match(/(\d{2})_(\d{2})/)
            if (match) date = `2026-${match[1]}-${match[2]}`
        }
        
        // 确保有标题，如果没有则用文件名
        const title = p.title || p.stem?.replace(/_/g, '/') || '未命名文章'
        
        // 确保有描述，如果没有则提供默认简介
        const description = p.description || (p.stem?.includes('学习日报') ? BLOG_CONFIG.defaultDescriptions.studyNote : BLOG_CONFIG.defaultDescriptions.fallback)
        
        return { 
            ...p, 
            title,
            description,
            date,
            path: p.path.startsWith('/') ? p.path : `/${p.path}` 
        }
    })

    // 2. 获取数据库文章
    let dbPosts: any[] = []
    try {
        const dbPostsRaw = await $fetch<any[]>('/api/posts')
        dbPosts = dbPostsRaw.map(p => ({
            path: `/${p.slug}`,
            title: p.title,
            description: p.description || (p.title?.includes('学习日报') ? BLOG_CONFIG.defaultDescriptions.dbNote : BLOG_CONFIG.defaultDescriptions.fallback),
            date: p.createdAt?.slice(0, 10),
            tags: p.tags,
            type: p.type,
            category: p.category,
            theme: p.theme
        }))
    } catch (e) {
        console.warn('SQLite 连接失败，仅显示本地文章')
    }

    // 3. 获取所有文章的浏览量统计
    let viewStats: Record<string, number> = {}
    try {
        const statsArray = await $fetch<any[]>('/api/stats')
        viewStats = Object.fromEntries(statsArray.map(s => [s.slug, s.views]))
    } catch (e) {
        console.warn('获取浏览量统计失败')
    }

    // 合并并按日期排序
    const combined = [...dbPosts, ...localPosts.filter(p => p.path !== '/blog')].map(p => {
        const slug = p.path.replace(/^\//, '')
        return {
            ...p,
            views: p.views || viewStats[slug] || 0
        }
    })
    return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

// 从实际文章数据动态聚合标签和类型，不再硬编码
const recentTags = computed(() => topTags(posts.value ?? [], 10))
const focusOptions = computed(() => {
  const types = new Set<string>()
  posts.value?.forEach((p: any) => {
    if (p.type) types.add(p.type)
    if (p.category) types.add(p.category)
  })
  return [...types].slice(0, 6)
})

const tagCounts = computed(() => {
    const counts: Record<string, number> = {}
    recentTags.value.forEach(t => counts[t] = 0)
    posts.value?.forEach(p => {
        p.tags?.forEach(t => {
            if (t in counts) counts[t]++
        })
    })
    return counts
})

const focusCounts = computed(() => {
    const counts: Record<string, number> = {}
    const opts = focusOptions.value
    opts.forEach(f => counts[f] = 0)
    posts.value?.forEach(post => {
        const p = post as any
        const match = opts.find(f => f === p.type || f === p.category || f === p.theme)
        if (match) counts[match]++
    })
    return counts
})

const selectedTag = ref<string | null>(null)
const selectedFocus = ref<string | null>(null)

const toggleTag = (tag: string) => {
    selectedTag.value = selectedTag.value === tag ? null : tag
}

const toggleFocus = (focus: string) => {
    selectedFocus.value = selectedFocus.value === focus ? null : focus
}

const scrollToPosts = () => {
    const el = document.getElementById('latest-posts')
    if (el) {
        const offset = 80 // 留出一点顶部间距
        const top = el.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top, behavior: 'smooth' })
    }
}

watch([selectedTag, selectedFocus], () => {
    scrollToPosts()
})

const filteredPosts = computed(() => {
    if (!posts.value) return []
    let result = posts.value

    if (selectedTag.value) {
        result = result.filter(post => post.tags?.includes(selectedTag.value!))
    }

    if (selectedFocus.value) {
        result = result.filter(post => {
            const p = post as any
            return p.type === selectedFocus.value || 
                   p.category === selectedFocus.value || 
                   p.theme === selectedFocus.value
        })
    }
    
    return result
})
</script>

<template>
    <div class="space-y-8">
        <!-- Hero 区 -->
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="p-6 md:p-8">
                <div class="space-y-6">
                    <div
                        class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                        Personal Tech Blog
                    </div>

                    <div class="space-y-4">
                        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                            你好，我是 <span class="text-indigo-600">刀刀</span>
                        </h1>
                        <div class="space-y-3">
                            <p class="max-w-2xl text-lg leading-7 text-slate-600 font-medium">
                                这里记录我的前端学习、JavaScript 总结、项目复盘与技术思考。
                            </p>
                            <p class="max-w-2xl text-sm leading-6 text-slate-500">
                                专注前端知识沉淀，把学习过程整理成可以反复回看的笔记。
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2.5">
                        <button v-for="tag in recentTags" :key="tag"
                            @click="toggleTag(tag)"
                            :disabled="tagCounts[tag] === 0"
                            :class="[
                                'rounded-full px-4 py-1.5 text-xs font-semibold border transition-all',
                                selectedTag === tag 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                                    : tagCounts[tag] === 0
                                        ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed opacity-60'
                                        : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                            ]">
                            # {{ tag }}
                            <span v-if="(tagCounts[tag] ?? 0) > 0" class="ml-1 opacity-60">({{ tagCounts[tag] }})</span>
                        </button>
                    </div>

                    <div class="flex flex-wrap gap-4 pt-2">
                        <a href="#latest-posts"
                            class="inline-flex items-center rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-indigo-100 shadow-xl transition-all hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95">
                            开始浏览文章
                        </a>
                    </div>
                </div>

            </div>
        </section>

        <!-- 内容区 -->
        <section class="flex flex-col gap-10 lg:flex-row">
            <!-- 最新文章 (自适应宽度) -->
            <div class="flex-1 space-y-8" id="latest-posts">
                <div class="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div class="flex items-center gap-4">
                        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
                            {{ (selectedTag || selectedFocus) ? '筛选结果' : '最新发布' }}
                        </h2>
                        <div v-if="selectedTag || selectedFocus" class="flex gap-2">
                            <span v-if="selectedTag" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">标签: {{ selectedTag }}</span>
                            <span v-if="selectedFocus" class="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-600">方向: {{ selectedFocus }}</span>
                            <button @click="selectedTag = null; selectedFocus = null" class="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-4">
                                清除
                            </button>
                        </div>
                    </div>
                    <div class="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{{ filteredPosts?.length || 0 }} 篇文章</div>
                </div>

                <div v-if="filteredPosts && filteredPosts.length" class="grid gap-6">
                    <BlogCard v-for="post in filteredPosts.slice(0, 10)" :key="post.path" :post="post" />
                </div>

                <div v-else class="rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center text-slate-400">
                    <p>暂时没有符合 "{{ selectedTag || selectedFocus }}" 的文章。</p>
                    <button @click="selectedTag = null; selectedFocus = null" class="mt-4 text-sm text-blue-600 font-semibold hover:underline">查看所有文章</button>
                </div>
            </div>

            <!-- 侧栏 (固定 320px) -->
            <aside class="w-full shrink-0 space-y-6 lg:sticky lg:top-8 lg:w-[320px] h-fit">
                <!-- 1. 个人信息 -->
                <div class="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
                    <div class="h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-90"></div>
                    <div class="px-6 pb-8">
                        <div class="-mt-10 mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-slate-50 text-3xl font-black text-slate-700 shadow-sm transition-transform group-hover:scale-105">
                            刀
                        </div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-xl font-bold text-slate-900">刀刀</h3>
                            <svg class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        </div>
                        <p class="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Frontend Developer</p>
                        <p class="mt-5 text-[13px] leading-relaxed text-slate-500">
                            专注于前端工程化与性能优化。这里是我的技术实验室，记录成长的每一个脚印。
                        </p>
                    </div>
                </div>

                <!-- 2. 热门标签 -->
                <div class="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:shadow-md">
                    <div class="mb-5 flex items-center gap-2.5 text-slate-900">
                        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        </div>
                        <h3 class="text-[15px] font-bold">热门标签</h3>
                    </div>
                    <div class="flex flex-wrap gap-2.5">
                        <button v-for="tag in recentTags" :key="tag"
                            @click="toggleTag(tag)"
                            :disabled="tagCounts[tag] === 0"
                            :class="[
                                'rounded-xl px-3.5 py-2 text-[11px] font-semibold transition-all',
                                selectedTag === tag
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : tagCounts[tag] === 0
                                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'
                                        : 'bg-white text-slate-500 border border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30'
                            ]">
                            {{ tag }}
                            <span v-if="(tagCounts[tag] ?? 0) > 0" class="ml-1 opacity-50">({{ tagCounts[tag] }})</span>
                        </button>
                    </div>
                </div>



                <!-- 3. 博客定位 -->
                <div class="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:shadow-md">
                    <div class="mb-5 flex items-center gap-2.5 text-slate-900">
                        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        </div>
                        <h3 class="text-[15px] font-bold">博客定位</h3>
                    </div>
                    <ul class="space-y-4 text-[13px] font-medium text-slate-500">
                        <li class="flex items-center gap-3">
                            <div class="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                            文章整理
                        </li>
                        <li class="flex items-center gap-3">
                            <div class="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                            学习记录
                        </li>
                        <li class="flex items-center gap-3">
                            <div class="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                            项目总结
                        </li>
                        <li class="flex items-center gap-3">
                            <div class="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                            面试复盘
                        </li>
                    </ul>

                    <div class="mt-8 border-t border-slate-100 pt-6">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Focusing On</p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <button v-for="focus in focusOptions" :key="focus"
                                @click="toggleFocus(focus)"
                                :disabled="focusCounts[focus] === 0"
                                :class="[
                                    'rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-all',
                                    selectedFocus === focus
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : focusCounts[focus] === 0
                                            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed opacity-50'
                                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                                ]">
                                {{ focus }}
                                <span v-if="(focusCounts[focus] ?? 0) > 0" class="ml-1 opacity-50">({{ focusCounts[focus] }})</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </section>
    </div>
</template>
