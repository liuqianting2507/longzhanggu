<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHealthStore } from '@/stores/health.js'
import {
  COLLECTIONS, GENDERS, VITAL_PERIODS, MEALS, GLUCOSE_TIMINGS,
  labelOf, bloodPressureLevel, glucoseLevel, calcBmi,
} from '@/services/models.js'
import LevelTag from '@/components/LevelTag.vue'

const store = useHealthStore()
const route = useRoute()
const router = useRouter()

const tab = ref('profile')
const TABS = [
  { key: 'profile', label: '基础信息' },
  { key: 'records', label: '打卡记录' },
  { key: 'metrics', label: '管理指标' },
  { key: 'solutions', label: '解决方案' },
]

const clientId = computed(() => route.params.id)
const client = computed(() => store.clientById(clientId.value))

const vitals = computed(() => store.vitalsOf(clientId.value))
const glucose = computed(() => store.glucoseOf(clientId.value))
const metrics = computed(() => store.metricsOf(clientId.value))
const solutions = computed(() => store.solutionsOf(clientId.value))

const age = computed(() => {
  if (!client.value || !client.value.birthDate) return '—'
  const birth = new Date(client.value.birthDate)
  if (Number.isNaN(birth.getTime())) return '—'
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1
  return years
})

/** 最近 10 条血压记录的平均值，用于概括近期控制情况 */
const vitalSummary = computed(() => {
  const rows = vitals.value.slice(0, 10)
  if (rows.length === 0) return null
  let sysSum = 0
  let diaSum = 0
  rows.forEach((r) => { sysSum += Number(r.systolic); diaSum += Number(r.diastolic) })
  const systolic = Math.round(sysSum / rows.length)
  const diastolic = Math.round(diaSum / rows.length)
  return { systolic, diastolic, count: rows.length, level: bloodPressureLevel(systolic, diastolic) }
})

// --- 管理指标 ---
const metricForm = ref({ date: store.today(), name: '', value: '', unit: '', note: '' })
const metricValid = computed(() =>
  metricForm.value.name.trim() !== '' && metricForm.value.value !== '')

async function addMetric() {
  if (!metricValid.value) return
  await store.add(COLLECTIONS.METRICS, {
    clientId: clientId.value,
    date: metricForm.value.date,
    name: metricForm.value.name.trim(),
    value: metricForm.value.value,
    unit: metricForm.value.unit.trim(),
    note: metricForm.value.note.trim(),
  })
  metricForm.value = { date: store.today(), name: '', value: '', unit: '', note: '' }
}

// --- 解决方案 ---
const solutionForm = ref({ date: store.today(), title: '', content: '', author: '', followUpAt: '', effect: '' })
const solutionValid = computed(() =>
  solutionForm.value.title.trim() !== '' && solutionForm.value.content.trim() !== '')

async function addSolution() {
  if (!solutionValid.value) return
  await store.add(COLLECTIONS.SOLUTIONS, {
    clientId: clientId.value,
    date: solutionForm.value.date,
    title: solutionForm.value.title.trim(),
    content: solutionForm.value.content.trim(),
    author: solutionForm.value.author.trim(),
    followUpAt: solutionForm.value.followUpAt,
    effect: solutionForm.value.effect.trim(),
  })
  solutionForm.value = { date: store.today(), title: '', content: '', author: '', followUpAt: '', effect: '' }
}

async function removeRow(collection, id) {
  if (!window.confirm('确定删除这条记录？删除后无法恢复。')) return
  await store.remove(collection, id)
}

async function removeClient() {
  if (!window.confirm(`确定删除「${client.value.name}」的档案？其所有打卡、指标和方案记录都会一并删除，且无法恢复。`)) return
  await store.removeClient(clientId.value)
  router.push('/clients')
}
</script>

