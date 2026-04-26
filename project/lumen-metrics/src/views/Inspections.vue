<template>
  <div class="inspections-view">
    <div class="header-section">
      <div class="title-info">
        <h2>自动化巡检系统 (Auto Inspection)</h2>
        <el-tag type="success" effect="plain">系统状态: 运行中</el-tag>
      </div>
      <el-button type="primary" @click="showAddTask">
        <el-icon><Plus /></el-icon> 新增巡检任务
      </el-button>
    </div>

    <el-row :gutter="20" class="inspection-layout">
      <!-- 任务配置列表 -->
      <el-col :span="10">
        <el-card class="task-list-card glass-effect" shadow="never">
          <template #header>
            <div class="card-header">
              <span>活跃巡检任务</span>
              <el-button link type="primary" @click="refreshTasks">刷新</el-button>
            </div>
          </template>
          
          <div v-for="task in tasks" :key="task.id" class="task-item" :class="{ active: currentTaskId === task.id }" @click="selectTask(task)">
            <div class="task-info">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-meta">类型: {{ task.type }} | 周期: {{ task.schedule }}</div>
            </div>
            <div class="task-ops">
              <el-switch v-model="task.active" size="small" @change="(v: boolean) => toggleTask(task, v)" />
              <el-button link type="primary" :loading="runningId === task.id" @click.stop="runInspection(task)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div v-if="tasks.length === 0" class="empty-tasks">
            暂无任务，请点击右上方按钮添加
          </div>
        </el-card>
      </el-col>

      <!-- 巡检执行报告 -->
      <el-col :span="14">
        <el-card class="result-card glass-effect" shadow="never">
          <template #header>
            <div class="card-header">
              <span>最近巡检报告 {{ selectedTask ? `- ${selectedTask.name}` : '' }}</span>
            </div>
          </template>

          <div v-if="selectedTask" class="report-content">
            <el-timeline>
              <el-timeline-item
                v-for="res in results"
                :key="res.id"
                :type="res.status === 'PASS' ? 'success' : (res.status === 'FAIL' ? 'danger' : 'warning')"
                :timestamp="new Date(res.timestamp).toLocaleString()"
                placement="top"
              >
                <el-card shadow="never" class="result-detail-card">
                  <div class="result-header">
                    <span class="status-tag" :class="res.status.toLowerCase()">{{ res.status }}</span>
                    <span class="cost">耗时: {{ Math.floor(Math.random() * 500) + 100 }}ms</span>
                  </div>
                  <pre class="details-log">{{ res.details }}</pre>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <div v-if="results.length === 0" class="empty-results">
              该任务尚无执行记录
            </div>
          </div>
          <div v-else class="empty-state">
            请从左侧选择一个巡检任务查看历史报告
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加任务弹窗 -->
    <el-dialog v-model="dialogVisible" title="配置巡检任务" width="450px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.name" placeholder="例如: 核心 API 连通性测试" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="taskForm.type" placeholder="请选择" style="width: 100%">
            <el-option label="接口巡检 (API)" value="API" />
            <el-option label="数据库监控 (DB)" value="DB" />
            <el-option label="系统资源 (SYSTEM)" value="SYSTEM" />
            <el-option label="安全扫描 (SECURITY)" value="SECURITY" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行周期">
          <el-select v-model="taskForm.schedule" placeholder="请选择" style="width: 100%">
            <el-option label="每 5 分钟" value="5m" />
            <el-option label="每小时" value="1h" />
            <el-option label="每天 (04:00)" value="Daily" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动报修">
          <el-switch v-model="taskForm.autoRepair" active-text="发现异常时自动创建工单" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Plus, VideoPlay } from '@element-plus/icons-vue'
import { db, type InspectionTask, type InspectionResult } from '../db'
import { ElMessage, ElNotification } from 'element-plus'

const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const tasks = ref<InspectionTask[]>([])
const results = ref<InspectionResult[]>([])
const selectedTask = ref<InspectionTask | null>(null)
const currentTaskId = ref<number | null>(null)
const runningId = ref<number | null>(null)

const dialogVisible = ref(false)
const taskForm = reactive<Partial<InspectionTask>>({
  name: '',
  type: 'API',
  schedule: '5m',
  active: true,
  autoRepair: false
})

const refreshTasks = async () => {
  const tenantId = currentUser.tenantId || 'default_tenant'
  tasks.value = await db.inspections.where('tenantId').equals(tenantId).toArray()
  if (tasks.value.length > 0 && !selectedTask.value) {
    selectTask(tasks.value[0])
  }
}

