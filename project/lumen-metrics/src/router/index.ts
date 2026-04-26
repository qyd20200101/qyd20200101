import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'logs',
          component: () => import('../views/LogsExplorer.vue')
        },
        {
          path: 'rules',
          component: () => import('../views/RulesAndRoles.vue')
        },
        {
          path: 'reports',
          component: () => import('../views/Reports.vue')
        },
        {
          path: 'inspections',
          component: () => import('../views/Inspections.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    return '/login'
  } else if (to.path === '/login' && token) {
    return '/'
  }
})

export default router;
