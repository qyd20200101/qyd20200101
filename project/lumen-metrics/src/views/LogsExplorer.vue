<template>
  <div class="logs-explorer">
    <div class="header-section">
      <h2>海量日志探索器</h2>
      <div class="actions">
        <el-button type="success" :loading="isGenerating" @click="generateMockData(100000)">
          生成 10W 条测试数据
        </el-button>
        <el-button type="warning" plain :disabled="logs.length === 0" @click="handleExport" :loading="isExporting">
          <el-icon><Download /></el-icon> 导出 CSV
        </el-button>
        <el-progress v-if="isGenerating" :percentage="generateProgress" style="width: 200px; margin-left: 15px;" />
      </div>
    </div>
    
    <el-card class="search-panel">
      <div class="panel-layout">
        <div class="search-form-side">
          <el-form :inline="true" class="demo-form-inline">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                size="small"
                style="width: 320px"
                value-format="x"
              />
            </el-form-item>
            <el-form-item label="级别">
              <el-select v-model="searchLevel" placeholder="全部" style="width: 100px" clearable>
                <el-option label="INFO" value="INFO" />
                <el-option label="WARN" value="WARN" />
                <el-option label="ERROR" value="ERROR" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input v-model="searchKeyword" placeholder="搜索内容" clearable style="width: 180px" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isQuerying" @click="handleSearch">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
            </el-form-item>
            <el-form-item>
              <el-switch v-model="isLiveTail" />
              <span class="switch-label">Live Tail</span>
            </el-form-item>
          </el-form>
          <div v-if="queryTime !== null" class="query-info">
            <el-tag type="info" size="small" effect="plain">
              耗时: {{ queryTime }}ms | 结果: {{ logs.length }} 条
            </el-tag>
          </div>
        </div>

        <div v-show="logs.length > 0" class="stats-side">
          <div ref="statsChartRef" class="stats-chart"></div>
        </div>
      </div>
    </el-card>


    <div class="log-list-container">
      <div v-show="logs.length === 0 && !isQuerying" class="empty-state">
        <el-empty description="暂无数据，请先生成或调整搜索条件" />
      </div>
      
      <div v-show="logs.length > 0 || isQuerying" class="virtual-list" v-bind="containerProps">
        <div v-bind="wrapperProps">
          <div 
            v-for="item in list" 
            :key="item.index" 
            class="log-item"
            :class="item.data.level.toLowerCase()"
            @click="showContext(item.data)"
          >
            <div class="log-time">{{ formatDate(item.data.timestamp) }}</div>
            <div class="log-level">
              <el-tag :type="getTagType(item.data.level)" size="small" effect="dark">
                {{ item.data.level }}
              </el-tag>
            </div>
            <div class="log-message" v-html="highlightText(item.data.message, searchKeyword)"></div>
            <div class="log-actions">
              <el-button link type="primary" size="small" @click.stop="copyLog(item.data.message)">
                Copy
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 日志详情侧边栏 (Drawer) -->
    <el-drawer
      v-model="contextVisible"
      title="日志详细分析 (Trace Context)"
      direction="rtl"
      size="45%"
      class="custom-drawer"
    >
      <div v-if="selectedLog" class="context-details">
        <div class="detail-header">
          <el-tag :type="getTagType(selectedLog.level)" effect="dark">{{ selectedLog.level }}</el-tag>
          <span class="detail-time">{{ formatDate(selectedLog.timestamp) }}</span>
        </div>
        
        <div class="detail-section">
          <h4>日志正文</h4>
          <div class="message-box">{{ selectedLog.message }}</div>
        </div>
        
        <div class="detail-section">
          <h4>上下文 JSON (Structured Data)</h4>
          <pre class="json-viewer">{{ formatJson(selectedLog.context) }}</pre>
        </div>

        <div class="detail-section">
          <h4>关联操作</h4>
          <el-space>
            <el-button type="primary" plain size="small">查看关联 Trace</el-button>
            <el-button type="info" plain size="small">下载原始日志</el-button>
          </el-space>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, nextTick } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { useVirtualList } from '@vueuse/core'
import * as echarts from 'echarts'
import LogWorker from '../workers/log.worker?worker'
import type { LogEntry } from '../db/index'
import { ElMessage } from 'element-plus'
import { WebSocketClient } from '../utils/websocket'
import { debounce } from '../utils/performance'

const isGenerating = ref(false)
const generateProgress = ref(0)
const isQuerying = ref(false)
const isExporting = ref(false)
const queryTime = ref<number | null>(null)
const isLiveTail = ref(false)

const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const searchLevel = ref('')
const searchKeyword = ref('')
const timeRange = ref<[number, number] | null>(null)

const logs = shallowRef<LogEntry[]>([])
let worker: Worker
let wsClient: WebSocketClient
const statsChartRef = ref<HTMLElement | null>(null)
const statsChart = shallowRef<echarts.ECharts | null>(null)

