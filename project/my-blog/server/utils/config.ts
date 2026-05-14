/**
 * 博客全局配置 — 标签、类型、定位等元数据的单一数据源
 * 所有页面和组件从数据库动态聚合，这里只做 fallback 默认值
 */

export const BLOG_CONFIG = {
  /** 侧边栏默认展示的标签（在动态聚合无数据时使用） */
  defaultTags: ['JavaScript', 'Vue', 'Nuxt', '性能优化', '前端工程化', '项目复盘', '面试八股'] as const,

  /** 博客定位关注方向 */
  defaultFocusOptions: ['JavaScript', 'Vue', '前端工程化', '性能优化'] as const,

  /** 文章类型下拉选项 */
  typeOptions: ['JavaScript', 'Vue', 'Nuxt', '性能优化', '前端工程化', '项目复盘', '面试八股'] as const,

  /** 默认摘要文案 */
  defaultDescriptions: {
    studyNote: '今日学习重点内容汇总与核心知识点复盘，记录成长点滴。',
    dbNote: '在线数据库同步的学习日报内容简介。',
    fallback: '暂无简介。',
  },
} as const