const selectTask = async (task: InspectionTask) => {
  selectedTask.value = task
  currentTaskId.value = task.id!
  results.value = await db.inspectionResults
    .where('taskId').equals(task.id!)
    .and(r => r.tenantId === (currentUser.tenantId || 'default_tenant'))
    .reverse()
    .limit(10)
    .toArray()
}

const showAddTask = () => {
  Object.assign(taskForm, { name: '', type: 'API', schedule: '5m', active: true, autoRepair: false })
  dialogVisible.value = true
}

const saveTask = async () => {
  if (!taskForm.name) return ElMessage.warning('请输入任务名称')
  const tenantId = currentUser.tenantId || 'default_tenant'
  await db.inspections.add({
    ...taskForm,
    tenantId
  } as InspectionTask)
  dialogVisible.value = false
  ElMessage.success('任务添加成功')
  refreshTasks()
}

const toggleTask = async (task: InspectionTask, active: boolean) => {
  await db.inspections.update(task.id!, { active })
  ElMessage.success(`任务 ${task.name} 已${active ? '启用' : '禁用'}`)
}

const runInspection = async (task: InspectionTask) => {
  runningId.value = task.id!
  ElMessage.info(`正在执行巡检: ${task.name}...`)
  
  // 模拟巡检过程
  setTimeout(async () => {
    const isSuccess = Math.random() > 0.3 // 增加失败概率用于演示报修
    const status = isSuccess ? 'PASS' : (Math.random() > 0.5 ? 'FAIL' : 'WARNING')
    
    let details = isSuccess 
        ? `[OK] 目标节点响应正常\n[OK] 数据校验一致性通过\n[INFO] 当前负载: ${Math.floor(Math.random()*40+10)}%`
        : `[ERROR] 探测到异常响应延迟\n[WARN] 发现潜在的配置风险\n[LOG] 详细堆栈已记录至分析系统`

    // 如果开启了自动报修且巡检失败
    if (status === 'FAIL' && task.autoRepair) {
      const ticketId = `TKT-${Math.floor(Math.random()*90000) + 10000}`
      details += `\n\n[AUTO-REPAIR] 已检测到任务失败，触发自动报修流程...\n[TICKET] 已创建报修工单: ${ticketId}\n[ASSIGN] 已自动分派给最近的运维值班员 [AI-Agent]\n[STATUS] 工单状态: 处理中`
      
      ElNotification({
        title: '自动报修触发',
        message: `任务 [${task.name}] 巡检失败，已自动创建工单 ${ticketId}`,
        type: 'error'
      })
    }

    const result: InspectionResult = {
      taskId: task.id!,
      taskName: task.name,
      status,
      details,
      timestamp: Date.now(),
      tenantId: currentUser.tenantId || 'default_tenant'
    }
    
    await db.inspectionResults.add(result)
    runningId.value = null
    ElMessage({
      message: `巡检完成: ${task.name} [${status}]`,
      type: isSuccess ? 'success' : 'warning'
    })
    
    if (selectedTask.value?.id === task.id) {
      selectTask(task)
    }
  }, 1500)
}

onMounted(() => {
  refreshTasks()
})
</script>

<style scoped>
.inspections-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-info h2 { margin: 0; }

.inspection-layout {
  flex: 1;
  overflow: hidden;
}

.task-list-card, .result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-item {
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;
}

.task-item:hover {
  background: rgba(var(--el-color-primary-rgb), 0.1);
}

.task-item.active {
  background: rgba(var(--el-color-primary-rgb), 0.15);
  border-color: var(--el-color-primary);
}

.task-name { font-weight: 600; margin-bottom: 4px; }
.task-meta { font-size: 12px; color: var(--el-text-color-secondary); }

.task-ops { display: flex; align-items: center; gap: 12px; }

.report-content {
  padding: 10px;
  height: 100%;
  overflow-y: auto;
}

.result-detail-card {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02) !important;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-tag {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-tag.pass { background: #67c23a22; color: #67c23a; }
.status-tag.fail { background: #f56c6c22; color: #f56c6c; }
.status-tag.warning { background: #e6a23c22; color: #e6a23c; }

.cost { font-size: 12px; color: var(--el-text-color-secondary); }

.details-log {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  background: rgba(0,0,0,0.2);
  padding: 12px;
  border-radius: 6px;
  color: #a3a6ad;
  white-space: pre-wrap;
}

.empty-state, .empty-tasks, .empty-results {
  padding: 60px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
</style>
