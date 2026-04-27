# 技术方案文档 (Technical Solution)

## 1. 技术栈选择
- **框架**: [Nuxt 4](https://nuxt.com/) (Vue 3 生态，支持 SSR/SSG)。
- **内容引擎**: [@nuxt/content v3](https://content.nuxt.com/) (基于文件系统的 CMS，支持 Markdown)。
- **样式**: [Tailwind CSS](https://tailwindcss.com/) (原子化 CSS，高效实现响应式布局)。
- **数据库**: [SQLite (better-sqlite3)](https://github.com/WiseLibs/better-sqlite3) (本地轻量级数据库，用于存储后台管理数据)。
- **认证**: [JSON Web Token (JWT)](https://jwt.io/) (无状态身份验证)。
- **部署**: Node.js 环境或边缘计算平台 (如 Vercel/Netlify/Cloudflare Pages)。

## 2. 架构设计

### 2.1 目录结构
- `app/`: 前端代码（页面、组件、布局）。
- `server/`: 后端代码（API 接口、中间件、数据库模型）。
- `content/`: 博客文章源文件 (.md)。
- `public/`: 静态资源（图片、字体）。

### 2.2 数据模型
- **文章 (Markdown)**: 存储在 `content/` 目录下，包含 frontmatter (title, description, date, category, tags)。
- **用户/配置 (SQLite)**: 存储在 `.data/` 目录下的 SQLite 文件中，用于管理后台登录。

### 2.3 关键技术实现
- **文章渲染**: 使用 `ContentRenderer` 组件，结合 `prose` 样式实现美观的阅读效果。
- **SEO 实现**: 利用 Nuxt 的 `useSeoMeta` 动态设置每篇文章的标题、描述和 Open Graph 标签。
- **后台安全**: 使用自定义 Nitro 中间件校验 JWT 令牌。

## 3. 性能优化方案
- **资源压缩**: 使用 `@nuxt/image` 进行图片自动优化。
- **预渲染**: 对于静态文章页面使用 `nuxt generate` 预生成 HTML。
- **缓存**: API 接口使用 `swr` (stale-while-revalidate) 缓存策略。

## 4. 安全性考虑
- 输入校验：所有 API 接口均需对输入参数进行合法性检查。
- 环境变量：敏感信息（如 JWT Secret）存储在 `.env` 文件中，严禁提交到代码仓库。
