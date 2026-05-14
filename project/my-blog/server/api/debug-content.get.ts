import { queryBlogCollection } from '../utils/content'

export default defineEventHandler(async (event) => {
  const blog = await queryBlogCollection(event).all()
  return (blog as any[]).map((p: any) => ({ path: p.path, stem: p.stem }))
})
