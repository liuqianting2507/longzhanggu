<script setup>
import { ref, computed } from 'vue'
import { useHealthStore } from '@/stores/health.js'
import { COLLECTIONS, GENDERS, labelOf, calcBmi } from '@/services/models.js'

const store = useHealthStore()
const keyword = ref('')
const showArchived = ref(false)

const rows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return store.clients
    .filter((c) => (showArchived.value ? true : !c.archivedAt))
    .filter((c) => {
      if (!kw) return true
      return (c.name || '').toLowerCase().includes(kw) || (c.phone || '').includes(kw)
    })
    .sort((a, b) => ((a.createdAt || '') < (b.createdAt || '') ? 1 : -1))
})

function ageOf(birthDate) {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

function recordCount(clientId) {
  return store.vitalsOf(clientId).length + store.glucoseOf(clientId).length
}

async function toggleArchive(client) {
  await store.edit(COLLECTIONS.CLIENTS, client.id, {
    archivedAt: client.archivedAt ? null : new Date().toISOString(),
  })
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h2>客户档案</h2>
      <RouterLink to="/clients/new"><button class="primary">新建档案</button></RouterLink>
    </div>

    <div class="card">
      <div class="toolbar">
        <input v-model="keyword" placeholder="搜索姓名或手机号" style="max-width: 260px" />
        <label class="checkbox">
          <input v-model="showArchived" type="checkbox" />
          显示已归档
        </label>
        <span class="muted small">共 {{ rows.length }} 人</span>
      </div>

      <p v-if="rows.length === 0" class="empty">
        没有匹配的客户。<RouterLink to="/clients/new">新建一份档案</RouterLink>
      </p>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>姓名</th><th>性别</th><th>年龄</th><th>手机号</th>
              <th>BMI</th><th>打卡记录</th><th>今日</th><th>状态</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id">
              <td><RouterLink :to="`/clients/${c.id}`">{{ c.name }}</RouterLink></td>
              <td>{{ labelOf(GENDERS, c.gender) }}</td>
              <td>{{ ageOf(c.birthDate) }}</td>
              <td>{{ c.phone || '—' }}</td>
              <td>{{ calcBmi(c.height, c.weight) ?? '—' }}</td>
              <td>{{ recordCount(c.id) }}</td>
              <td>
                <span class="tag" :class="store.checkedInToday.has(c.id) ? 'tag-ok' : 'tag-muted'">
                  {{ store.checkedInToday.has(c.id) ? '已打卡' : '未打卡' }}
                </span>
              </td>
              <td>
                <span class="tag" :class="c.archivedAt ? 'tag-muted' : 'tag-brand'">
                  {{ c.archivedAt ? '已归档' : '在管' }}
                </span>
              </td>
              <td>
                <div class="btn-row">
                  <RouterLink :to="`/clients/${c.id}/edit`"><button>编辑</button></RouterLink>
                  <button @click="toggleArchive(c)">
                    {{ c.archivedAt ? '恢复' : '归档' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}
.checkbox input { width: auto; }
</style>
