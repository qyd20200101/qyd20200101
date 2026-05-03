import { queryCollection } from '#imports'

export default defineEventHandler(async (event) => {
  const blog = await (queryCollection as any)(event, 'blog').all()
  return (blog as any[]).map((p: any) => ({ path: p.path, stem: p.stem }))
})
