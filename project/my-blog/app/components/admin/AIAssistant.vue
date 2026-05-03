<script setup lang="ts">
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})
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
    { id: 'copy_optimization', name: '文案优化', icon: '✨' },
    { id: 'import_kb', name: '导入知识', icon: '📥' }
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

// 上传本地知识文件
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileUpload = () => {
    fileInput.value?.click()
}

const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.files?.length) return

    isLoading.value = true
    const formData = new FormData()
    formData.append('file', target.files[0])

    try {
        const res = await $fetch('/api/admin/knowledge/upload', {
            method: 'POST',
            body: formData
        })
        messages.value.push({
            role: 'assistant',
            content: `📤 文件上传成功！\n📄 文档: ${res.results[0].title}\n✅ 状态: ${res.results[0].status === 'imported' ? '全新导入' : '覆盖更新'}`
        })
    } catch (e: any) {
        messages.value.push({
            role: 'assistant',
            content: `❌ 上传失败: ${e.message}`
        })
    } finally {
        isLoading.value = false
        target.value = '' // 清空 input
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
        title = titleMatch[1];
    } else {
        // 尝试从第一个 H1 提取
        const h1Match = content.match(/^#\s+(.+)$/m)
        if (h1Match) title = h1Match[1];
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

// 创建草稿并保存到服务器
const createDraft = async (content: string) => {
    const { title } = parseAIContent(content)
    try {
        isLoading.value = true
        const res = await $fetch('/api/admin/blog/save-draft', {
            method: 'POST',
            body: { title, content }
        })
        if (res.success) {
            messages.value.push({
                role: 'assistant',
                content: `✅ 草稿已保存到服务器文件系统！\n\n文件路径：\`${res.filename}\`\n您现在可以在后台管理或 Git 中直接看到它了。`
            })
        }
    } catch (e: any) {
        messages.value.push({
            role: 'assistant',
            content: `❌ 保存草稿失败：${e.message}`
        })
    } finally {
        isLoading.value = false
    }
}

// 导入知识库
const importKnowledge = async () => {
    if (isLoading.value) return
    isLoading.value = true
    try {
        const res = await $fetch('/api/admin/knowledge/import', { method: 'POST' })
        messages.value.push({
            role: 'assistant',
            content: `✅ 知识库处理完成！\n✨ 新导入: ${res.imported} 个文件\nℹ️ 已存在: ${res.skipped} 个文件`
        })
    } catch (e: any) {
        messages.value.push({
            role: 'assistant',
            content: `❌ 导入失败: ${e.message}`
        })
    } finally {
        isLoading.value = false
    }
}

// 拖拽逻辑
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const startDrag = (e: MouseEvent) => {
    // 只有左键点击才触发
    if (e.button !== 0) return

    isDragging.value = true
    dragStart.value = {
        x: e.clientX - position.value.x,
        y: e.clientY - position.value.y
    }

    // 防止拖拽时选中文字
    e.preventDefault()

    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return
    position.value = {
        x: e.clientX - dragStart.value.x,
        y: e.clientY - dragStart.value.y
    }
}

const stopDrag = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
}
</script>

<template>
    <div class="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-4" :style="{
        transform: `translate(${position.x}px, ${position.y}px)`,
        userSelect: isDragging ? 'none' : 'auto'
    }">
        <!-- 助手窗口 -->
        <div v-if="isOpen"
            class="flex h-[550px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <!-- 头部 (拖拽把手) -->
            <div @mousedown="startDrag"
                class="flex cursor-move items-center justify-between bg-slate-900 px-6 py-5 text-white active:bg-slate-800 transition-colors">
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
                <div class="flex items-center gap-1">
                    <button @mousedown.stop @click="isOpen = false"
                        class="rounded-xl p-2 hover:bg-white/10 transition-colors">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 技能选择器 -->
            <div class="border-b bg-slate-50/50 p-4">
                <div class="flex flex-wrap gap-2">
                    <!-- 隐藏的文件上传控件 -->
                    <input type="file" ref="fileInput" class="hidden" accept=".md,.txt,.pdf" @change="handleFileUpload" />
                    
                    <button v-for="skill in skills" :key="skill.id"
                        @click="skill.id === 'import_kb' ? triggerFileUpload() : selectedSkill = skill.id" :class="[
                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all border shadow-sm',
                            selectedSkill === skill.id
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        ]">
                        <span class="text-sm">{{ skill.icon }}</span>
                        {{ skill.name }}
                    </button>
                </div>
            </div>

            <!-- 消息区域 -->
            <div class="flex-1 space-y-4 overflow-y-auto p-5 bg-slate-50/30">
                <div v-if="messages.length === 0"
                    class="flex h-full flex-col items-center justify-center text-center opacity-60">
                    <div class="relative mb-4">
                        <span class="text-5xl">🔭</span>
                        <div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-indigo-500"></div>
                    </div>
                    <p class="text-[13px] font-medium text-slate-600">准备好开始创作了吗？</p>
                    <p class="mt-1 text-[11px] text-slate-400">选择技能并输入您的想法，我将全力配合。</p>
                </div>

                <div v-for="(msg, i) in messages" :key="i" class="flex flex-col gap-2">
                    <div :class="['w-full max-w-[95%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm break-words overflow-hidden',
                        msg.role === 'user'
                            ? 'ml-auto bg-slate-900 text-white rounded-tr-none'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none prose-sm prose-slate max-w-none']">
                        <div v-if="msg.role === 'assistant'" v-html="md.render(msg.content || '')" class="markdown-body"></div>
                        <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
                    </div>

                    <!-- AI 消息的功能操作 -->
                    <div v-if="msg.role === 'assistant' && msg.content && msg.content.length > 50"
                        class="flex gap-2 ml-1">
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

                <div v-if="isLoading"
                    class="flex w-fit gap-1.5 rounded-2xl bg-white border border-slate-100 px-5 py-3 shadow-sm rounded-tl-none">
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></span>
                </div>
            </div>

            <!-- 输入框 -->
            <div class="border-t bg-white p-5">
                <div
                    class="group relative flex items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-1.5 transition-all focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
                    <textarea v-model="input" placeholder="输入指令，按 Enter 发送..."
                        class="h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[13px] outline-none"
                        @keydown.enter.prevent="sendMessage"></textarea>
                    <button @click="sendMessage" :disabled="isLoading || !input.trim()"
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke-width="2.5" stroke-linecap="round"
                                stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
                <div class="mt-3 flex items-center justify-between px-1">
                    <button @click="clearHistory"
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                        Clear Chat
                    </button>
                    <div class="flex items-center gap-1.5 opacity-40">
                        <span class="text-[10px] font-bold uppercase tracking-widest">MCP Tools Active</span>
                        <div class="h-1 w-1 rounded-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 触发按钮 (仅在关闭时显示) -->
        <button v-if="!isOpen" @click="isOpen = true"
            class="group relative flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900 text-white shadow-2xl transition-all hover:scale-105 hover:bg-indigo-600 active:scale-95">
            <div class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold shadow-lg"
                v-if="messages.length > 0">
                {{ messages.length }}
            </div>
            <span class="text-3xl transition-transform group-hover:rotate-12">🤖</span>
        </button>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Markdown 样式 */
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) {
    font-weight: 800;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
}
.markdown-body :deep(h2) { font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2rem; }
.markdown-body :deep(h3) { font-size: 1rem; }
.markdown-body :deep(p) { margin-bottom: 0.75rem; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin-bottom: 0.75rem; padding-left: 1.25rem; }
.markdown-body :deep(li) { margin-bottom: 0.25rem; list-style-type: disc; }
.markdown-body :deep(code) { background: #f1f5f9; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.9em; color: #e11d48; }
.markdown-body :deep(pre code) { background: transparent !important; padding: 0; color: #f8fafc; }
.markdown-body :deep(pre) { background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85em; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: left; }
.markdown-body :deep(th) { background: #f8fafc; font-weight: 700; }
.markdown-body :deep(blockquote) { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
</style>
