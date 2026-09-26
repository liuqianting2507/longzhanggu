import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { seedIfEmpty } from './services/seed.js'
import './assets/main.css'

async function bootstrap() {
  // 第一版用 localStorage，首次打开写入演示数据
  if ((import.meta.env.VITE_DATA_SOURCE || 'local') === 'local') {
    await seedIfEmpty()
  }
  createApp(App).use(createPinia()).use(router).mount('#app')
}

bootstrap()
