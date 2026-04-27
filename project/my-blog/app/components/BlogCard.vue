<script setup lang="ts">
defineProps<{
    post: {
        title?: string
        description?: string
        date?: string
        path: string
        tags?: string[]
    }
}>()
</script>

<template>
    <NuxtLink :to="post.path"
        class="group block rounded-[2rem] border border-slate-200 bg-white p-7 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
        <div class="flex flex-col space-y-4">
            <!-- 1) 标题 -->
            <h3
                class="text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                {{ post.title }}
            </h3>

            <!-- 2) 摘要 -->
            <p v-if="post.description" class="line-clamp-2 text-[13px] leading-relaxed text-slate-500 font-medium">
                {{ post.description }}
            </p>

            <!-- 3) 元信息 -->
            <div class="flex items-center justify-between pt-2">
                <div class="flex flex-wrap gap-2">
                    <span v-for="tag in post.tags" :key="tag"
                        class="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-100">
                        {{ tag }}
                    </span>
                </div>
                <time class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                    {{ post.date }}
                </time>
            </div>
        </div>
    </NuxtLink>
</template>