// Virtual list setup
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(logs, {
  itemHeight: 48,
})

const contextVisible = ref(false)
const selectedLog = ref<LogEntry | null>(null)

// P0: 全局 Trace 联动逻辑
const handleTraceClick = (traceId: string) => {
  searchKeyword.value = traceId
  searchLevel.value = '' // 清空级别，显示全链路
  handleSearch()
  contextVisible.value = false // 如果在详情页，则关闭
}

// 暴露给 window 供 v-html 中的 onclick 调用
onMounted(() => {
  (window as any).dispatchTraceClick = handleTraceClick
})

onMounted(() => {
  worker = new LogWorker()
  
  worker.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data
    
    if (type === 'GENERATE_PROGRESS') {
      generateProgress.value = payload.progress
    } else if (type === 'GENERATE_DONE') {
      isGenerating.value = false
      handleSearch()
    } else if (type === 'QUERY_START') {
      isQuerying.value = true
    } else if (type === 'QUERY_RESULTS') {
      logs.value = payload.data
      queryTime.value = payload.timeMs
      isQuerying.value = false
      
      if (isLiveTail.value) {
        nextTick(() => scrollTo(0)) // Prepending, so scroll to top
      } else {
        scrollTo(0)
      }
      
      updateStatsChart(payload.stats)
    } else if (type === 'EXPORT_DONE') {
      isExporting.value = false
      const blob = new Blob([payload.csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `lumen_logs_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      ElMessage.success('日志导出成功')
    } else if (type === 'QUERY_ERROR') {
      console.error('Worker query error:', payload)
      isQuerying.value = false
      isExporting.value = false
    }
  }

  // 初始化 WebSocket
  wsClient = new WebSocketClient(`ws://${window.location.hostname}:8080/metrics`)
  wsClient.on('log', (newLog: LogEntry) => {
    // P7: 租户隔离检测
    if (newLog.tenantId !== currentUser.tenantId) return

    // 1. 保存到 IndexedDB
    worker.postMessage({ type: 'SAVE_LOG', payload: { log: newLog } })

    // 2. 如果开启了实时追踪，则追加到列表顶部
    if (isLiveTail.value) {
      // 检查筛选条件
      if (searchLevel.value && newLog.level !== searchLevel.value) return
      if (searchKeyword.value && !newLog.message.toLowerCase().includes(searchKeyword.value.toLowerCase())) return

      const updatedLogs = [newLog, ...logs.value]
      if (updatedLogs.length > 100000) updatedLogs.pop()
      logs.value = updatedLogs
    }
  })
  wsClient.connect()
  
  nextTick(() => {
    initStatsChart()
    handleSearch()
    window.addEventListener('resize', debounce(() => statsChart.value?.resize(), 200))
  })
})

onUnmounted(() => {
  if (worker) worker.terminate()
  if (wsClient) wsClient.disconnect()
  statsChart.value?.dispose()
})

const initStatsChart = () => {
  if (!statsChartRef.value) return
  statsChart.value = echarts.init(statsChartRef.value, 'dark')
  
  // 添加点击事件监听
  statsChart.value.on('click', (params: any) => {
    if (params.name) {
      searchLevel.value = params.name
      handleSearch()
    }
  })
}

const updateStatsChart = (stats: any) => {
  if (!statsChart.value || !stats) return
  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#a3a6ad' : '#606266'
  const lineColor = isDark ? '#333' : '#e4e7ed'

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, bottom: 25, left: 60, right: 30, containLabel: false },
    xAxis: {
      type: 'category',
      data: ['INFO', 'WARN', 'ERROR'],
      axisLine: { lineStyle: { color: lineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11, margin: 12 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } },
      axisLabel: { color: textColor, fontSize: 10, margin: 8 }
    },
    series: [{
      data: [
        { value: stats.INFO, itemStyle: { color: '#909399' } },
        { value: stats.WARN, itemStyle: { color: '#e6a23c' } },
        { value: stats.ERROR, itemStyle: { color: '#f56c6c' } }
      ],
      type: 'bar',
      barWidth: '25%', 
      barCategoryGap: '50%', // 强制增加类别间的间距
      label: { 
        show: true, 
        position: 'top', 
        color: isDark ? '#eee' : '#333', 
        fontSize: 11,
        distance: 10,
        rotate: 0,
        formatter: (params: any) => {
          if (params.value === 0) return '' // 数值为 0 时隐藏标签
          return params.value >= 1000 ? (params.value / 1000).toFixed(1) + 'k' : params.value
        }
      }
    }]
  }
  
  statsChart.value.setOption(option)
  // 强制触发重绘，确保在 DOM 渲染后尺寸正确
  nextTick(() => {
    statsChart.value?.resize()
  })
}
const generateMockData = (count: number) => {
  if (isGenerating.value) return
  isGenerating.value = true
  generateProgress.value = 0
  worker.postMessage({ type: 'GENERATE_MOCK_DATA', payload: { count } })
}

const handleSearch = () => {
  if (isQuerying.value) return
  const tenantId = currentUser.tenantId || 'default_tenant'
  worker.postMessage({
    type: 'QUERY_LOGS',
    payload: {
      level: searchLevel.value,
      keyword: searchKeyword.value,
      startTime: timeRange.value ? timeRange.value[0] : undefined,
      endTime: timeRange.value ? timeRange.value[1] : undefined,
      tenantId, 
      limit: 100000
    }
  })
}

const handleExport = () => {
  if (isExporting.value) return
  isExporting.value = true
  worker.postMessage({
    type: 'EXPORT_LOGS',
    payload: {
      level: searchLevel.value,
      keyword: searchKeyword.value,
      startTime: timeRange.value ? timeRange.value[0] : undefined,
      endTime: timeRange.value ? timeRange.value[1] : undefined,
      tenantId: currentUser.tenantId // 传递租户 ID
    }
  })
}

const highlightText = (text: string, keyword: string) => {
  if (!text) return ''
  
  // 1. 提取并处理 TraceID 链接
  let processed = text.replace(/\[TraceID:\s*([a-z0-9]+)\]/gi, (match, traceId) => {
    return `<span class="trace-link" onclick="event.stopPropagation(); window.dispatchTraceClick('${traceId}')">${match}</span>`
  })

  // 2. 处理搜索关键字高亮
  if (keyword) {
    const reg = new RegExp(`(${keyword})`, 'gi')
    processed = processed.replace(reg, '<span class="highlight">$1</span>')
  }
  
  return processed
}

const copyLog = (text: string) => {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

const showContext = (log: LogEntry) => {
  selectedLog.value = log
  contextVisible.value = true
}

// Helpers
const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`
}

const getTagType = (level: string) => {
  if (level === 'ERROR') return 'danger'
  if (level === 'WARN') return 'warning'
  return 'info'
}

const formatJson = (str: string | undefined) => {
  if (!str) return '{}'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch (e) {
    return str
  }
}
</script>

<style scoped>
.logs-explorer {
  color: var(--el-text-color-primary);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  align-items: center;
}
.search-panel {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  margin-bottom: 15px;
}
:deep(.el-card__body) {
  padding: 15px 20px;
}
.panel-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}
.search-form-side {
  flex: 1;
}
.switch-label {
  margin-left: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.query-info {
  margin-top: 10px;
}
.stats-side {
  width: 420px;
  height: 140px;
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-light);
  padding-left: 20px;
}
.stats-chart {
  height: 100%;
  width: 100%;
  cursor: pointer;
}
:deep(.el-form-item__label) {
  color: var(--el-text-color-primary);
}

.log-list-container {
  flex: 1;
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.virtual-list {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  height: 48px;
  box-sizing: border-box;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
.log-item:hover {
  background-color: var(--el-fill-color-light);
}
.log-item:hover .log-actions {
  opacity: 1;
}
.log-item.error {
  background-color: var(--el-color-danger-light-9);
}
.log-item.error:hover {
  background-color: var(--el-color-danger-light-8);
}
.log-item.warn {
  background-color: var(--el-color-warning-light-9);
}
.log-item.warn:hover {
  background-color: var(--el-color-warning-light-8);
}

.log-time {
  width: 200px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.log-level {
  width: 80px;
  flex-shrink: 0;
}
.log-message {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.log-actions {
  width: 60px;
  opacity: 0;
  transition: opacity 0.2s;
  text-align: right;
}

:deep(.highlight) {
  background-color: rgba(255, 235, 59, 0.3);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
}

:deep(.trace-link) {
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;
  font-weight: bold;
  padding: 0 2px;
}
:deep(.trace-link:hover) {
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
}


/* Drawer Styles */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.detail-time {
  color: var(--el-text-color-secondary);
  font-family: monospace;
}
.detail-section {
  margin-bottom: 30px;
}
.detail-section h4 {
  margin-bottom: 15px;
  color: var(--el-color-primary);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.message-box {
  background-color: var(--el-fill-color-darker);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  line-height: 1.6;
  font-family: 'JetBrains Mono', monospace;
  word-break: break-all;
  color: var(--el-text-color-primary);
}
.json-viewer {
  background-color: var(--el-fill-color-darker);
  padding: 15px;
  border-radius: 8px;
  color: var(--el-color-primary-light-3);
  overflow-x: auto;
  border: 1px solid var(--el-border-color);
  font-size: 13px;
}
:deep(.custom-drawer) {
  background-color: var(--el-bg-color-overlay) !important;
}
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color);
}
:deep(.el-drawer__title) {
  color: var(--el-text-color-primary);
  font-weight: bold;
}
</style>


