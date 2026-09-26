import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '概览' },
  },
  {
    path: '/check-in',
    name: 'check-in',
    component: () => import('@/views/CheckInView.vue'),
    meta: { title: '每日打卡' },
  },
  {
    path: '/clients',
    name: 'clients',
    component: () => import('@/views/ClientListView.vue'),
    meta: { title: '客户档案' },
  },
  {
    path: '/clients/new',
    name: 'client-new',
    component: () => import('@/views/ClientFormView.vue'),
    meta: { title: '新建档案' },
  },
  {
    path: '/clients/:id',
    name: 'client-detail',
    component: () => import('@/views/ClientDetailView.vue'),
    meta: { title: '档案详情' },
  },
  {
    path: '/clients/:id/edit',
    name: 'client-edit',
    component: () => import('@/views/ClientFormView.vue'),
    meta: { title: '编辑档案' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  // local 数据源不启用登录，signedIn 恒为 true
  if (!to.meta.public && !auth.signedIn) {
    return { path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.signedIn && auth.enabled) {
    return { path: '/dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 龙掌沽健康档案` : '龙掌沽健康档案'
})

export default router
