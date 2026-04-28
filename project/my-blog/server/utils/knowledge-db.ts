import Database from 'better-sqlite3'
import { join } from 'pathe'

let _kdb: any = null

export function useKnowledgeDb() {
  if (_kdb) return _kdb

  const dbPath = join(process.cwd(), 'knowledge', 'sqlite', 'knowledge.db')
  _kdb = new Database(dbPath)

  // 1. 文档表
  _kdb.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT, 
      source_path TEXT,
      tags TEXT,
      metadata TEXT, 
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 检查并增加新字段 (迁移逻辑)
  const columns = _kdb.prepare("PRAGMA table_info(documents)").all()
  const hasShortSummary = columns.some((c: any) => c.name === 'short_summary')
  if (!hasShortSummary) {
    _kdb.exec("ALTER TABLE documents ADD COLUMN short_summary TEXT")
    _kdb.exec("ALTER TABLE documents ADD COLUMN keywords TEXT")
    console.log(" ℹ️ 数据库已成功升级：增加了摘要和关键词字段")
  }

  // 2. 章节摘要表 (新增：用于跨章节快速引用)
  _kdb.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      title TEXT NOT NULL,
      summary TEXT,
      FOREIGN KEY (doc_id) REFERENCES documents(id)
    )
  `)

  // 3. 知识分块表
  _kdb.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      chunk_index INTEGER,
      file_path TEXT NOT NULL, 
      summary TEXT, 
      tags TEXT,
      has_code INTEGER DEFAULT 0,    
      needs_context INTEGER DEFAULT 0, 
      chunk_title TEXT,                -- 新增：分块标题
      FOREIGN KEY (doc_id) REFERENCES documents(id)
    )
  `)

  // 检查并增加新字段 (chunks 表迁移逻辑)
  const chunkColumns = _kdb.prepare("PRAGMA table_info(chunks)").all()
  if (!chunkColumns.some((c: any) => c.name === 'has_code')) {
    _kdb.exec("ALTER TABLE chunks ADD COLUMN has_code INTEGER DEFAULT 0")
    _kdb.exec("ALTER TABLE chunks ADD COLUMN needs_context INTEGER DEFAULT 0")
  }
  if (!chunkColumns.some((c: any) => c.name === 'chunk_title')) {
    _kdb.exec("ALTER TABLE chunks ADD COLUMN chunk_title TEXT")
    console.log(" ℹ️ 数据库已成功升级：增加了分块标题字段")
  }

  // 4. 书籍目录表 (用于精益索引)
  _kdb.exec(`
    CREATE TABLE IF NOT EXISTS book_toc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      chapter_title TEXT NOT NULL,
      start_page INTEGER,
      end_page INTEGER,
      priority TEXT DEFAULT 'P2', 
      summary TEXT,
      keywords TEXT,
      is_parsed INTEGER DEFAULT 0,
      FOREIGN KEY (doc_id) REFERENCES documents(id)
    )
  `)

  return _kdb
}
