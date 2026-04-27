<template>
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
            <div class="flex items-center gap-8">
                <NuxtLink to="/" class="group flex items-center gap-2">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-indigo-200 shadow-lg group-hover:bg-indigo-700 transition-colors">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <span class="text-xl font-black tracking-tight text-slate-900">BLOG<span class="text-indigo-600">.</span>CORE</span>
                </NuxtLink>
                
                <nav class="hidden items-center gap-6 md:flex">
                    <NuxtLink to="/" class="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">首页</NuxtLink>
                </nav>
            </div>

            <div class="flex items-center gap-4">
                <NuxtLink to="/admin/posts" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95">
                    进入后台
                </NuxtLink>
            </div>
        </div>
    </header>
</template>
