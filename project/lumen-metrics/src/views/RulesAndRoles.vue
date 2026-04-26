<template>
  <div class="rules-roles">
    <div class="header-section">
      <h2>规则配置与权限管理 (RBAC & Audit)</h2>
    </div>
    
    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="异常报警规则引擎" name="rules">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="handleAddRule">
              <el-icon><Plus /></el-icon> 新增报警规则
            </el-button>
          </div>
          
          <el-table :data="rules" style="width: 100%" class="custom-table" header-row-class-name="table-header">
            <el-table-column prop="name" label="规则名称" width="200" />
            <el-table-column prop="condition" label="触发逻辑 (逻辑沙箱匹配)" />
            <el-table-column prop="level" label="报警级别" width="120">
              <template #default="{ row }">
                <el-tag :type="row.level === 'CRITICAL' ? 'danger' : 'warning'" effect="dark">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="实时引擎状态" width="120">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.active" 
                  @change="(val: boolean) => handleToggleStatus(row, val)" 
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditRule(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

    <!-- 规则编辑弹窗 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="isEdit ? '编辑报警规则' : '新增报警规则'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="ruleForm" label-width="100px" ref="ruleFormRef" :rules="formRules">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="触发逻辑" prop="condition">
          <el-input v-model="ruleForm.condition" type="textarea" placeholder="例如: ERROR_COUNT > 10 in 1m" />
        </el-form-item>
        <el-form-item label="报警级别" prop="level">
          <el-select v-model="ruleForm.level" placeholder="请选择级别">
            <el-option label="CRITICAL" value="CRITICAL" />
            <el-option label="WARNING" value="WARNING" />
            <el-option label="INFO" value="INFO" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.active" />
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="ruleForm.webhook" placeholder="例如: https://oapi.dingtalk.com/robot/send?access_token=..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitRuleForm">确定</el-button>
      </template>
    </el-dialog>

      
      <el-tab-pane label="访问控制 (RBAC) 与审计" name="rbac">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="success"><el-icon><User /></el-icon> 邀请协作成员</el-button>
          </div>
          
          <el-table :data="users" style="width: 100%" class="custom-table" header-row-class-name="table-header">
            <el-table-column prop="username" label="授权邮箱" width="180" />
            <el-table-column prop="role" label="系统级角色" width="150">
              <template #default="{ row }">
                <el-tag :type="getRoleType(row.role)" effect="plain">
                  {{ row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="permissions" label="细粒度 API/字段级权限">
              <template #default="{ row }">
                <div class="perm-tags">
                  <el-tag v-for="p in row.permissions" :key="p" size="small" type="info" class="perm-tag">
                    {{ p }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后审计登录时间" width="180" />
            <el-table-column label="操作审计" width="120">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleConfigUser(row)">策略配置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="历史告警记录" name="history">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="danger" plain @click="handleClearAlerts" :disabled="alertHistory.length === 0">
              <el-icon><Delete /></el-icon> 清空所有历史记录
            </el-button>
          </div>
          
          <el-table :data="alertHistory" style="width: 100%" class="custom-table" header-row-class-name="table-header">
            <el-table-column prop="timestamp" label="报警时间" width="180" />
            <el-table-column prop="title" label="告警名称" width="220">
              <template #default="{ row }">
                <span :style="{ color: row.level === 'CRITICAL' ? 'var(--el-color-danger)' : 'var(--el-color-warning)', fontWeight: 'bold' }">
                  {{ row.title }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="异常详情" />
            <el-table-column prop="level" label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="row.level === 'CRITICAL' ? 'danger' : 'warning'" size="small">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="处理状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small" effect="plain">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'UNPROCESSED'" 
                  link type="primary" 
                  size="small" 
                  @click="handleUpdateAlertStatus(row, 'CLAIMED')"
                >认领</el-button>
                <el-button 
                  v-if="row.status === 'CLAIMED'" 
                  link type="success" 
                  size="small" 
                  @click="handleUpdateAlertStatus(row, 'RESOLVED')"
                >解决</el-button>
                <el-button 
                  link type="info" 
                  size="small" 
                  @click="handleViewAlertDetails(row)"
                >详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="alertHistory.length === 0" class="empty-placeholder">
            暂无历史告警记录
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="告警效能分析" name="analytics">
        <div class="tab-content analytics-view">
          <el-row :gutter="20" class="stat-cards">
            <el-col :span="6">
              <el-card shadow="never" class="stat-card">
                <template #header>总告警数</template>
                <div class="stat-value">{{ alertStats.total }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="stat-card critical">
                <template #header>待处理 (Critical)</template>
                <div class="stat-value">{{ alertStats.criticalUnprocessed }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="stat-card success">
                <template #header>已解决率</template>
                <div class="stat-value">{{ alertStats.resolvedRate }}%</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="stat-card">
                <template #header>平均处理时长</template>
                <div class="stat-value">12.5m</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="charts-row">
            <el-col :span="12">
              <div ref="levelChartRef" class="analytics-chart"></div>
            </el-col>
            <el-col :span="12">
              <div ref="statusChartRef" class="analytics-chart"></div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="操作审计日志" name="audit">
        <div class="tab-content">
          <div class="toolbar audit-toolbar">
            <el-input v-model="auditSearch.username" placeholder="操作人" style="width: 140px; margin-right: 10px" />
            <el-select v-model="auditSearch.action" placeholder="操作类型" clearable style="width: 140px; margin-right: 10px">
              <el-option label="系统登录" value="LOGIN" />
              <el-option label="规则变更" value="RULE_CHANGE" />
              <el-option label="权限调整" value="PERM_CHANGE" />
              <el-option label="数据导出" value="DATA_EXPORT" />
            </el-select>
            <el-date-picker
              v-model="auditSearch.timeRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
              style="margin-right: 10px"
              value-format="x"
            />
            <el-button type="primary" @click="fetchAuditLogs">搜索</el-button>
          </div>
          
          <el-table :data="auditLogs" style="width: 100%" class="custom-table" header-row-class-name="table-header">
            <el-table-column prop="timestamp" label="操作时间" width="180">
              <template #default="{ row }">
                {{ new Date(row.timestamp).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="username" label="执行人" width="150" />
            <el-table-column prop="action" label="动作" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.action }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target" label="操作对象" width="180" />
            <el-table-column prop="details" label="变更详情" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 用户权限配置弹窗 -->
    <el-dialog
      v-model="userDialogVisible"
      title="用户权限策略配置"
      width="550px"
      destroy-on-close
    >
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>
        <el-form-item label="系统角色">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="Super Admin" value="Super Admin" />
            <el-option label="Operator" value="Operator" />
            <el-option label="Viewer" value="Viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限集">
          <el-checkbox-group v-model="userForm.permissions">
            <el-checkbox label="VIEW_DASHBOARD">大盘查看</el-checkbox>
            <el-checkbox label="EDIT_RULES">规则编辑</el-checkbox>
            <el-checkbox label="AUDIT_LOGS">审计查看</el-checkbox>
            <el-checkbox label="SENSITIVE_DATA">敏感脱敏</el-checkbox>
            <el-checkbox label="API_ACCESS">API 访问</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="userSubmitLoading" @click="submitUserForm">保存配置</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from 'vue'
import { Plus, User, Delete } from '@element-plus/icons-vue'
import { getRules, createRule, updateRule, deleteRule, type Rule } from '../api/rules'
import { getUsers, updateUser, type User as RbacUser } from '../api/rbac'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { db, type AlertEntry } from '../db'
import * as echarts from 'echarts'

const activeTab = ref('rules')

const rules = ref<Rule[]>([])
const users = ref<RbacUser[]>([])
const alertHistory = ref<AlertEntry[]>([])
const auditLogs = ref<any[]>([])
const loading = ref(false)

const auditSearch = reactive({
  username: '',
  action: '',
  timeRange: null as any
})

// Analytics
const levelChartRef = ref<HTMLElement>()
const statusChartRef = ref<HTMLElement>()
let levelChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null

const alertStats = reactive({
  total: 0,
  criticalUnprocessed: 0,
  resolvedRate: 0
})

// 规则弹窗相关
const ruleDialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<Rule>({
  name: '',
  condition: '',
  level: 'INFO',
  active: true,
  webhook: ''
})

// 用户权限相关
const userDialogVisible = ref(false)
const userSubmitLoading = ref(false)
const userForm = reactive<RbacUser>({
  username: '',
  role: '',
  permissions: [],
  lastLogin: ''
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  condition: [{ required: true, message: '请输入触发逻辑', trigger: 'blur' }],
  level: [{ required: true, message: '请选择报警级别', trigger: 'change' }]
}

onMounted(async () => {
  await fetchData()
})

const fetchData = async () => {
  loading.value = true
  try {
    const rulesData = await getRules()
    rules.value = rulesData
  } catch (e) {
    console.warn('[API Fallback] Using mock rules data')
    rules.value = [
      { id: 1, name: '高频报错拦截', condition: 'ERROR_COUNT > 100 in 1m', level: 'CRITICAL', active: true },
      { id: 2, name: '接口响应超时', condition: 'RESPONSE_TIME > 500ms persist 3 times', level: 'WARNING', active: true },
      { id: 3, name: 'CPU 负载过高', condition: 'SYSTEM_CPU > 90% in 5m', level: 'CRITICAL', active: false },
    ]
  }

  try {
    const usersData = await getUsers()
    users.value = usersData
  } catch (e) {
    console.warn('[API Fallback] Using mock users data')
    users.value = [
      { id: 1, username: 'admin@lumen.io', role: 'Super Admin', permissions: ['ALL_ACCESS', 'AUDIT_LOGS', 'SENSITIVE_DATA'], lastLogin: '2026-04-25 10:23' },
      { id: 2, username: 'dev_ops@lumen.io', role: 'Operator', permissions: ['VIEW_DASHBOARD', 'EDIT_RULES', 'API_ACCESS'], lastLogin: '2026-04-24 18:05' },
      { id: 3, username: 'guest_user', role: 'Viewer', permissions: ['VIEW_DASHBOARD'], lastLogin: '2026-04-22 09:12' },
    ]
  }
  loading.value = false
}

// 规则操作
const handleAddRule = () => {
  isEdit.value = false
  Object.assign(ruleForm, { id: undefined, name: '', condition: '', level: 'INFO', active: true, webhook: '' })
  ruleDialogVisible.value = true
}

const handleEditRule = (row: Rule) => {
  isEdit.value = true
  Object.assign(ruleForm, { ...row })
  ruleDialogVisible.value = true
}

const handleDeleteRule = (row: Rule) => {
  ElMessageBox.confirm(`确认删除规则 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRule(row.id!)
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
      rules.value = rules.value.filter(r => r.id !== row.id)
      ElMessage.success('本地删除成功 (Mock 模式)')
    }
  })
}

const handleToggleStatus = async (row: Rule, val: boolean) => {
  try {
    await updateRule(row.id!, { active: val })
    ElMessage.success(`${val ? '已启用' : '已停用'} 规则: ${row.name}`)
  } catch (e) {
    ElMessage.success(`状态已切换 (Mock 模式)`)
  }
}

const submitRuleForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateRule(ruleForm.id!, ruleForm)
          ElMessage.success('更新成功')
        } else {
          await createRule(ruleForm)
          ElMessage.success('创建成功')
        }
        ruleDialogVisible.value = false
        fetchData()
      } catch (e) {
        if (isEdit.value) {
          const idx = rules.value.findIndex(r => r.id === ruleForm.id)
          if (idx !== -1) rules.value[idx] = { ...ruleForm }
          ElMessage.success('本地更新成功 (Mock 模式)')
        } else {
          rules.value.push({ ...ruleForm, id: Date.now() })
          ElMessage.success('本地创建成功 (Mock 模式)')
        }
        ruleDialogVisible.value = false
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 用户 RBAC 操作
const handleConfigUser = (row: RbacUser) => {
  Object.assign(userForm, { ...row, permissions: [...row.permissions] })
  userDialogVisible.value = true
}

const submitUserForm = async () => {
  userSubmitLoading.value = true
  try {
    await updateUser(userForm.id!, userForm)
    ElMessage.success('权限策略更新成功')
    userDialogVisible.value = false
    fetchData()
  } catch (e) {
    // Mock fallback
    const idx = users.value.findIndex(u => u.id === userForm.id)
    if (idx !== -1) users.value[idx] = { ...userForm }
    ElMessage.success('本地权限更新成功 (Mock 模式)')
    userDialogVisible.value = false
  } finally {
    userSubmitLoading.value = false
  }
}

// 历史告警逻辑
const fetchAlerts = async () => {
  alertHistory.value = await db.alerts.orderBy('unixTimestamp').reverse().toArray()
}

const handleClearAlerts = async () => {
  try {
    await ElMessageBox.confirm('确认清空所有历史告警记录吗？', '警告', { type: 'warning' })
    await db.alerts.clear()
    alertHistory.value = []
    ElMessage.success('已清空历史记录')
  } catch (e) {
    // Cancelled
  }
}

const handleUpdateAlertStatus = async (row: AlertEntry, status: 'CLAIMED' | 'RESOLVED') => {
  try {
    await db.alerts.update(row.id!, { status })
    ElMessage.success(`告警已${status === 'CLAIMED' ? '认领' : '解决'}`)
    fetchAlerts()
  } catch (e) {
    ElMessage.error('更新状态失败')
  }
}

const handleViewAlertDetails = (row: AlertEntry) => {
  ElMessageBox.alert(row.message, `告警详情: ${row.title}`, {
    confirmButtonText: '确定',
    type: row.level === 'CRITICAL' ? 'error' : 'warning'
  })
}

const getStatusType = (status: string) => {
  if (status === 'RESOLVED') return 'success'
  if (status === 'CLAIMED') return 'warning'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'RESOLVED') return '已解决'
  if (status === 'CLAIMED') return '处理中'
  return '未处理'
}

const fetchAuditLogs = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  let query = db.auditLogs.where('tenantId').equals(user.tenantId).reverse()
  
  const results = await query.filter(log => {
    if (auditSearch.username && !log.username.includes(auditSearch.username)) return false
    if (auditSearch.action && log.action !== auditSearch.action) return false
    if (auditSearch.timeRange) {
      if (log.timestamp < auditSearch.timeRange[0]) return false
      if (log.timestamp > auditSearch.timeRange[1]) return false
    }
    return true
  }).toArray()
  
  auditLogs.value = results
}

watch(activeTab, (val) => {
  if (val === 'history') {
    fetchAlerts()
  } else if (val === 'analytics') {
    nextTick(() => {
      initAnalyticsCharts()
    })
  } else if (val === 'audit') {
    fetchAuditLogs()
  }
})

// 告警效能分析逻辑
const fetchAlertStats = async () => {
  const allAlerts = await db.alerts.toArray()
  alertStats.total = allAlerts.length
  alertStats.criticalUnprocessed = allAlerts.filter(a => a.level === 'CRITICAL' && a.status === 'UNPROCESSED').length
  const resolvedCount = allAlerts.filter(a => a.status === 'RESOLVED').length
  alertStats.resolvedRate = allAlerts.length > 0 ? Math.round((resolvedCount / allAlerts.length) * 100) : 0

  const levels = { CRITICAL: 0, WARNING: 0, INFO: 0 }
  const statuses = { UNPROCESSED: 0, CLAIMED: 0, RESOLVED: 0 }
  allAlerts.forEach(a => {
    levels[a.level]++
    statuses[a.status]++
  })
  updateCharts(levels, statuses)
}

const updateCharts = (levels: any, statuses: any) => {
  if (!levelChart || !statusChart) return
  
  const commonToolbox = {
    feature: {
      saveAsImage: { 
        show: true, 
        title: '下载',
        pixelRatio: 2
      }
    },
    right: 10,
    top: 0
  };

  levelChart.setOption({
    title: { text: '告警级别分布', left: 'center', textStyle: { color: '#888', fontSize: 12 } },
    tooltip: { trigger: 'item' },
    toolbox: commonToolbox,
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: levels.CRITICAL, name: 'CRITICAL', itemStyle: { color: '#f56c6c' } },
        { value: levels.WARNING, name: 'WARNING', itemStyle: { color: '#e6a23c' } },
        { value: levels.INFO, name: 'INFO', itemStyle: { color: '#909399' } }
      ]
    }]
  })
  statusChart.setOption({
    title: { text: '处理状态分布', left: 'center', textStyle: { color: '#888', fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    toolbox: commonToolbox,
    xAxis: { type: 'category', data: ['未处理', '处理中', '已解决'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        { value: statuses.UNPROCESSED, itemStyle: { color: '#909399' } },
        { value: statuses.CLAIMED, itemStyle: { color: '#e6a23c' } },
        { value: statuses.RESOLVED, itemStyle: { color: '#67c23a' } }
      ]
    }]
  })
}

const initAnalyticsCharts = () => {
  if (levelChartRef.value) levelChart = echarts.init(levelChartRef.value)
  if (statusChartRef.value) statusChart = echarts.init(statusChartRef.value)
  fetchAlertStats()
}

const getRoleType = (role: string) => {
  if (role === 'Super Admin') return 'danger'
  if (role === 'Operator') return 'warning'
  return 'info'
}
</script>

<style scoped>
.rules-roles {
  color: var(--el-text-color-primary);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header-section {
  margin-bottom: 20px;
}
.custom-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.el-tabs__content) {
  flex: 1;
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  padding: 24px;
  margin-top: 10px;
}
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
:deep(.el-tabs__active-bar) {
  height: 3px !important;
  border-radius: 3px;
}
.toolbar {
  margin-bottom: 25px;
}
.custom-table {
  --el-table-border-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--el-fill-color-light);
}
:deep(.table-header th) {
  background-color: var(--el-fill-color-light) !important;
  color: var(--el-text-color-primary);
  border-bottom: none;
}
:deep(.table-header th:first-child) {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}
:deep(.table-header th:last-child) {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}
:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.perm-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.perm-tag {
  background-color: var(--el-fill-color-darker);
  border-color: var(--el-border-color);
  color: var(--el-text-color-secondary);
}
.empty-placeholder {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

/* Analytics Styles */
.analytics-view {
  padding: 10px;
}
.stat-cards {
  margin-bottom: 25px;
}
.stat-card {
  text-align: center;
  border-radius: 12px;
}
.stat-card.critical .stat-value {
  color: var(--el-color-danger);
}
.stat-card.success .stat-value {
  color: var(--el-color-success);
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  margin-top: 10px;
}
.analytics-chart {
  height: 350px;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
}
</style>
