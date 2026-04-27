import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string().optional(),
        date: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        toc: z.any().optional()
      })
    })
  }
})
