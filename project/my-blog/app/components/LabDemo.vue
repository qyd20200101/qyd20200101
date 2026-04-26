<script setup lang="ts">
const keyword = ref('')
const page = ref(1)
const pageSize = 20

const makeData = () => {
    return Array.from({ length: 50000 }, (_, i) => ({
        id: i + 1,
        title: `Name ${i + 1}`,
        desc: `Description for item ${i + 1}`
    }))
}

const data = ref(makeData())

const filtered = computed(() => {
    const k = keyword.value.trim()
    if (!k) return data.value

    return data.value.filter(item =>
        item.title.includes(k) || item.desc.includes(k)
    )
})

const total = computed(() => filtered.value.length)

const paged = computed(() => {
    const start = (page.value - 1) * pageSize
    return filtered.value.slice(start, start + pageSize)
})

watch(keyword, () => {
    page.value = 1
})

const refreshData = () => {
    data.value = makeData()
    page.value = 1
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input v-model="keyword" type="text" placeholder="搜索数据项..."
                class="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-400 md:max-w-sm" />

            <button class="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" @click="refreshData">
                重新生成数据
            </button>
        </div>

        <div class="text-sm text-slate-500">
            共 <span class="font-semibold text-slate-900">{{ total }}</span> 条数据，
            当前第 <span class="font-semibold text-slate-900">{{ page }}</span> 页
        </div>

        <div class="overflow-hidden rounded-xl border">
            <div v-for="item in paged" :key="item.id" class="border-b px-4 py-3 last:border-b-0 hover:bg-slate-50">
                <div class="font-medium">{{ item.title }}</div>
                <div class="text-sm text-slate-500">{{ item.desc }}</div>
            </div>
        </div>

        <div class="flex items-center justify-between">
            <button class="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="page === 1" @click="page--">
                上一页
            </button>

            <button class="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="page * pageSize >= total" @click="page++">
                下一页
            </button>
        </div>
    </div>
</template>
