export default defineEventHandler(async () => {
  const db = useDb()
  const rows = db.prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY createdAt DESC").all()

  return rows.map((row: any) => ({
    ...row,
    tags: row.tags ? row.tags.split(',') : []
  }))
})
