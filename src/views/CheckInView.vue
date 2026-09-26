<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHealthStore } from '@/stores/health.js'
import {
  COLLECTIONS, VITAL_PERIODS, MEALS, GLUCOSE_TIMINGS,
  labelOf, bloodPressureLevel, glucoseLevel,
} from '@/services/models.js'
import LevelTag from '@/components/LevelTag.vue'

const store = useHealthStore()
const route = useRoute()

const clientId = ref(route.query.client || '')
const saving = ref(false)
const flash = ref('')

// 客户列表加载完成后，若未指定则默认选中第一位
watch(() => store.activeClients, (list) => {
  if (!clientId.value && list.length > 0) clientId.value = list[0].id
}, { immediate: true })

function blankVital() {
  return {
    date: store.today(), period: 'morning',
    systolic: null, diastolic: null, heartRate: null, note: '',
  }
}
function blankGlucose() {
  return { date: store.today(), meal: 'breakfast', timing: 'before', value: null, note: '' }
}

const vitalForm = ref(blankVital())
const glucoseForm = ref(blankGlucose())

const vitalPreview = computed(() =>
  bloodPressureLevel(vitalForm.value.systolic, vitalForm.value.diastolic))
const glucosePreview = computed(() =>
  glucoseLevel(glucoseForm.value.value, glucoseForm.value.timing))

const vitalValid = computed(() => {
  const f = vitalForm.value
  return Boolean(clientId.value && f.date && f.systolic && f.diastolic)
})
const glucoseValid = computed(() =>
  Boolean(clientId.value && glucoseForm.value.date && glucoseForm.value.value))

/** 当天该客户已录入的记录，给用户一个“今天打过卡没”的直观反馈 */
const todayVitals = computed(() =>
  store.vitalsOf(clientId.value).filter((r) => r.date === store.today()))
const todayGlucose = computed(() =>
  store.glucoseOf(clientId.value).filter((r) => r.date === store.today()))

function notify(message) {
  flash.value = message
  setTimeout(() => { flash.value = '' }, 2500)
}

async function submitVital() {
  if (!vitalValid.value) return
  saving.value = true
  try {
    await store.add(COLLECTIONS.VITALS, {
      clientId: clientId.value,
      date: vitalForm.value.date,
      period: vitalForm.value.period,
      systolic: Number(vitalForm.value.systolic),
      diastolic: Number(vitalForm.value.diastolic),
      heartRate: vitalForm.value.heartRate ? Number(vitalForm.value.heartRate) : null,
      note: vitalForm.value.note,
    })
    vitalForm.value = blankVital()
    notify('血压心率已记录')
  } finally {
    saving.value = false
  }
}

async function submitGlucose() {
  if (!glucoseValid.value) return
  saving.value = true
  try {
    await store.add(COLLECTIONS.GLUCOSE, {
      clientId: clientId.value,
      date: glucoseForm.value.date,
      meal: glucoseForm.value.meal,
      timing: glucoseForm.value.timing,
      value: Number(glucoseForm.value.value),
      note: glucoseForm.value.note,
    })
    glucoseForm.value = blankGlucose()
    notify('血糖已记录')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2>每日打卡</h2>
        <p class="muted small" style="margin: 4px 0 0">
          早晚各记录一次血压心率；三餐可分别记录餐前、餐后血糖。
        </p>
      </div>
      <span v-if="flash" class="tag tag-ok">{{ flash }}</span>
    </div>

    <div class="card" v-if="store.activeClients.length === 0">
      <p class="empty">
        还没有客户档案。<RouterLink to="/clients/new">先建一份档案</RouterLink>再来打卡。
      </p>
    </div>

    <template v-else>
      <div class="card">
        <div class="field" style="margin: 0; max-width: 320px">
          <label>选择客户</label>
          <select v-model="clientId">
            <option v-for="c in store.activeClients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top: 16px">
        <!-- 血压 / 心率 -->
        <form class="card" @submit.prevent="submitVital">
          <div class="card-title">
            <span>血压 / 心率</span>
            <LevelTag :level="vitalPreview" />
          </div>

          <div class="form-row">
            <div class="field">
              <label>日期</label>
              <input v-model="vitalForm.date" type="date" :max="store.today()" required />
            </div>
            <div class="field">
              <label>时段</label>
              <select v-model="vitalForm.period">
                <option v-for="p in VITAL_PERIODS" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>收缩压（高压 mmHg）</label>
              <input v-model="vitalForm.systolic" type="number" min="50" max="300" placeholder="120" required />
            </div>
            <div class="field">
              <label>舒张压（低压 mmHg）</label>
              <input v-model="vitalForm.diastolic" type="number" min="30" max="200" placeholder="80" required />
            </div>
            <div class="field">
              <label>心率（次/分）</label>
              <input v-model="vitalForm.heartRate" type="number" min="30" max="220" placeholder="72" />
            </div>
          </div>

          <div class="field">
            <label>备注（选填）</label>
            <input v-model="vitalForm.note" placeholder="如：服药后测量 / 运动后" />
          </div>

          <button class="primary" type="submit" :disabled="!vitalValid || saving">
            记录血压心率
          </button>

          <div v-if="todayVitals.length" class="today-list">
            <p class="small muted">今日已记录</p>
            <p v-for="r in todayVitals" :key="r.id" class="small">
              {{ labelOf(VITAL_PERIODS, r.period) }}　{{ r.systolic }}/{{ r.diastolic }} mmHg
              <template v-if="r.heartRate">　心率 {{ r.heartRate }}</template>
            </p>
          </div>
        </form>

        <!-- 血糖 -->
        <form class="card" @submit.prevent="submitGlucose">
          <div class="card-title">
            <span>血糖</span>
            <LevelTag :level="glucosePreview" />
          </div>

          <div class="form-row">
            <div class="field">
              <label>日期</label>
              <input v-model="glucoseForm.date" type="date" :max="store.today()" required />
            </div>
            <div class="field">
              <label>餐次</label>
              <select v-model="glucoseForm.meal">
                <option v-for="m in MEALS" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="field">
              <label>时点</label>
              <select v-model="glucoseForm.timing">
                <option v-for="t in GLUCOSE_TIMINGS" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>血糖值（mmol/L）</label>
            <input v-model="glucoseForm.value" type="number" step="0.1" min="1" max="40" placeholder="6.1" required />
          </div>

          <div class="field">
            <label>备注（选填）</label>
            <input v-model="glucoseForm.note" placeholder="如：餐后 2 小时" />
          </div>

          <button class="primary" type="submit" :disabled="!glucoseValid || saving">
            记录血糖
          </button>

          <div v-if="todayGlucose.length" class="today-list">
            <p class="small muted">今日已记录</p>
            <p v-for="r in todayGlucose" :key="r.id" class="small">
              {{ labelOf(MEALS, r.meal) }}{{ labelOf(GLUCOSE_TIMINGS, r.timing) }}　{{ r.value }} mmol/L
            </p>
          </div>
        </form>
      </div>

      <p class="muted small" style="margin-top: 16px">
        参考区间仅用于提示，不构成医疗诊断，具体请遵医嘱。
      </p>
    </template>
  </div>
</template>

<style scoped>
.today-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.today-list p { margin: 2px 0; }
</style>
