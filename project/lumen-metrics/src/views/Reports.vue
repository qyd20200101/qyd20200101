<template>
  <div class="reports-container">
    <div class="report-header glass-effect">
      <div class="title-area">
        <h2>智能运维分析报表 (Monthly Insights)</h2>
        <p>基于全量日志与告警数据的自动化效能评估</p>
      </div>
      <div class="actions">
        <el-switch
          v-model="comparePrev"
          active-text="同比上月"
          @change="generateReport"
          style="margin-right: 15px"
        />
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择报表月份"
          @change="generateReport"
        />
        <el-button type="primary" :loading="loading" @click="handlePrint">
          <el-icon><Download /></el-icon> 导出 PDF 报表
        </el-button>
      </div>
    </div>

    <div v-if="reportData" class="report-paper" id="report-content">
      <!-- 封面页 (Cover Page) -->
      <div class="report-cover">
        <div class="cover-header">
          <div class="logo">LumenMetrics</div>
          <div class="confidential">机密等级：内部公开</div>
        </div>
        
        <div class="cover-body">
          <div class="deco-line"></div>
          <h1 class="main-title">IT 系统运维月度分析报告</h1>
          <h2 class="sub-title">MONTHLY SYSTEM OPERATION & ANALYTICS</h2>
          <div class="report-month">{{ formatMonth(selectedMonth) }}</div>
        </div>

        <div class="cover-footer">
          <div class="info-row">
            <span class="label">报告编制:</span>
            <span class="value">LumenMetrics AI Agent</span>
          </div>
          <div class="info-row">
            <span class="label">项目租户:</span>
            <span class="value">{{ currentUser.tenantId || 'Default Project' }}</span>
          </div>
          <div class="info-row">
            <span class="label">发布日期:</span>
            <span class="value">{{ new Date().toLocaleDateString() }}</span>
          </div>
        </div>
      </div>

      <!-- 目录页 (TOC) -->
      <div class="report-toc">
        <h2 class="toc-title">目录 (Contents)</h2>
        <div class="toc-container">
          <div class="toc-item">
            <span class="num">01</span>
            <span class="text">核心指标概览 (Executive Summary)</span>
            <span class="dots"></span>
            <span class="page">P.01</span>
          </div>
          <div class="toc-item">
            <span class="num">02</span>
            <span class="text">稳定性深度分析 (Stability Analysis)</span>
            <span class="dots"></span>
            <span class="page">P.02</span>
          </div>
          <div class="toc-item">
            <span class="num">03</span>
            <span class="text">故障类型画像 (Failure Profiling)</span>
            <span class="dots"></span>
            <span class="page">P.02</span>
          </div>
          <div class="toc-item">
            <span class="num">04</span>
            <span class="text">响应效能评估 (Performance Eval)</span>
            <span class="dots"></span>
            <span class="page">P.03</span>
          </div>
          <div class="toc-item">
            <span class="num">05</span>
            <span class="text">结论与建议 (Conclusion)</span>
            <span class="dots"></span>
            <span class="page">P.04</span>
          </div>
        </div>
      </div>

      <!-- 正文内容 (Main Body) -->
      <div class="paper-header">
        <h1>LumenMetrics 运维月度总结报告</h1>
        <div class="meta-info">
          <span>报告月份: {{ formatMonth(selectedMonth) }}</span>
          <span>生成时间: {{ new Date().toLocaleString() }}</span>
          <span>租户 ID: {{ currentUser.tenantId }}</span>
        </div>
      </div>

      <div class="report-section">
        <h3>一、 核心指标概览 (Executive Summary)</h3>
        <el-row :gutter="20">
          <el-col :span="6" v-for="item in summaryCards" :key="item.label">
            <div class="metric-box">
              <div class="label">{{ item.label }}</div>
              <div class="value" :class="item.type">{{ item.value }}</div>
              <div class="trend-container" v-if="comparePrev">
                <span class="trend" :class="item.trend > 0 ? 'up' : 'down'">
                  {{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend).toFixed(1) }}%
                </span>
                <span class="trend-label">环比上月</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
