import { queryCollection } from '#imports'

/**
 * Nuxt Content v3 服务端类型安全的 queryCollection 封装
 *
 * @nuxt/content v3 的 queryCollection 在服务端缺少完整类型声明，
 * 通过此封装将 as any 集中在一处，调用方无需重复绕过类型检查。
 */
export function queryBlogCollection(event: any) {
  return (queryCollection as any)(event, 'blog') as ReturnType<typeof queryCollection>
}