<template>
  <div class="page">
    <p v-if="store.loading" class="empty">加载中…</p>

    <p v-else-if="!client" class="empty">
      找不到这份档案。<RouterLink to="/clients">回到客户列表</RouterLink>
    </p>

    <template v-else>
      <div class="page-head">
        <div>
          <h2>
            {{ client.name }}
            <span v-if="client.archivedAt" class="tag tag-muted">已归档</span>
          </h2>
          <p class="muted small" style="margin: 4px 0 0">
            {{ labelOf(GENDERS, client.gender) }} · {{ age }} 岁
            <template v-if="client.phone"> · {{ client.phone }}</template>
          </p>
        </div>
        <div class="btn-row">
          <RouterLink :to="`/check-in?client=${client.id}`"><button class="primary">去打卡</button></RouterLink>
          <RouterLink :to="`/clients/${client.id}/edit`"><button>编辑</button></RouterLink>
          <button class="danger" @click="removeClient">删除档案</button>
        </div>
      </div>

      <div class="grid grid-3" style="margin-bottom: 20px">
        <div class="stat">
          <div class="label">近期血压均值<span v-if="vitalSummary" class="muted">（近 {{ vitalSummary.count }} 次）</span></div>
          <div class="value" v-if="vitalSummary">
            {{ vitalSummary.systolic }}/{{ vitalSummary.diastolic }}
            <LevelTag :level="vitalSummary.level" />
          </div>
          <div class="value muted" v-else>—</div>
        </div>
        <div class="stat">
          <div class="label">打卡记录</div>
          <div class="value">{{ vitals.length + glucose.length }}</div>
        </div>
        <div class="stat">
          <div class="label">BMI</div>
          <div class="value">{{ calcBmi(client.height, client.weight) ?? '—' }}</div>
        </div>
        <div class="stat">
          <div class="label">方案记录</div>
          <div class="value">{{ solutions.length }}</div>
        </div>
      </div>

      <div class="tabs">
        <button
          v-for="t in TABS" :key="t.key"
          :class="{ active: tab === t.key }"
          @click="tab = t.key"
        >{{ t.label }}</button>
      </div>

      <!-- 基础信息 -->
      <div v-show="tab === 'profile'" class="card">
        <div class="card-title">客户基础信息</div>
        <dl class="info">
          <div><dt>姓名</dt><dd>{{ client.name }}</dd></div>
          <div><dt>性别</dt><dd>{{ labelOf(GENDERS, client.gender) }}</dd></div>
          <div><dt>出生日期</dt><dd>{{ client.birthDate || '—' }}</dd></div>
          <div><dt>年龄</dt><dd>{{ age }}</dd></div>
          <div><dt>手机号</dt><dd>{{ client.phone || '—' }}</dd></div>
          <div><dt>身高</dt><dd>{{ client.height ? client.height + ' cm' : '—' }}</dd></div>
          <div><dt>体重</dt><dd>{{ client.weight ? client.weight + ' kg' : '—' }}</dd></div>
          <div><dt>BMI</dt><dd>{{ calcBmi(client.height, client.weight) ?? '—' }}</dd></div>
          <div><dt>联系地址</dt><dd>{{ client.address || '—' }}</dd></div>
          <div><dt>紧急联系人</dt><dd>{{ client.emergencyContact || '—' }}<template v-if="client.emergencyPhone">（{{ client.emergencyPhone }}）</template></dd></div>
          <div class="wide"><dt>既往病史 / 诊断</dt><dd>{{ client.conditions || '—' }}</dd></div>
          <div class="wide"><dt>在用药物</dt><dd>{{ client.medications || '—' }}</dd></div>
          <div><dt>过敏史</dt><dd>{{ client.allergies || '—' }}</dd></div>
          <div><dt>备注</dt><dd>{{ client.note || '—' }}</dd></div>
        </dl>
      </div>

      <!-- 打卡记录 -->
      <div v-show="tab === 'records'">
        <div class="card">
          <div class="card-title">血压 / 心率（{{ vitals.length }} 条）</div>
          <p v-if="vitals.length === 0" class="empty">还没有记录。</p>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>日期</th><th>时段</th><th>血压 (mmHg)</th><th>心率</th><th>判定</th><th>备注</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="r in vitals" :key="r.id">
                  <td>{{ r.date }}</td>
                  <td>{{ labelOf(VITAL_PERIODS, r.period) }}</td>
                  <td>{{ r.systolic }}/{{ r.diastolic }}</td>
                  <td>{{ r.heartRate || '—' }}</td>
                  <td><LevelTag :level="bloodPressureLevel(r.systolic, r.diastolic)" /></td>
                  <td class="note-cell">{{ r.note || '—' }}</td>
                  <td><button class="danger" @click="removeRow(COLLECTIONS.VITALS, r.id)">删除</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-title">血糖（{{ glucose.length }} 条）</div>
          <p v-if="glucose.length === 0" class="empty">还没有记录。</p>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>日期</th><th>餐次</th><th>时点</th><th>血糖 (mmol/L)</th><th>判定</th><th>备注</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="r in glucose" :key="r.id">
                  <td>{{ r.date }}</td>
                  <td>{{ labelOf(MEALS, r.meal) }}</td>
                  <td>{{ labelOf(GLUCOSE_TIMINGS, r.timing) }}</td>
                  <td>{{ r.value }}</td>
                  <td><LevelTag :level="glucoseLevel(r.value, r.timing)" /></td>
                  <td class="note-cell">{{ r.note || '—' }}</td>
                  <td><button class="danger" @click="removeRow(COLLECTIONS.GLUCOSE, r.id)">删除</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 管理指标 -->
      <div v-show="tab === 'metrics'">
        <form class="card" @submit.prevent="addMetric">
          <div class="card-title">新增指标</div>
          <div class="form-row">
            <div class="field">
              <label>日期</label>
              <input v-model="metricForm.date" type="date" required />
            </div>
            <div class="field">
              <label>指标名称 *</label>
              <input v-model="metricForm.name" placeholder="如：糖化血红蛋白 / 腰围 / 总胆固醇" required />
            </div>
            <div class="field">
              <label>数值 *</label>
              <input v-model="metricForm.value" placeholder="7.1" required />
            </div>
            <div class="field">
              <label>单位</label>
              <input v-model="metricForm.unit" placeholder="% / cm / mmol/L" />
            </div>
          </div>
          <div class="field">
            <label>说明</label>
            <input v-model="metricForm.note" placeholder="如：入组基线 / 较上次下降 0.7" />
          </div>
          <button class="primary" type="submit" :disabled="!metricValid">添加指标</button>
        </form>

        <div class="card">
          <div class="card-title">管理过程指标（{{ metrics.length }} 条）</div>
          <p v-if="metrics.length === 0" class="empty">还没有指标数据。</p>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>日期</th><th>指标</th><th>数值</th><th>说明</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="m in metrics" :key="m.id">
                  <td>{{ m.date }}</td>
                  <td>{{ m.name }}</td>
                  <td>{{ m.value }} {{ m.unit }}</td>
                  <td class="note-cell">{{ m.note || '—' }}</td>
                  <td><button class="danger" @click="removeRow(COLLECTIONS.METRICS, m.id)">删除</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 解决方案 -->
      <div v-show="tab === 'solutions'">
        <form class="card" @submit.prevent="addSolution">
          <div class="card-title">新增方案记录</div>
          <div class="form-row">
            <div class="field">
              <label>日期</label>
              <input v-model="solutionForm.date" type="date" required />
            </div>
            <div class="field">
              <label>方案标题 *</label>
              <input v-model="solutionForm.title" placeholder="如：入组首次方案 / 一月复评" required />
            </div>
            <div class="field">
              <label>制定人</label>
              <input v-model="solutionForm.author" placeholder="管理师姓名" />
            </div>
            <div class="field">
              <label>计划随访日期</label>
              <input v-model="solutionForm.followUpAt" type="date" />
            </div>
          </div>
          <div class="field">
            <label>方案内容 *</label>
            <textarea v-model="solutionForm.content" placeholder="饮食、运动、用药、监测频次等具体建议" required />
          </div>
          <div class="field">
            <label>执行效果（可后续补填）</label>
            <input v-model="solutionForm.effect" placeholder="如：糖化下降 0.7%，体重下降 2kg" />
          </div>
          <button class="primary" type="submit" :disabled="!solutionValid">添加方案</button>
        </form>

        <div class="card">
          <div class="card-title">解决方案记录（{{ solutions.length }} 条）</div>
          <p v-if="solutions.length === 0" class="empty">还没有方案记录。</p>
          <div v-else class="solution-list">
            <article v-for="s in solutions" :key="s.id" class="solution">
              <header>
                <div>
                  <strong>{{ s.title }}</strong>
                  <span class="muted small">　{{ s.date }}<template v-if="s.author"> · {{ s.author }}</template></span>
                </div>
                <button class="danger" @click="removeRow(COLLECTIONS.SOLUTIONS, s.id)">删除</button>
              </header>
              <pre>{{ s.content }}</pre>
              <p v-if="s.followUpAt" class="small muted">计划随访：{{ s.followUpAt }}</p>
              <p v-if="s.effect" class="small">执行效果：{{ s.effect }}</p>
            </article>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.info {
  display: grid;
  gap: 12px 20px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin: 0;
}
.info > div.wide { grid-column: 1 / -1; }
.info dt { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
.info dd { margin: 0; white-space: pre-wrap; }

.note-cell { white-space: normal; max-width: 260px; }

.solution-list { display: flex; flex-direction: column; gap: 14px; }
.solution { border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
.solution header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px; margin-bottom: 8px;
}
.solution pre {
  margin: 0 0 8px; white-space: pre-wrap; font: inherit;
  background: var(--bg); padding: 10px 12px; border-radius: 8px;
}
.solution p { margin: 2px 0; }
</style>