<!-- ... Rest of template remains same ... -->

      <div class="report-section">
        <h3>二、 稳定性分析 (Stability Analysis)</h3>
        <div class="chart-grid-triple">
          <div class="report-chart">
            <h4>告警级别分布</h4>
            <div ref="levelChartRef" class="chart-container"></div>
          </div>
          <div class="report-chart">
            <h4>故障类型画像 (Radar)</h4>
            <div ref="radarChartRef" class="chart-container"></div>
          </div>
          <div class="report-chart">
            <h4>24小时故障触发热力</h4>
            <div ref="heatChartRef" class="chart-container"></div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>三、 响应效能评估 (Performance Evaluation)</h3>
        <el-table :data="topIssues" border stripe class="report-table">
          <el-table-column prop="name" label="高频告警项" />
          <el-table-column prop="count" label="触发次数" width="100" />
          <el-table-column prop="avgResolveTime" label="平均解决时长" width="150" />
          <el-table-column prop="status" label="健康度评估">
            <template #default="{ row }">
              <el-tag :type="row.count > 50 ? 'danger' : 'success'">{{ row.count > 50 ? '极高风险' : '健康' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="report-footer">
        <p>© 2026 LumenMetrics AI 自动生成的运维报告 - 仅供内部审阅</p>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="请选择月份以生成深度分析报表" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { db } from '../db'
import * as echarts from 'echarts'

const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const selectedMonth = ref(new Date())
const comparePrev = ref(true)
const loading = ref(false)
const reportData = ref<any>(null)

const levelChartRef = ref<HTMLElement>()
const heatChartRef = ref<HTMLElement>()
const radarChartRef = ref<HTMLElement>()

// ... same cards ...
const summaryCards = ref([
  { label: '系统可用率', value: '99.98%', trend: 0.02, type: 'success' },
  { label: '累计告警数', value: '0', trend: 0, type: 'danger' },
  { label: '平均响应 (MTTA)', value: '4.2m', trend: -2.4, type: 'primary' },
  { label: '平均解决 (MTTR)', value: '18.5m', trend: 1.2, type: 'warning' }
])

const topIssues = ref([
  { name: 'API Gateway Timeout', count: 86, avgResolveTime: '12m', status: 'Warning' },
  { name: 'Database Connection Pool Exhausted', count: 12, avgResolveTime: '45m', status: 'Critical' },
  { name: 'Slow Query Detected', count: 245, avgResolveTime: '2m', status: 'Info' }
])

const generateReport = async () => {
  if (!selectedMonth.value) return
  loading.value = true
  
  const tenantId = currentUser.tenantId || ''
  const currentStart = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth(), 1).getTime()
  const currentEnd = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() + 1, 0, 23, 59, 59).getTime()
  
  const prevMonth = new Date(selectedMonth.value)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).getTime()
  const prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59).getTime()

  // 模拟数据聚合
  setTimeout(async () => {
    const currentAlerts = await db.alerts
      .where('tenantId').equals(tenantId)
      .filter(a => a.unixTimestamp >= currentStart && a.unixTimestamp <= currentEnd)
      .toArray()
      
    const prevAlerts = await db.alerts
      .where('tenantId').equals(tenantId)
      .filter(a => a.unixTimestamp >= prevStart && a.unixTimestamp <= prevEnd)
      .toArray()

    summaryCards.value[1].value = currentAlerts.length.toString()
    
    if (prevAlerts.length > 0) {
      const diff = currentAlerts.length - prevAlerts.length
      summaryCards.value[1].trend = (diff / prevAlerts.length) * 100
    } else {
      summaryCards.value[1].trend = currentAlerts.length > 0 ? 100 : 0
    }

    // 故障画像分析
    const profiling = { network: 0, database: 0, compute: 0, storage: 0, security: 0 }
    currentAlerts.forEach(a => {
      const msg = (a.title + a.message).toLowerCase()
      if (msg.includes('network') || msg.includes('api') || msg.includes('timeout')) profiling.network++
      if (msg.includes('db') || msg.includes('connection') || msg.includes('sql')) profiling.database++
      if (msg.includes('cpu') || msg.includes('load') || msg.includes('memory')) profiling.compute++
      if (msg.includes('disk') || msg.includes('storage') || msg.includes('file')) profiling.storage++
      if (msg.includes('security') || msg.includes('auth') || msg.includes('attack')) profiling.security++
    })
    
    reportData.value = { generated: true, profiling }
    loading.value = false
    
    nextTick(() => {
      initCharts()
    })
  }, 800)
}

