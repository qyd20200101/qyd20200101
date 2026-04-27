import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-04-26',
  app: {
    head: {
      title: '刀刀 的技术博客',
      meta: [
        { name: 'description', content: '个人技术博客，记录前端学习、JS 总结与项目复盘' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  modules: [
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/tailwindcss'
  ],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'github-dark',
          langs: ['js', 'ts', 'vue', 'css', 'html', 'bash', 'json']
        },
        toc: {
          depth: 3,
          searchDepth: 3
        }
      }
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    allowedIps: process.env.ALLOWED_IPS || ''
  },
  devtools: {
    enabled: false
  }
})
