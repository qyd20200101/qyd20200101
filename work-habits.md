# 个人工作习惯融入清单

## 每日检查清单
- [ ] 查看今日自评 `my-sass-project/docs/self-review/YYYY-MM-DD.md`
- [ ] 优先处理🟡🔴项，跳过🟢项
- [ ] 使用三件套表达：核心+代码+链路

## 文件操作规范
- [ ] 引用文件用 `[text](relative/path)` 格式
- [ ] 编辑后不重复Read验证
- [ ] 路径不确定先用Glob/Grep确认

## 效率规则
- [ ] 独立操作并行执行
- [ ] 大范围探索用子代理
- [ ] Windows环境用PowerShell

## 质量控制
- [ ] memory仅作历史参考
- [ ] 代码引用前验证存在
- [ ] 概念混淆零容忍
- [ ] 不确定时直接说不确定

## 常用命令速查
```powershell
# Vue前端开发
pnpm --filter vue-app dev

# React前端开发  
pnpm --filter react-app dev

# 后端服务
pnpm --filter @my-sass/server dev

# 核心包测试
pnpm --filter @my-sass/core test:watch

# 全量构建
pnpm -r build
```

## 关键路径映射
| 内容 | 路径 |
|---|---|
| 每日学习日报 | `2026/MM_DD学习日报.md` |
| 每日自评 | `my-sass-project/docs/self-review/YYYY-MM-DD.md` |
| Vue3源码笔记 | `js/day30-js底层/Vue3从项目学源码/` |
| 手写ref实现 | `js/day30-js底层/Vue3从项目学源码/Mini_ref.ts` |
| 学习指南 | `docs/study-guide/` |
| 低代码实战 | `my-sass-project/apps/vue-app/` |