const initCharts = () => {
  if (!reportData.value) return
  const { profiling } = reportData.value

  nextTick(() => {
    if (levelChartRef.value) {
      const chart = echarts.init(levelChartRef.value)
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 40, name: 'Critical', itemStyle: { color: '#f56c6c' } },
            { value: 30, name: 'Warning', itemStyle: { color: '#e6a23c' } },
            { value: 30, name: 'Info', itemStyle: { color: '#909399' } }
          ]
        }]
      })
    }

    if (radarChartRef.value) {
      const chart = echarts.init(radarChartRef.value)
      chart.setOption({
        radar: {
          indicator: [
            { name: '网络连通性', max: 50 },
            { name: '数据库负载', max: 50 },
            { name: '计算资源', max: 50 },
            { name: '存储压力', max: 50 },
            { name: '安全合规', max: 50 }
          ],
          shape: 'circle',
          axisName: { color: '#666' }
        },
        series: [{
          type: 'radar',
          data: [{
            value: [
              profiling?.network || 10,
              profiling?.database || 15,
              profiling?.compute || 8,
              profiling?.storage || 5,
              profiling?.security || 2
            ],
            name: '故障画像',
            areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
            lineStyle: { color: '#409eff', width: 2 }
          }]
        }]
      })
    }
    
    if (heatChartRef.value) {
      const chart = echarts.init(heatChartRef.value)
      chart.setOption({
        tooltip: { position: 'top' },
        grid: { height: '60%', top: '5%' },
        xAxis: { type: 'category', data: Array.from({length: 24}, (_, i) => `${i}h`), splitArea: { show: true } },
        yAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], splitArea: { show: true } },
        visualMap: { min: 0, max: 10, calculator: true, orient: 'horizontal', left: 'center', bottom: '0%' },
        series: [{
          name: 'Alert Density',
          type: 'heatmap',
          data: Array.from({length: 24 * 7}, () => [Math.floor(Math.random() * 24), Math.floor(Math.random() * 7), Math.floor(Math.random() * 10)]),
          label: { show: false }
        }]
      })
    }
  })
}

const formatMonth = (date: Date) => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

const handlePrint = () => {
  window.print()
}

onMounted(() => {
  generateReport()
})
</script>

<style scoped>
.reports-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-header {
  padding: 24px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area h2 { margin: 0; font-size: 24px; }
.title-area p { margin: 5px 0 0; color: var(--el-text-color-secondary); }

.actions { display: flex; gap: 12px; }

.report-paper {
  background: white;
  color: #333;
  padding: 0; /* Remove padding to allow full-bleed cover */
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  max-width: 1000px;
  margin: 0 auto;
}

/* Cover Styles */
.report-cover {
  height: 1200px;
  padding: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #fdfdfd 0%, #f5f7fa 100%);
  break-after: page;
  position: relative;
  overflow: hidden;
}

.cover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cover-header .logo {
  font-size: 28px;
  font-weight: 800;
  color: var(--el-color-primary);
}

.cover-header .confidential {
  font-size: 14px;
  color: #999;
}

.cover-body {
  text-align: center;
}

.deco-line {
  width: 60px;
  height: 4px;
  background: var(--el-color-primary);
  margin: 0 auto 30px;
}

.main-title {
  font-size: 48px;
  font-weight: 900;
  margin-bottom: 20px;
  color: #1a1a1a;
  letter-spacing: 2px;
}

.sub-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 60px;
  letter-spacing: 4px;
}

.report-month {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.cover-footer {
  border-top: 1px solid #eee;
  padding-top: 40px;
  max-width: 400px;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  font-size: 16px;
}

.info-row .label {
  width: 100px;
  color: #999;
}

.info-row .value {
  font-weight: 600;
  color: #333;
}

/* TOC Styles */
.report-toc {
  height: 1200px;
  padding: 100px 80px;
  background: white;
  break-after: page;
}

.toc-title {
  font-size: 32px;
  margin-bottom: 60px;
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
}

.toc-item {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  font-size: 18px;
}

.toc-item .num {
  font-weight: 800;
  margin-right: 20px;
  color: var(--el-color-primary);
}

.toc-item .dots {
  flex: 1;
  border-bottom: 2px dotted #ddd;
  margin: 0 15px;
  position: relative;
  top: -5px;
}

.toc-item .page {
  font-weight: 600;
  color: #666;
}

.paper-header {
  padding: 80px 80px 30px;
  text-align: center;
  border-bottom: 2px solid #333;
  margin-bottom: 40px;
}

.paper-header h1 { font-size: 32px; margin-bottom: 15px; }

.meta-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  color: #666;
  font-size: 14px;
}

.report-section {
  margin-bottom: 50px;
  padding: 0 80px;
}

.report-section h3 {
  border-left: 5px solid var(--el-color-primary);
  padding-left: 15px;
  margin-bottom: 25px;
  font-size: 20px;
}

.metric-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.metric-box .label { color: #666; font-size: 14px; margin-bottom: 8px; }
.metric-box .value { font-size: 28px; font-weight: 800; }
.metric-box .trend { font-size: 12px; margin-top: 8px; }
.trend.up { color: #f56c6c; }
.trend.down { color: #67c23a; }

.chart-grid, .chart-grid-triple {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.report-chart {
  background: #fff;
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 8px;
}

.report-chart h4 { margin: 0 0 15px; text-align: center; color: #555; }
.chart-container { height: 250px; }

.report-table {
  width: 100%;
}

.report-footer {
  margin-top: 80px;
  text-align: center;
  border-top: 1px solid #eee;
  padding: 20px 80px;
  color: #999;
  font-size: 12px;
}

@media print {
  .report-header, .app-noise, .sidebar, .header {
    display: none !important;
  }
  .main-content {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
  .report-paper {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
  }
}
</style>
