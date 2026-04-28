import fs from 'node:fs/promises'
import { join } from 'pathe'
import { useKnowledgeDb } from './knowledge-db'

/**
 * 搜索知识库中的相关分块
 */
export const searchKnowledge = async (query: string, tags: string[] = []) => {
  const db = useKnowledgeDb()
  let sql = `SELECT c.id, c.file_path, c.summary, c.tags, d.title as doc_title 
             FROM chunks c 
             JOIN documents d ON c.doc_id = d.id 
             WHERE 1=1`
  const params: any[] = []

  if (query) {
    sql += ` AND (c.summary LIKE ? OR d.title LIKE ?)`
    params.push(`%${query}%`, `%${query}%`)
  }

  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      sql += ` AND (c.tags LIKE ? OR d.tags LIKE ?)`
      params.push(`%${tag}%`, `%${tag}%`)
    })
  }

  sql += ` LIMIT 10`
  
  try {
    return db.prepare(sql).all(...params)
  } catch (e: any) {
    throw new Error(`知识库搜索失败: ${e.message}`)
  }
}

/**
 * 读取具体的知识分块内容
 */
export const readKnowledgeChunk = async (chunkId: number) => {
  const db = useKnowledgeDb()
  try {
    const chunk = db.prepare('SELECT file_path FROM chunks WHERE id = ?').get(chunkId)
    if (!chunk) throw new Error('未找到该知识分块')
    
    const absolutePath = join(process.cwd(), chunk.file_path)
    return await fs.readFile(absolutePath, 'utf-8')
  } catch (e: any) {
    throw new Error(`读取知识块失败: ${e.message}`)
  }
}

/**
 * 获取文档的概览信息（摘要、章节、关键词）
 */
export const getDocumentInfo = async (docId: number) => {
  const db = useKnowledgeDb()
  try {
    const doc = db.prepare('SELECT title, short_summary, keywords FROM documents WHERE id = ?').get(docId)
    if (!doc) throw new Error('未找到该文档')
    
    const chapters = db.prepare('SELECT title, summary FROM chapters WHERE doc_id = ?').all(docId)
    
    return {
      ...doc,
      chapters
    }
  } catch (e: any) {
    throw new Error(`获取文档详情失败: ${e.message}`)
  }
}
