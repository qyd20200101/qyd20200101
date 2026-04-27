export default defineEventHandler(async () => {
  const db = useDb()
  const stats = db.prepare("SELECT slug, views FROM stats").all()
  return stats
})
