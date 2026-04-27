<script setup lang="ts">
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()

async function handleLogin() {
    if (!username.value || !password.value) return
    
    loading.value = true
    error.value = ''
    
    try {
        await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                username: username.value,
                password: password.value
            }
        })
        // 登录成功，跳转到后台首页
        router.push('/admin/posts')
    } catch (e: any) {
        error.value = e.data?.message || '登录失败，请检查账号密码'
    } finally {
        loading.value = false
    }
}

// 禁用布局
definePageMeta({
    layout: false
})
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div class="w-full max-w-[400px] space-y-8">
            <div class="text-center">
                <div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h1 class="mt-6 text-2xl font-black tracking-tight text-slate-900">ADMIN ACCESS</h1>
                <p class="mt-2 text-sm text-slate-500 font-medium">请输入管理员凭据以继续</p>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
                <form @submit.prevent="handleLogin" class="space-y-5">
                    <div class="space-y-1.5">
                        <label class="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Username</label>
                        <input v-model="username" type="text" required
                            class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="管理员账号" />
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Password</label>
                        <input v-model="password" type="password" required
                            class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="••••••••" />
                    </div>

                    <div v-if="error" class="rounded-xl bg-red-50 px-4 py-2 text-[12px] font-bold text-red-500">
                        {{ error }}
                    </div>

                    <button type="submit" :disabled="loading"
                        class="flex w-full items-center justify-center rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50">
                        <span v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        {{ loading ? '核验中...' : '进入管理系统' }}
                    </button>
                </form>
            </div>

            <p class="text-center">
                <NuxtLink to="/" class="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                    ← 返回博客首页
                </NuxtLink>
            </p>
        </div>
    </div>
</template>
