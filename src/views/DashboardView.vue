<script setup>
import { computed } from 'vue'
import { useHealthStore } from '@/stores/health.js'
import {
  VITAL_PERIODS, MEALS, GLUCOSE_TIMINGS,
  labelOf, bloodPressureLevel, glucoseLevel,
} from '@/services/models.js'
import LevelTag from '@/components/LevelTag.vue'

const store = useHealthStore()

const totalRecords = computed(() =>
  store.vitals.length + store.glucose.length)

/** 近 7 天（含今天）的日期字符串集合 */
const recentDates = computed(() => {
  const days = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
})

const weekRecords = computed(() => {
  const days = recentDates.value
  const vitals = store.vitals.filter((r) => days.includes(r.date)).length
  const glucose = store.glucose.filter((r) => days.includes(r.date)).length
  return vitals + glucose
})

/** 近 7 天内判定为 warn / danger 的记录，按日期倒序 */
const abnormal = computed(() => {
  const days = recentDates.value
  const rows = []

  store.vitals.forEach((r) => {
    if (!days.includes(r.date)) return
    const level = bloodPressureLevel(r.systolic, r.diastolic)
    if (level.tone !== 'warn' && level.tone !== 'danger') return
    rows.push({
      id: `v-${r.id}`,
      clientId: r.clientId,
      date: r.date,
      type: '血压',
      detail: `${labelOf(VITAL_PERIODS, r.period)}　${r.systolic}/${r.diastolic} mmHg`,
      level,
    })
  })

  store.glucose.forEach((r) => {
    if (!days.includes(r.date)) return
    const level = glucoseLevel(r.value, r.timing)
    if (level.tone !== 'warn' && level.tone !== 'danger') return
    rows.push({
      id: `g-${r.id}`,
      clientId: r.clientId,
      date: r.date,
      type: '血糖',
      detail: `${labelOf(MEALS, r.meal)}${labelOf(GLUCOSE_TIMINGS, r.timing)}　${r.value} mmol/L`,
      level,
    })
  })

  return rows.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12)
})

function nameOf(clientId) {
  const client = store.clientById(clientId)
  return client ? client.name : '（已删除）'
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h2>概览</h2>
      <RouterLink to="/check-in"><button class="primary">去打卡</button></RouterLink>
    </div>

    <div class="grid grid-3">
      <div class="stat">
        <div class="label">在管客户</div>
        <div class="value">{{ store.activeClients.length }}</div>
      </div>
      <div class="stat">
        <div class="label">今日已打卡</div>
        <div class="value">
          {{ store.checkedInToday.size }}
          <span class="muted" style="font-size: 15px">/ {{ store.activeClients.length }}</span>
        </div>
      </div>
      <div class="stat">
        <div class="label">近 7 天记录</div>
        <div class="value">{{ weekRecords }}</div>
      </div>
      <div class="stat">
        <div class="label">累计记录</div>
        <div class="value">{{ totalRecords }}</div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <div class="card-title">今日打卡情况</div>
      <p v-if="store.activeClients.length === 0" class="empty">
        还没有客户档案。<RouterLink to="/clients/new">新建一份</RouterLink>
      </p>
      <div v-else class="checkin-grid">
        <RouterLink
          v-for="c in store.activeClients"
          :key="c.id"
          :to="`/check-in?client=${c.id}`"
          class="checkin-item"
        >
          <span>{{ c.name }}</span>
          <span class="tag" :class="store.checkedInToday.has(c.id) ? 'tag-ok' : 'tag-muted'">
            {{ store.checkedInToday.has(c.id) ? '已打卡' : '未打卡' }}
          </span>
        </RouterLink>
      </div>
    </div>

    <div class="card">
      <div class="card-title">近 7 天需关注的记录</div>
      <p v-if="abnormal.length === 0" class="empty">近 7 天没有超出参考区间的记录。</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日期</th><th>客户</th><th>项目</th><th>数值</th><th>判定</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in abnormal" :key="row.id">
              <td>{{ row.date }}</td>
              <td>
                <RouterLink :to="`/clients/${row.clientId}`">{{ nameOf(row.clientId) }}</RouterLink>
              </td>
              <td>{{ row.type }}</td>
              <td>{{ row.detail }}</td>
              <td><LevelTag :level="row.level" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkin-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.checkin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
}
.checkin-item:hover { border-color: var(--brand); background: #fafbfc; }
</style>
