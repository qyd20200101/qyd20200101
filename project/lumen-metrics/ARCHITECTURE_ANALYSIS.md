# LumenMetrics 架构分析与实施计划

根据《LumenMetrics 需求与系统架构文档》，本项目定位为一款全链路 SaaS 监控平台，其核心技术挑战在于**高频海量数据的实时渲染与本地存储**。为了满足这些需求，系统将采用 Vue 3 + Vite 的现代化前端基础设施，结合 Web Workers、IndexedDB (Dexie.js)、Canvas 等高性能 API 进行突破。

## 一、 系统架构模型分析

整个前端架构将分为五层（Five-Layer Architecture），各司其职，保证在高并发数据冲击下的 UI 流畅度：

### 1. 通信层 (Transport Layer)
- **技术栈**：WebSocket + Axios。
- **职责**：
  - WebSocket 维持与服务端的全双工长链接，承接 `100~500` 条/秒的高频指标数据与日志推送。
  - Axios 负责普通的 CRUD 接口，如规则引擎配置、用户权限与审计查询等。

### 2. 调度计算层 (Orchestrator Layer - Web Worker)
- **技术栈**：原生 Web Workers。
- **职责**：
  - 核心**性能引擎**。所有的重型计算都将脱离主线程（Main Thread）。
  - 对 WebSocket 推送来的脏数据进行清洗、格式化。
  - 执行实时流的内存排序、统计聚合（如 QPS 计算）。
  - 执行日志的全文检索和多维过滤（利用 Worker 中并行的搜索逻辑）。

### 3. 持久化层 (Persistence Layer - IndexedDB)
- **技术栈**：Dexie.js (IndexedDB 的封装)。
- **职责**：
  - 作为前端的本地数据库，存储多达百万条的历史日志与监控切片数据，防止浏览器内存溢出（OOM）。
  - 利用索引（Indexes）快速查询历史数据，配合日志探索器中的时间、级别和关键字检索。

### 4. 状态层 (State Layer - Pinia)
- **技术栈**：Pinia (Vue 3 官方状态管理)。
- **职责**：
  - 存储全局共享状态：如登录状态（RBAC 信息）、实时指标（短期的滑动窗口快照）和全局 UI 配置项（主题等）。

### 5. 表现层 (View Layer - Vue 3)
- **技术栈**：Vue 3 (Composition API) + Element Plus + ECharts + Canvas。
- **职责**：
  - **动态图表**：ECharts 用于绘制常规图表，利用 `appendData` 和补间动画实现实时 QPS/CPU 曲线。
  - **超密散点**：当遇到极致高密度监控点位时，通过原生 Canvas 或 ECharts 的 WebGL 版本进行渲染。
  - **虚拟列表**：针对百万量级的“日志探索器”，实现带有动态高度支持的 Virtual Scroll 列表，只渲染可视区域的 DOM 节点，大幅提升性能。

## 二、 核心难点实现思路

### 1. 实时流的背压控制 (Backpressure)
面对超过 500 Msg/s 的推送速度，前端直接渲染必定卡死主线程。必须在 Web Worker 层实现**背压队列**：
- 以固定帧率（如 60fps, 约 16ms）向主线程同步聚合后的批量数据（Batching）。
- 当缓冲区积压过多时，可以主动降低图表的重绘帧率，或者进行数据抽样降级（Downsampling）。

### 2. 规则引擎与沙箱执行
- 在前端配置响应时间等条件组合，转换为逻辑表达式（AST），在后台或 Worker 内利用安全的解析引擎执行对比，一旦触发阈值立刻在 UI 弹窗报警。

## 三、 技术栈选型确认

- 核心框架：**Vue 3 (Composition API)** + **TypeScript 5.x**
- 构建系统：**Vite 6.x**
- 路由与状态：**Vue Router 4** + **Pinia**
- 存储与计算：**Dexie.js** + **Web Worker API**
- 视觉与组件：**Element Plus** + **ECharts 5**

## 四、 后续实施计划

1. **项目基础搭建 (已完成)**：初始化 Vite Vue-TS 环境，安装各类依赖。
2. **基础架构实现**：
   - 配置 Element Plus 主题与样式重置。
   - 建立 Pinia Store 模块，配置 Vue Router 路由系统。
3. **分层模块开发**：
   - 封装 Dexie 本地数据库实例与日志表结构。
   - 编写 Web Worker 入口文件，实现与主线程的 PostMessage 通信封装。
4. **核心业务组件开发**：
   - 实时监控大盘（ECharts 组件封装 + WebSocket 模拟推送）。
   - 海量日志探索器（Virtual Scroller 开发，结合 Dexie 查询引擎）。
   - 规则配置与权限控制界面。
