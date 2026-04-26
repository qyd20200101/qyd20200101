<template>
  <div class="dashboard">
    <div class="header-section">
      <h2>实时大盘 (Real-time Dashboard)</h2>
      <el-tag :type="isConnected ? 'success' : 'warning'" effect="dark" round>
        {{ isConnected ? 'WebSocket Connected' : 'Mock Data Mode' }}
      </el-tag>
    </div>
    
    <el-row :gutter="20" class="stat-row" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card glass-effect">
          <div class="stat-header">Real-time QPS</div>
          <div class="stat-value pulse-text">{{ currentQps }}</div>
          <div class="stat-footer">Messages / sec</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card glass-effect">
          <div class="stat-header">System CPU</div>
          <div class="stat-value success-text">{{ currentCpu }}%</div>
          <div class="stat-footer">Usage over all cores</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card glass-effect">
          <div class="stat-header">Backpressure Buffer</div>
          <div class="stat-value warning-text">{{ bufferSize }}</div>
          <div class="stat-footer">Pending items in queue</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="main-chart-card glass-effect" style="margin-top: 20px">
      <template #header>
        <div class="chart-header">
          <span class="chart-title">核心性能指标监控</span>
          <el-radio-group v-model="activeMetric" size="small" @change="handleMetricChange">
            <el-radio-button label="traffic">流量监控 (QPS/Latency)</el-radio-button>
            <el-radio-button label="system">系统资源 (CPU/MEM)</el-radio-button>
            <el-radio-button label="network">网络带宽 (IN/OUT)</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="charts-container">
        <div ref="chartRef" class="main-chart"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts'

import { WebSocketClient } from '../utils/websocket'
import { debounce } from '../utils/performance'

const chartRef = ref<HTMLElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)

const currentQps = ref(0)
const currentCpu = ref(0)
const bufferSize = ref(0)
const isConnected = ref(false)
const activeMetric = ref('traffic')

// Chart data sliding window
const timeData: string[] = []
const qpsData: number[] = []
const cpuData: number[] = []
const MAX_POINTS = 60

const handleResize = debounce(() => {
  chart.value?.resize()
}, 200)

const handleMetricChange = () => {
  if (!chart.value) return
  // Reset data for new metric
  timeData.length = 0
  qpsData.length = 0
  cpuData.length = 0
  
  const metricLabels = {
    traffic: ['QPS', 'Latency (ms)'],
    system: ['CPU Usage (%)', 'Memory (GB)'],
    network: ['Inbound (MB/s)', 'Outbound (MB/s)']
  }[activeMetric.value as 'traffic' | 'system' | 'network']

  chart.value.setOption({
    legend: { data: metricLabels },
    yAxis: [
      { name: metricLabels[0] },
      { name: metricLabels[1] }
    ],
    series: [
      { name: metricLabels[0], data: [] },
      { name: metricLabels[1], data: [] }
    ]
  })
}

// Data buffer for simulated WebSocket
const wsBuffer: { time: string; qps: number; cpu: number }[] = []
let wsTimer: number
let renderTimer: number
const realWsClient = ref<WebSocketClient | null>(null)

onMounted(() => {
  nextTick(() => {
    initChart()
    startRealWebSocket()
    startRenderLoop()
  })
  
  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopTimers()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  chart.value?.dispose()
  realWsClient.value?.disconnect()
})

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopTimers()
  } else {
    startRenderLoop()
    if (!isConnected.value) startMockWebSocket()
  }
}

const stopTimers = () => {
  clearInterval(wsTimer)
  clearInterval(renderTimer)
}


const initChart = () => {
  if (!chartRef.value) return
  chart.value = echarts.init(chartRef.value, 'dark', { renderer: 'canvas' })
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    toolbox: {
      feature: {
        saveAsImage: { title: '下载大盘截图', pixelRatio: 2 }
      },
      right: 20,
      top: 10
    },
    legend: { data: ['QPS', 'CPU Usage (%)'], textStyle: { color: '#a3a6ad' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#a3a6ad' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'QPS',
        position: 'left',
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
        axisLabel: { color: '#a3a6ad' }
      },
      {
        type: 'value',
        name: 'CPU (%)',
        position: 'right',
        max: 100,
        splitLine: { show: false },
        axisLabel: { color: '#a3a6ad' }
      }
    ],
    series: [
      {
        name: 'QPS',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: '#409eff', shadowColor: 'rgba(64,158,255,0.5)', shadowBlur: 10 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.4)' },
            { offset: 1, color: 'rgba(64,158,255,0.05)' }
          ])
        },
        data: qpsData,
        animation: false
      },
      {
        name: 'CPU Usage (%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: '#67c23a', shadowColor: 'rgba(103,194,58,0.5)', shadowBlur: 10 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103,194,58,0.4)' },
            { offset: 1, color: 'rgba(103,194,58,0.05)' }
          ])
        },
        data: cpuData,
        animation: false
      }
    ]
  }
  chart.value.setOption(option)
}

