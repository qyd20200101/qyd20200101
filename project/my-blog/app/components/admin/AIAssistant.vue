<script setup lang="ts">
const isOpen = ref(false)
const messages = ref<{ role: 'user' | 'assistant', content: string | null }[]>([])
const input = ref('')
const selectedSkill = ref('writing')
const isLoading = ref(false)

const skills = [
    { id: 'writing', name: '博客写作', icon: '📝' },
    { id: 'tagging', name: '标签整理', icon: '🏷️' },
    { id: 'summary', name: '文章摘要', icon: '📋' },
    { id: 'code_review', name: '代码审阅', icon: '💻' },
    { id: 'copy_optimization', name: '文案优化', icon: '✨' }
]

const sendMessage = async () => {
    if (!input.value.trim() || isLoading.value) return

    const userMsg = input.value
    messages.value.push({ role: 'user', content: userMsg })
    input.value = ''
    isLoading.value = true

    try {
        const { reply } = await $fetch('/api/ai/chat', {
            method: 'POST',
            body: {
                messages: messages.value,
                skill: selectedSkill.value
            }
        })
        messages.value.push({ role: 'assistant', content: reply || '' })
    } catch (e: any) {
        messages.value.push({ role: 'assistant', content: `错误: ${e.message || '服务异常'}` })
    } finally {
        isLoading.value = false
    }
}

const clearHistory = () => {
    messages.value = []
}

// 提取标题和内容
const parseAIContent = (content: string) => {
    let title = '未命名文章'
    // 尝试从 YAML frontmatter 提取标题
    const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/)
    if (titleMatch) {
        title = titleMatch[1]
    } else {
        // 尝试从第一个 H1 提取
        const h1Match = content.match(/^#\s+(.+)$/m)
        if (h1Match) title = h1Match[1]
    }
    return { title, content }
}

// 导出为 Markdown 文件
const exportMarkdown = (content: string) => {
    const { title } = parseAIContent(content)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    a.click()
    URL.revokeObjectURL(url)
}

// 创建草稿并跳转
const createDraft = async (content: string) => {
    const { title } = parseAIContent(content)
    try {
        isLoading.value = true
        const res = await $fetch('/api/admin/posts/draft', {
            method: 'POST',
            body: { title, content }
        })
        if (res.success) {
            // 跳转到编辑页
            navigateTo(`/admin/posts/${res.id}`)
            isOpen.value = false // 关闭窗口
        }
    } catch (e: any) {
        alert('创建草稿失败: ' + e.message)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-4">
        <!-- 助手窗口 -->
        <div v-if="isOpen" 
             class="flex h-[550px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <!-- 头部 -->
            <div class="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
                <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-xl">🤖</div>
                    <div>
                        <h3 class="text-sm font-bold tracking-tight">AI 博客助手</h3>
                        <div class="flex items-center gap-1">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span class="text-[10px] font-medium text-slate-400">DeepSeek Online</span>
                        </div>
                    </div>
                </div>
                <button @click="isOpen = false" class="rounded-xl p-2 hover:bg-white/10 transition-colors">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>
            </div>

            <!-- 技能选择器 -->
            <div class="flex gap-2 overflow-x-auto border-b bg-slate-50/50 p-3 scrollbar-hide">
                <button v-for="skill in skills" :key="skill.id"
                    @click="selectedSkill = skill.id"
                    :class="[
                        'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all border',
                        selectedSkill === skill.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    ]">
                    <span class="text-sm">{{ skill.icon }}</span>
                    {{ skill.name }}
                </button>
            </div>

            <!-- 消息区域 -->
            <div class="flex-1 space-y-4 overflow-y-auto p-5 bg-slate-50/30">
                <div v-if="messages.length === 0" class="flex h-full flex-col items-center justify-center text-center opacity-60">
                    <div class="relative mb-4">
                        <span class="text-5xl">🔭</span>
                        <div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-indigo-500"></div>
                    </div>
                    <p class="text-[13px] font-medium text-slate-600">准备好开始创作了吗？</p>
                    <p class="mt-1 text-[11px] text-slate-400">选择技能并输入您的想法，我将全力配合。</p>
                </div>
                
                <div v-for="(msg, i) in messages" :key="i" class="flex flex-col gap-2">
                    <div :class="['w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm',
                                 msg.role === 'user' 
                                    ? 'ml-auto bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none']">
                        <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                    </div>
                    
                    <!-- AI 消息的功能操作 -->
                    <div v-if="msg.role === 'assistant' && msg.content && msg.content.length > 50" class="flex gap-2 ml-1">
                        <button @click="exportMarkdown(msg.content!)" 
                            class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold hover:bg-indigo-100 transition-colors">
                            <span>📥</span> 导出 MD
                        </button>
                        <button @click="createDraft(msg.content!)" 
                            class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold hover:bg-emerald-100 transition-colors">
                            <span>✍️</span> 转为草稿
                        </button>
                    </div>
                </div>

                <div v-if="isLoading" class="flex w-fit gap-1.5 rounded-2xl bg-white border border-slate-100 px-5 py-3 shadow-sm rounded-tl-none">
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></span>
                </div>
            </div>

            <!-- 输入框 -->
            <div class="border-t bg-white p-5">
                <div class="group relative flex items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-1.5 transition-all focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
                    <textarea v-model="input" 
                        placeholder="输入指令，按 Enter 发送..." 
                        class="h-10 w-full resize-none bg-transparent px-3 py-2 text-[13px] outline-none"
                        @keydown.enter.prevent="sendMessage"
                    ></textarea>
                    <button @click="sendMessage" :disabled="isLoading || !input.trim()"
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
                <div class="mt-3 flex items-center justify-between px-1">
                    <button @click="clearHistory" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                        Clear Chat
                    </button>
                    <div class="flex items-center gap-1.5 opacity-40">
                        <span class="text-[10px] font-bold uppercase tracking-widest">MCP Tools Active</span>
                        <div class="h-1 w-1 rounded-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 触发按钮 -->
        <button @click="isOpen = !isOpen"
            class="group relative flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900 text-white shadow-2xl transition-all hover:scale-105 hover:bg-indigo-600 active:scale-95">
            <div class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold shadow-lg" v-if="!isOpen && messages.length > 0">
                {{ messages.length }}
            </div>
            <span v-if="!isOpen" class="text-3xl transition-transform group-hover:rotate-12">🤖</span>
            <svg v-else class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </button>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
