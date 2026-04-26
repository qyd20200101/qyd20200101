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

const { data: post } = await useAsyncData<BlogPost | null>(
    `post-${route.path}`,
    async () => {
        return await queryCollection('blog').path(route.path).first()
    }
)

const tocLinks = computed<TocLink[]>(() => {
    return post.value?.body?.toc?.links || []
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
                        {{ post.title }}
                    </h1>

                    <p v-if="post.description" class="mt-4 text-base leading-7 text-slate-600">
                        {{ post.description }}
                    </p>

                    <div class="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span v-if="post.date" class="rounded-full bg-slate-100 px-3 py-1">
                            {{ post.date }}
                        </span>
                    </div>

                    <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
                        <span v-for="tag in post.tags" :key="tag"
                            class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                            {{ tag }}
                        </span>
                    </div>
                </header>

                <article class="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div
                        class="article-content prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-img:rounded-2xl prose-img:shadow-sm">
                        <ContentRenderer :value="post" />
                    </div>
                </article>

                <div class="pb-10">
                    <NuxtLink to="/"
                        class="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
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
