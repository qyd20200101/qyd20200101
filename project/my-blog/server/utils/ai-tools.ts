import fs from 'node:fs/promises'
import { join } from 'pathe'
import { useDb } from './sqlite'

const BLOG_CONTENT_DIR = join(process.cwd(), 'content', 'blog')

/**
 * 1. 文件系统工具 (File System Tools)
 */

// 读取文章源文件
export const readBlogFile = async (filename: string) => {
  const filePath = join(BLOG_CONTENT_DIR, filename.endsWith('.md') ? filename : `${filename}.md`)
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    throw new Error(`无法读取文件: ${filename}`)
  }
}

// 写入文章源文件
export const writeBlogFile = async (filename: string, content: string) => {
  const filePath = join(BLOG_CONTENT_DIR, filename.endsWith('.md') ? filename : `${filename}.md`)
  await fs.mkdir(BLOG_CONTENT_DIR, { recursive: true })
  await fs.writeFile(filePath, content, 'utf-8')
  return { success: true, path: filePath }
}

// 列表显示所有本地文章
export const listLocalFiles = async () => {
  try {
    const files = await fs.readdir(BLOG_CONTENT_DIR)
    return files.filter(f => f.endsWith('.md'))
  } catch (e) {
    return []
  }
}

/**
 * 2. 数据库工具 (Database Tools)
 */

// 查询数据库文章或统计
export const queryBlogDb = (sql: string, params: any[] = []) => {
  const db = useDb()
  try {
    const forbidden = ['DROP', 'DELETE', 'TRUNCATE']
    if (forbidden.some(word => sql.toUpperCase().includes(word))) {
      throw new Error('不允许执行危险的 SQL 操作')
    }
    return db.prepare(sql).all(...params)
  } catch (e: any) {
    throw new Error(`数据库查询失败: ${e.message}`)
  }
}

/**
 * 3. AI 工具描述定义 (符合 OpenAI/DeepSeek 标准格式)
 */
export const aiToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'read_blog_file',
      description: '读取本地 content/blog 目录下的 Markdown 文章内容',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: '文件名（带 .md 或不带）' }
        },
        required: ['filename']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_blog_file',
      description: '将内容写入本地 content/blog 目录下的 Markdown 文件',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: '文件名' },
          content: { type: 'string', description: '完整的 Markdown 内容（包含 frontmatter）' }
        },
        required: ['filename', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_local_files',
      description: '列出 content/blog 目录下的所有 Markdown 文件列表',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_db',
      description: '执行 SQLite 数据库查询。可用表：\n1. posts 表: id, title, slug, type, category, theme, tags, description, content, status, createdAt, updatedAt, views\n2. stats 表: slug, views\n注意：请使用 posts 表查询文章和标签。',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL 查询语句' },
          params: { type: 'array', items: { type: 'string' }, description: '查询参数列表' }
        },
        required: ['sql']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: '搜索个人知识库（书籍、笔记、摘录）。返回相关知识块的摘要和 ID。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          tags: { type: 'array', items: { type: 'string' }, description: '过滤标签' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_knowledge_chunk',
      description: '读取指定的知识库分块全文内容。使用 search_knowledge 获取的 ID。',
      parameters: {
        type: 'object',
        properties: {
          chunkId: { type: 'number', description: '知识块 ID' }
        },
        required: ['chunkId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_document_info',
      description: '获取文档的概览信息，包括短摘要、关键词和所有章节的大纲摘要。用于快速了解文档全局。',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'number', description: '文档 ID' }
        },
        required: ['docId']
      }
    }
  }
]
