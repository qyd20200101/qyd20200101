<script setup lang="ts">
import BlogCard from '~/components/BlogCard.vue'

type BlogPost = {
    path: string
    title?: string
    description?: string
    date?: string
    tags?: string[]
}

const { data: posts } = await useAsyncData<BlogPost[]>('home-posts', async () => {
    const all = await queryCollection('blog')
        .order('date', 'DESC')
        .select('path', 'title', 'description', 'date', 'tags')
        .all()

    return all.filter(post => post.path !== '/blog')
})

const recentTags = ['JavaScript', 'Vue / Nuxt', '性能优化', '前端工程化']
</script>

<template>
    <div class="space-y-8">
        <!-- Hero 区 -->
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="grid gap-6 p-6 md:grid-cols-[1.6fr_1fr] md:p-8">
                <div class="space-y-5">
                    <div
                        class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Personal Tech Blog
                    </div>

                    <div class="space-y-3">
                        <h1 class="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            你好，我是 XXX
                        </h1>
                        <p class="max-w-2xl leading-7 text-slate-600">
                            这里记录我的前端学习、JavaScript 八股、Nuxt 实战、性能优化和项目复盘。
                            这是一个偏技术沉淀的个人博客站。
                        </p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <span v-for="tag in recentTags" :key="tag"
                            class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                            {{ tag }}
                        </span>
                    </div>

                    <div class="flex flex-wrap gap-3 pt-2">
                        <NuxtLink to="/lab"
                            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                            进入 50k 实验室
                        </NuxtLink>

                        <a href="#latest-posts"
                            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            查看最新文章
                        </a>
                    </div>
                </div>

                <!-- 右侧信息卡 -->
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h2 class="text-base font-semibold text-slate-900">博客定位</h2>
                    <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                        <li>• 记录学习过程</li>
                        <li>• 整理面试八股</li>
                        <li>• 沉淀项目经验</li>
                        <li>• 分享技术思考</li>
                    </ul>

                    <div class="mt-6 border-t border-slate-200 pt-4">
                        <p class="text-sm font-medium text-slate-700">当前关注方向</p>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <span class="rounded-full bg-white px-3 py-1 text-xs text-slate-600">JavaScript</span>
                            <span class="rounded-full bg-white px-3 py-1 text-xs text-slate-600">Vue / Nuxt</span>
                            <span class="rounded-full bg-white px-3 py-1 text-xs text-slate-600">性能优化</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 内容区 -->
        <section class="grid gap-8 lg:grid-cols-[1.7fr_0.9fr]">
            <!-- 最新文章 -->
            <div class="space-y-4" id="latest-posts">
                <div class="flex items-end justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900">最新文章</h2>
                        <p class="mt-1 text-sm text-slate-500">按时间排序，展示最近的技术总结与项目复盘</p>
                    </div>

                    <NuxtLink to="/lab"
                        class="text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:hidden">
                        进入 50k 实验室 →
                    </NuxtLink>
                </div>

                <div v-if="posts && posts.length" class="grid gap-4">
                    <BlogCard v-for="post in posts.slice(0, 6)" :key="post.path" :post="post" />
                </div>

                <div v-else class="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">
                    暂时还没有文章。
                </div>
            </div>

            <!-- 侧栏 -->
            <aside class="space-y-4">
                <div class="rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-slate-900">关于本站</h3>
                    <p class="mt-3 text-sm leading-6 text-slate-600">
                        这是我的个人技术博客，用来记录前端学习路径、项目实践与技术思考。
                    </p>
                </div>

                <div class="rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-slate-900">技术标签</h3>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <span v-for="tag in recentTags" :key="tag"
                            class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <div class="rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-slate-900">快捷入口</h3>
                    <div class="mt-4 space-y-3">
                        <NuxtLink to="/lab"
                            class="block rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                            50k 数据实验室
                        </NuxtLink>

                        <NuxtLink to="/blog/day21-study"
                            class="block rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                            最新文章示例
                        </NuxtLink>
                    </div>
                </div>
            </aside>
        </section>
    </div>
</template>
