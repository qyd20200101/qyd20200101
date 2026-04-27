<script setup lang="ts">
const route = useRoute()

type TocLink = {
    id: string
    text: string
    depth: number
    children?: TocLink[]
}

type BlogPost = {
    path: string
    title?: string
    description?: string
    date?: string
    tags?: string[]
    body?: {
        toc?: {
            links?: TocLink[]
        }
    }
}

const { data: post, error } = await useAsyncData<any>(
    `post-${route.path}`,
    () => $fetch(`/api/posts${route.path}`)
)

// 获取相邻文章用于导航
const { data: neighbors } = await useAsyncData(`neighbors-${route.path}`, async () => {
    const allPostsRaw = await queryCollection('blog')
        .where('path', '<>', '/blog') // 排除索引页
        .order('date', 'DESC')
        .select('path', 'title')
        .all()
    
    const currentIndex = allPostsRaw.findIndex(p => p.path === route.path)
    return {
        prev: currentIndex > 0 ? allPostsRaw[currentIndex - 1] : null,
        next: currentIndex < allPostsRaw.length - 1 ? allPostsRaw[currentIndex + 1] : null
    }
})

const tocLinks = computed<TocLink[]>(() => {
    const links: TocLink[] = []
    const flatten = (items: TocLink[]) => {
        items.forEach(item => {
            links.push(item)
            if (item.children?.length) {
                flatten(item.children)
            }
        })
    }
    if (post.value?.toc?.links) {
        flatten(post.value.toc.links)
    }
    return links
})
</script>

<template>
    <main v-if="post" class="mx-auto max-w-7xl">
        <div class="grid gap-8 lg:grid-cols-[1fr_280px]">
            <!-- 正文 -->
            <div class="space-y-6">
                <header class="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div class="mb-4 flex items-center gap-2 text-sm text-slate-500">
                        <NuxtLink to="/" class="hover:text-slate-900">首页</NuxtLink>
                        <span>/</span>
                        <span>文章详情</span>
                    </div>

                    <h1 class="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        {{ post.title || (post.date ? `${post.date} 学习日报` : '未命名文章') }}
                    </h1>

                    <p v-if="post.description" class="mt-4 text-base leading-7 text-slate-600">
                        {{ post.description }}
                    </p>

                    <div class="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span v-if="post.date || post.createdAt" class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
                            <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            {{ post.date || post.createdAt?.slice(0, 10) }}
                        </span>
                        <span class="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                            <span class="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                            {{ post.views || 0 }} 次阅读
                        </span>
                    </div>

                    <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
                        <span v-for="tag in post.tags" :key="tag"
                            class="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs text-slate-600">
                            # {{ tag }}
                        </span>
                    </div>
                </header>

                <article class="rounded-3xl border bg-white p-6 shadow-sm md:p-10">
                    <div
                        class="article-content prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-img:rounded-2xl prose-img:shadow-sm">
                        <ContentRenderer :value="post" />
                    </div>

                    <!-- 相邻文章导航 -->
                    <div v-if="neighbors" class="mt-12 grid gap-4 border-t border-slate-100 pt-10 sm:grid-cols-2">
                        <NuxtLink v-if="neighbors.prev" :to="neighbors.prev.path"
                            class="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/30">
                            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">上一篇</p>
                            <p class="mt-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {{ neighbors.prev.title }}
                            </p>
                        </NuxtLink>
                        <div v-else></div>

                        <NuxtLink v-if="neighbors.next" :to="neighbors.next.path"
                            class="group rounded-2xl border border-slate-200 p-5 text-right transition hover:border-blue-300 hover:bg-blue-50/30">
                            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">下一篇</p>
                            <p class="mt-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {{ neighbors.next.title }}
                            </p>
                        </NuxtLink>
                    </div>
                </article>

                <div class="pb-10">
                    <NuxtLink to="/"
                        class="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 shadow-sm">
                        ← 返回首页
                    </NuxtLink>
                </div>
            </div>

            <!-- 目录 -->
            <aside class="hidden lg:block">
                <div class="sticky top-6 rounded-3xl border bg-white p-5 shadow-sm">
                    <h2 class="text-base font-semibold text-slate-900">文章目录</h2>

                    <nav class="mt-4 space-y-2 text-sm">
                        <template v-if="tocLinks.length">
                            <a v-for="item in tocLinks" :key="item.id" :href="`#${item.id}`"
                                class="block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                :class="{
                                    'pl-3': item.depth === 2,
                                    'pl-6': item.depth === 3,
                                    'pl-9': item.depth >= 4
                                }">
                                {{ item.text }}
                            </a>
                        </template>

                        <div v-else class="text-sm text-slate-500">
                            当前文章还没有目录。
                        </div>
                    </nav>
                </div>
            </aside>
        </div>
    </main>

    <main v-else class="mx-auto max-w-4xl rounded-3xl border bg-white p-10 text-center shadow-sm">
        <h1 class="text-2xl font-bold text-slate-900">文章不存在</h1>
        <p class="mt-3 text-slate-500">找不到路径：{{ route.path }}</p>
        <NuxtLink to="/" class="mt-6 inline-block text-slate-900 underline">
            返回首页
        </NuxtLink>
    </main>
</template>

<style>
/* 深度自定义 Markdown 内容样式，增强层级感 */
.article-content.prose {
    --tw-prose-headings: #0f172a;
    --tw-prose-links: #2563eb;
    --tw-prose-bold: #1e293b;
    font-size: 1.05rem;
    font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

/* 标题样式增强：左侧边框引导 */
.article-content.prose h2 {
    position: relative;
    padding-left: 1rem;
    margin-top: 2.5em;
    margin-bottom: 1em;
    font-weight: 800;
}

.article-content.prose h2::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.2em;
    bottom: 0.2em;
    width: 4px;
    background: #0f172a;
    border-radius: 4px;
}

.article-content.prose h3 {
    margin-top: 2em;
    font-weight: 700;
    color: #334155;
}

/* 列表样式优化 */
.article-content.prose ul > li {
    position: relative;
    padding-left: 0.1em;
}

.article-content.prose ul ul, 
.article-content.prose ul ol, 
.article-content.prose ol ul, 
.article-content.prose ol ol {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    padding-left: 1.5em; /* 增加嵌套列表的缩进 */
}

.article-content.prose ul > li::marker {
    color: #94a3b8;
}

/* 强调文字加粗并稍微变色，突出重点 */
.article-content.prose strong {
    color: #0f172a;
    font-weight: 700;
}

/* 段落间距微调 */
.article-content.prose p {
    margin-top: 1.25em;
    margin-bottom: 1.25em;
    line-height: 1.8;
    color: #475569;
}

/* 代码块和行内代码 */
.article-content.prose code {
    background-color: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-weight: 500;
    color: #e11d48;
}

.article-content.prose code::before,
.article-content.prose code::after {
    content: "";
}

.article-content.prose pre {
    background-color: #1e293b !important;
    border-radius: 12px;
    border: 1px solid #334155;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
}
</style>
