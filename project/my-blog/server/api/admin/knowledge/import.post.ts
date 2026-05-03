import fs from 'node:fs/promises'
import { join, extname, basename } from 'pathe'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const RAW_DIR = join(process.cwd(), 'knowledge', 'raw')
  const PARSED_DIR = join(process.cwd(), 'knowledge', 'parsed')
  
  const db = useKnowledgeDb()
  const categories = ['books', 'notes', 'articles', 'imports']
  const results: any[] = []

  for (const cat of categories) {
    const catDir = join(RAW_DIR, cat)
    const targetDir = join(PARSED_DIR, cat)
    
    try {
      const files = await fs.readdir(catDir)
      for (const file of files) {
        if (file.startsWith('.')) continue

        const filePath = join(catDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          const content = await fs.readFile(filePath, 'utf-8')
          const title = basename(file, extname(file))
          
          await fs.mkdir(targetDir, { recursive: true })
          const parsedPath = join(targetDir, file)
          await fs.writeFile(parsedPath, content, 'utf-8')

          const existing = db.prepare('SELECT id FROM documents WHERE source_path = ?').get(filePath)
          
          if (!existing) {
            const info = db.prepare(`
              INSERT INTO documents (title, type, source_path, tags)
              VALUES (?, ?, ?, ?)
            `).run(title, cat, filePath, '')

            // 4. 创建初始分块以供检索
            db.prepare(`
              INSERT INTO chunks (doc_id, chunk_index, file_path, summary)
              VALUES (?, ?, ?, ?)
            `).run(info.lastInsertRowid, 0, filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''), content.substring(0, 500))

            results.push({ title, status: 'imported' })
          } else {
            results.push({ title, status: 'skipped' })
          }
        }
      }
    } catch (e) {
      continue
    }
  }

  const imported = results.filter(r => r.status === 'imported').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return {
    success: true,
    total: results.length,
    imported,
    skipped,
    results
  }
})
