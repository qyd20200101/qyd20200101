import Database from 'better-sqlite3'
import { join } from 'pathe'

let _db: any = null

export function useDb() {
  if (_db) return _db

  const dbPath = join(process.cwd(), '.data', 'my-blog.db')
  _db = new Database(dbPath)

  // 初始化文章表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT,
      category TEXT,
      theme TEXT,
      tags TEXT,
      description TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )
  `)

  // 初始化统计表（用于统一记录本地和数据库文章的浏览量）
  _db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      slug TEXT PRIMARY KEY,
      views INTEGER DEFAULT 0
    )
  `)

  return _db
}
