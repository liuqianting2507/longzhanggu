<script setup>
import { watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHealthStore } from '@/stores/health.js'
import { useAuthStore } from '@/stores/auth.js'
import { dataSourceName } from '@/services/db.js'

const store = useHealthStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// 登录页不显示顶栏
const showChrome = computed(() => route.meta.public !== true)

// 登录后（local 模式下即启动时）加载数据
watch(
  () => auth.signedIn,
  (ok) => { if (ok) store.loadAll() },
  { immediate: true },
)

async function handleSignOut() {
  await auth.signOut()
  store.reset()
  router.replace('/login')
}
</script>

<template>
  <header v-if="showChrome" class="topbar">
    <div class="topbar-inner">
      <RouterLink to="/dashboard" class="brand">
        龙掌沽<span>客户健康档案管理系统</span>
      </RouterLink>
      <nav>
        <RouterLink to="/dashboard">概览</RouterLink>
        <RouterLink to="/check-in">每日打卡</RouterLink>
        <RouterLink to="/clients">客户档案</RouterLink>
      </nav>
      <div class="account">
        <span class="tag tag-muted small" :title="`当前数据源：${dataSourceName}`">
          {{ dataSourceName === 'local' ? '本地存储' : '云端' }}
        </span>
        <template v-if="auth.enabled && auth.signedIn">
          <span class="small muted">{{ auth.email }}</span>
          <button class="small" @click="handleSignOut">退出</button>
        </template>
      </div>
    </div>
  </header>

  <main>
    <p v-if="showChrome && store.error" class="page error-banner">{{ store.error }}</p>
    <RouterView />
  </main>
</template>

<style scoped>
.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.brand {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
}
.brand span {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 8px;
}
nav {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-wrap: wrap;
}
nav a {
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--text-muted);
}
nav a:hover { background: var(--bg); }
nav a.router-link-active {
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 500;
}
.account { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.account button { padding: 4px 10px; font-size: 12px; }
.error-banner {
  background: var(--danger-soft);
  color: var(--danger);
  border-radius: var(--radius);
  padding: 14px 16px;
}
</style>
