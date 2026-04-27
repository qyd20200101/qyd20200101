# 开发工作流文档 (Development Workflow)

## 1. 环境准备
- **Node.js**: 建议版本 v18.x 或更高。
- **包管理器**: `pnpm` (推荐) 或 `npm`。
- **IDE**: VS Code (推荐安装 Volar, Tailwind CSS IntelliSense 插件)。

## 2. 日常开发流程

### 2.1 启动项目
```bash
pnpm install
pnpm dev
```

### 2.2 写文章流程
1. 在 `content/` 目录下创建新的 `.md` 文件或子目录。
2. 填写 Frontmatter 头部信息：
   ```yaml
   ---
   title: "文章标题"
   description: "简短描述"
   date: "2024-04-27"
   category: "技术"
   tags: ["Vue", "Nuxt"]
   ---
   ```
3. 编写内容，使用预览功能实时查看效果。

### 2.3 功能开发规范
- **组件开发**: 小组件放在 `app/components/`，页面放在 `app/pages/`。
- **状态管理**: 优先使用 `useState` 或 `useCookie`。
- **API 开发**: Nitro 路由文件放在 `server/api/`。

## 3. 代码提交规范
建议使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范：
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档修改
- `style`: 代码格式修改（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化

示例：`git commit -m "feat: 增加搜索功能"`

## 4. 测试与验证
- **本地验证**: `pnpm build && pnpm preview` 模拟生产环境。
- **类型检查**: `npx nuxi typecheck` 检查 TypeScript 类型错误。
- **Lint**: 确保代码符合 ESLint/Prettier 规范。

## 5. 持续改进
- 定期更新依赖项：`pnpm update`。
- 收集用户反馈，记录在 GitHub Issues 或需求文档的“待办”项中。
