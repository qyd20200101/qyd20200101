<script>
import AppHeader from "~/components/AppHeader.vue";
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <AppHeader />
        <div class="mx-auto w-full max-w-7xl gap-6 px-4 py-6">
            <slot />
        </div>
    </div>
</template>