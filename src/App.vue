<script setup>
import { onMounted } from 'vue'
import { useHealthStore } from '@/stores/health.js'
import { dataSourceName } from '@/services/db.js'

const store = useHealthStore()
onMounted(() => store.loadAll())
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <RouterLink to="/dashboard" class="brand">
        龙掌沽<span>客户健康档案管理系统</span>
      </RouterLink>
      <nav>
        <RouterLink to="/dashboard">概览</RouterLink>
        <RouterLink to="/check-in">每日打卡</RouterLink>
        <RouterLink to="/clients">客户档案</RouterLink>
      </nav>
      <span class="tag tag-muted small" :title="`当前数据源：${dataSourceName}`">
        {{ dataSourceName === 'local' ? '本地存储' : '云端' }}
      </span>
    </div>
  </header>

  <main>
    <p v-if="store.error" class="page error-banner">{{ store.error }}</p>
    <RouterView v-else />
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
  gap: 20px;
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
.error-banner {
  background: var(--danger-soft);
  color: var(--danger);
  border-radius: var(--radius);
  padding: 14px 16px;
}
</style>
