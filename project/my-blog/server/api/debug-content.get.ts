export default defineEventHandler(async (event) => {
  const blog = await queryCollection(event, 'blog').all()
  return blog.map(p => ({ path: p.path, stem: p.stem }))
})
