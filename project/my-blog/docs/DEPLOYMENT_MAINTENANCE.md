# 部署与维护文档 (Deployment & Maintenance)

## 1. 部署方案

### 1.1 静态部署 (SSG)
适用于文章更新不频繁的情况，安全性最高。
1. 执行生成：`pnpm generate`
2. 将 `.output/public` 目录下的内容上传至静态托管服务（如 GitHub Pages, Vercel, Netlify）。

### 1.2 SSR 部署 (Node.js)
适用于需要动态 API 或实时数据（如评论、搜索）的情况。
1. 构建：`pnpm build`
2. 运行：`node .output/server/index.mjs`
3. 推荐使用 PM2 进行进程管理：
   ```bash
   pm2 start .output/server/index.mjs --name my-blog
   ```

### 1.3 容器化部署 (Docker)
1. 编写 Dockerfile (项目根目录已有或需新建)。
2. 构建镜像：`docker build -t my-blog .`
3. 运行容器：`docker run -p 3000:3000 my-blog`

## 2. 环境变量配置
在生产环境中，需设置以下变量：
- `DATABASE_URL`: SQLite 数据库路径。
- `JWT_SECRET`: 用于生成令牌的随机字符串。
- `NUXT_PUBLIC_SITE_URL`: 博客的公网访问地址。

## 3. 定期维护任务

### 3.1 数据备份
- **SQLite**: 定期备份 `.data/database.sqlite` 文件。
- **Markdown**: 所有的 Markdown 文件应通过 Git 托管在远程仓库（如 GitHub）。

### 3.2 依赖更新
- 每季度执行一次 `pnpm update` 以修复潜在的安全漏洞。
- 关注 Nuxt 和相关插件的重大版本更新，并阅读迁移指南。

### 3.3 性能监控
- 使用 Lighthouse 定期检查页面评分。
- 观察服务器日志，排查 500 错误。

## 4. 故障排除
- **启动失败**: 检查 `node_modules` 是否安装完整，环境变量是否缺失。
- **文章不显示**: 检查 `content/` 下文件格式是否正确，Nuxt Content 缓存是否需要清理。
- **登录失效**: 检查系统时间是否同步，`JWT_SECRET` 是否被意外更改。
