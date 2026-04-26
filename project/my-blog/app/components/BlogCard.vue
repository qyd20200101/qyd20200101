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
    <NuxtLink :to="post.path" class="block rounded-xl border p-4 transition hover:bg-slate-50">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h3 class="text-lg font-semibold text-slate-900">
                    {{ post.title }}
                </h3>
                <p class="mt-2 text-sm text-slate-600">
                    {{ post.description }}
                </p>
            </div>

            <div class="shrink-0 text-xs text-slate-400">
                {{ post.date }}
            </div>
        </div>

        <div v-if="post.tags?.length" class="mt-3 flex flex-wrap gap-2">
            <span v-for="tag in post.tags" :key="tag"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {{ tag }}
            </span>
        </div>
    </NuxtLink>
</template>
