export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = useDb()
  const rows = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC').all()

  return rows.map((row: any) => ({
    ...row,
    tags: row.tags ? row.tags.split(',') : []
  }))
})
