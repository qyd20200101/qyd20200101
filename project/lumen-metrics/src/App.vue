<template>
  <!-- 噪声纹理层 -->
  <div class="app-noise"></div>

  <!-- 登录页单独渲染 -->
  <router-view v-if="route.path === '/login'" />
  
  <!-- 主布局 -->
  <el-container v-else class="app-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">LumenMetrics</div>
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>大盘监控</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>日志探索</span>
        </el-menu-item>
        <el-menu-item index="/rules">
          <el-icon><Lock /></el-icon>
          <span>规则与权限</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>分析报表</span>
        </el-menu-item>
        <el-menu-item index="/inspections">
          <el-icon><Guide /></el-icon>
          <span>自动化巡检</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <span>实时监控平台</span>
          <div class="header-right">
            <el-button link @click="toggleTheme">
              <el-icon :size="20">
                <Moon v-if="isDark" />
                <Sunny v-else />
              </el-icon>
            </el-button>
            <span class="user-name">{{ username }}</span>
            <el-button link type="danger" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Odometer, Document, Lock, Moon, Sunny, DataAnalysis, Guide } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { WebSocketClient } from './utils/websocket'
import { db } from './db'

const route = useRoute()
const router = useRouter()
const username = ref('')
const isDark = ref(true)

onMounted(() => {
  const userJson = localStorage.getItem('user')
  if (userJson) {
    const user = JSON.parse(userJson)
    username.value = user.username
  }
  
  // 初始化主题状态
  isDark.value = document.documentElement.classList.contains('dark')

  // 全局告警监听
  const ws = new WebSocketClient(`ws://${window.location.hostname}:8080/metrics`)
  ws.on('alert', async (alert: any) => {
    // P7: 租户隔离检测
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (alert.tenantId !== user.tenantId) return

    // 持久化存储到 IndexedDB
    try {
      await db.alerts.add({
        ...alert,
        unixTimestamp: Date.now(),
        status: 'UNPROCESSED'
      })
    } catch (e) {
      console.error('Failed to save alert:', e)
    }

    ElNotification({
      title: alert.title,
      message: alert.message,
      type: alert.level === 'CRITICAL' ? 'error' : 'warning',
      duration: 5000,
      position: 'bottom-right',
      dangerouslyUseHTMLString: true,
      customClass: 'custom-notification'
    })
  })
  ws.connect()
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.sidebar {
  background-color: transparent !important;
  backdrop-filter: blur(20px);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 10;
  transition: all 0.3s;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: var(--el-color-primary);
  letter-spacing: 1px;
}
.el-menu-vertical {
  border-right: none;
  background-color: transparent !important;
}
.header {
  background-color: rgba(var(--el-bg-color-rgb), 0.7);
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  z-index: 9;
  transition: all 0.3s;
}
.header-content {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.main-content {
  background-color: rgba(var(--el-bg-color-page-rgb), 0.6);
  backdrop-filter: blur(10px);
  padding: 24px;
  margin: 16px;
  border-radius: 20px;
  box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
  overflow-y: auto;
  animation: fadeIn 0.8s ease;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
