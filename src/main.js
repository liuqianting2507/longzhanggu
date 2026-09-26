import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { dataSourceName } from './services/db.js'
import { useAuthStore } from './stores/auth.js'
import './assets/main.css'

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())

  // 先等 Firebase 恢复本地会话，再挂载路由，避免刷新时闪一下登录页
  const auth = useAuthStore()
  await auth.init()

  if (dataSourceName === 'local') {
    const { seedIfEmpty } = await import('./services/seed.js')
    await seedIfEmpty()
  }

  app.use(router)
  app.mount('#app')
}

bootstrap()
