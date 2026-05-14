import { queryBlogCollection } from '../utils/content'

export default defineEventHandler(async (event) => {
  const query = queryBlogCollection(event)
  return {
    methods: Object.keys(Object.getPrototypeOf(query)),
    queryType: typeof query
  }
})
