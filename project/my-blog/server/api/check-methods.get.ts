export default defineEventHandler(async (event) => {
  const query = queryCollection(event, 'blog')
  return {
    methods: Object.keys(Object.getPrototypeOf(query)),
    queryType: typeof query
  }
})
