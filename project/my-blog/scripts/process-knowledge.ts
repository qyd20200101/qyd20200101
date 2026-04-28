import fs from 'node:fs/promises'
import { join, relative, extname, basename } from 'pathe'
import { useKnowledgeDb } from '../server/utils/knowledge-db'

const RAW_DIR = join(process.cwd(), 'knowledge', 'raw')
const PARSED_DIR = join(process.cwd(), 'knowledge', 'parsed')

async function processFiles() {
  const db = useKnowledgeDb()
  const categories = ['books', 'notes', 'articles', 'imports']

  console.log('🚀 开始解析知识库原始文件...')

  for (const cat of categories) {
    const catDir = join(RAW_DIR, cat)
    const targetDir = join(PARSED_DIR, cat)
    
    try {
      const files = await fs.readdir(catDir)
      for (const file of files) {
        if (file.startsWith('.')) continue // 跳过隐藏文件

        const filePath = join(catDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          console.log(`[${cat}] 正在处理: ${file}`)
          
          const content = await fs.readFile(filePath, 'utf-8')
          const title = basename(file, extname(file))
          
          // 1. 存入 parsed 目录
          await fs.mkdir(targetDir, { recursive: true })
          const parsedPath = join(targetDir, file)
          await fs.writeFile(parsedPath, content, 'utf-8')

          // 2. 检查数据库是否已存在该文档
          const existing = db.prepare('SELECT id FROM documents WHERE source_path = ?').get(filePath)
          
          if (!existing) {
            // 3. 写入数据库
            db.prepare(`
              INSERT INTO documents (title, type, source_path, tags)
              VALUES (?, ?, ?, ?)
            `).run(title, cat, filePath, '')
            console.log(` ✅ 已添加到数据库索引: ${title}`)
          } else {
            console.log(` ℹ️ 文档已存在，跳过索引更新`)
          }
        }
      }
    } catch (e) {
      // 目录可能为空或不存在
      continue
    }
  }
  console.log('✨ 解析完成！')
}

processFiles().catch(console.error)