// 尝试连接真实 WebSocket (如果失败则回退到本地 Mock)
const startRealWebSocket = () => {
  const url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/metrics'
  realWsClient.value = new WebSocketClient(url)
  
  realWsClient.value.on('METRICS_TICK', (payload: any) => {
    wsBuffer.push(payload)
    isConnected.value = true
  })
  
  realWsClient.value.connect()
  
  // 模拟没有真实后端的降级处理
  setTimeout(() => {
    // 假设2秒连不上就认定为无后端
    if (!realWsClient.value?.isConnected) {
      console.warn('[WS Fallback] Cannot connect to real WebSocket, starting mock data generator...')
      isConnected.value = false
      startMockWebSocket()
      realWsClient.value?.disconnect()
    } else {
      console.log('[WS] Connected successfully, skipping mock data generation.')
      isConnected.value = true
    }
  }, 2000)
}

// 模拟 WebSocket 极速推送 (每秒发送 100-500 条)
const startMockWebSocket = () => {
  let qpsBase = 200
  let cpuBase = 30
  
  wsTimer = window.setInterval(() => {
    // 随机上下浮动
    qpsBase = Math.max(50, Math.min(1000, qpsBase + (Math.random() - 0.5) * 50))
    cpuBase = Math.max(5, Math.min(95, cpuBase + (Math.random() - 0.5) * 5))
    
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    
    // 推入缓冲区 (Backpressure Queue)
    wsBuffer.push({
      time: timeStr,
      qps: Math.floor(qpsBase),
      cpu: Math.floor(cpuBase)
    })
  }, 10) // 10ms 意味着 100条/秒
}

// 背压控制与渲染调度 (以固定帧率刷新大盘，批量消费缓冲区避免页面卡顿)
const startRenderLoop = () => {
  renderTimer = window.setInterval(() => {
    bufferSize.value = wsBuffer.length
    
    if (wsBuffer.length === 0) return
    
    // 消费缓冲区：为了演示平滑曲线，我们取最新的瞬时状态，同时可以直接进行聚合运算(如求平均值)
    const latest = wsBuffer[wsBuffer.length - 1]
    wsBuffer.length = 0 // 背压降维：清空已过期的缓冲区，控制渲染频率
    
    currentQps.value = latest.qps
    currentCpu.value = latest.cpu
    
    timeData.push(latest.time)
    qpsData.push(latest.qps)
    cpuData.push(latest.cpu)
    
    if (timeData.length > MAX_POINTS) {
      timeData.shift()
      qpsData.shift()
      cpuData.shift()
    }

    const t1 = getThreshold(activeMetric.value, 0)
    const t2 = getThreshold(activeMetric.value, 1)

    chart.value?.setOption({
      xAxis: { data: timeData },
      series: [
        { 
          data: qpsData,
          markLine: getMarkLine(activeMetric.value, 0),
          markPoint: latest.qps > t1 ? {
            data: [{ type: 'max', name: '异常峰值', value: latest.qps, itemStyle: { color: '#f56c6c' } }]
          } : { data: [] }
        },
        { 
          data: cpuData,
          markLine: getMarkLine(activeMetric.value, 1),
          markPoint: latest.cpu > t2 ? {
            data: [{ type: 'max', name: '性能瓶颈', value: latest.cpu, itemStyle: { color: '#f56c6c' } }]
          } : { data: [] }
        }
      ]
    })
  }, 1000)
}

const getThreshold = (type: string, index: number) => {
  const thresholds: any = {
    traffic: [800, 50],
    system: [80, 12],
    network: [40, 40]
  }
  return thresholds[type]?.[index] || 100
}

const getMarkLine = (type: string, index: number) => {
  const val = getThreshold(type, index)
  return {
    silent: true,
    symbol: 'none',
    label: { position: 'end', formatter: '阈值: {c}', color: '#f56c6c' },
    lineStyle: { color: '#f56c6c', type: 'dashed', width: 1, opacity: 0.6 },
    data: [{ yAxis: val }]
  }
}
</script>

<style scoped>
.dashboard {
  color: #e5eaf3;
  height: auto; /* Allow natural height for scrolling */
  display: flex;
  flex-direction: column;
  padding: 10px 30px 30px 10px; /* Extra right padding for scrollbar */
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Prevent overlap on small screens */
  gap: 15px;
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.header-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.stat-cards {
  margin-bottom: 20px;
}
.data-card {
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
}
.data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.card-title {
  font-size: 14px;
  color: #a3a6ad;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 42px;
  font-weight: 800;
  margin: 15px 0 5px;
}
.pulse-text {
  color: var(--el-color-primary);
  text-shadow: 0 0 15px rgba(64, 158, 255, 0.3);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Staggered Entrance */
.el-col:nth-child(1) .stat-card { animation-delay: 0.1s; }
.el-col:nth-child(2) .stat-card { animation-delay: 0.2s; }
.el-col:nth-child(3) .stat-card { animation-delay: 0.3s; }

.main-chart-card {
  animation-delay: 0.4s;
  margin-bottom: 20px;
}
.card-sub {
  font-size: 12px;
  color: #666;
}
.qps-value { color: #409eff; text-shadow: 0 0 15px rgba(64,158,255,0.4); }
.cpu-value { color: #67c23a; text-shadow: 0 0 15px rgba(103,194,58,0.4); }
.buffer-value { color: #e6a23c; text-shadow: 0 0 15px rgba(230,162,60,0.4); }

.charts-container {
  flex: 1;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px 30px; /* Balanced internal padding */
  display: flex;
  flex-direction: column;
}
.main-chart {
  width: 100%;
  height: 480px; /* Slightly taller for better readability */
}
</style>
