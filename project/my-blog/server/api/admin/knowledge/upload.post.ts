import fs from 'node:fs/promises'
import { join, extname, basename } from 'pathe'
import { defineEventHandler, readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  const RAW_DIR = join(process.cwd(), 'knowledge', 'raw', 'imports')
  const PARSED_DIR = join(process.cwd(), 'knowledge', 'parsed', 'imports')
  const db = useKnowledgeDb()
  
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const results: any[] = []

  for (const part of formData) {
    if (part.name === 'file' && part.filename) {
      const filename = part.filename
      const content = part.data.toString('utf-8')
      const title = basename(filename, extname(filename))
      
      // 1. 保存到 raw/imports
      await fs.mkdir(RAW_DIR, { recursive: true })
      const rawPath = join(RAW_DIR, filename)
      await fs.writeFile(rawPath, content, 'utf-8')

      // 2. 解析并保存到 parsed/imports
      await fs.mkdir(PARSED_DIR, { recursive: true })
      const parsedPath = join(PARSED_DIR, filename)
      await fs.writeFile(parsedPath, content, 'utf-8')

      // 3. 索引到数据库
      const existing = db.prepare('SELECT id FROM documents WHERE source_path = ?').get(rawPath)
      
      if (!existing) {
        const info = db.prepare(`
          INSERT INTO documents (title, type, source_path, tags)
          VALUES (?, ?, ?, ?)
        `).run(title, 'imports', rawPath, '')
        
        // 4. 创建初始分块以供检索
        db.prepare(`
          INSERT INTO chunks (doc_id, chunk_index, file_path, summary)
          VALUES (?, ?, ?, ?)
        `).run(info.lastInsertRowid, 0, join('knowledge', 'raw', 'imports', filename), content.substring(0, 500))

        results.push({ title, status: 'imported' })
      } else {
        results.push({ title, status: 'updated' })
      }
    }
  }

  return {
    success: true,
    count: results.length,
    results
  }
})
