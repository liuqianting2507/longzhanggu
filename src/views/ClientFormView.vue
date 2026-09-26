<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHealthStore } from '@/stores/health.js'
import { COLLECTIONS, GENDERS, emptyClient, calcBmi } from '@/services/models.js'

const store = useHealthStore()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => Boolean(route.params.id))
const form = ref(emptyClient())
const saving = ref(false)

// 编辑模式：数据加载完成后回填表单
watch(
  () => [route.params.id, store.clients.length],
  () => {
    if (!isEdit.value) return
    const client = store.clientById(route.params.id)
    if (client) form.value = { ...client }
  },
  { immediate: true },
)

const bmi = computed(() => calcBmi(form.value.height, form.value.weight))
const valid = computed(() => form.value.name.trim().length > 0)

async function save() {
  if (!valid.value) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      name: form.value.name.trim(),
      height: form.value.height ? Number(form.value.height) : null,
      weight: form.value.weight ? Number(form.value.weight) : null,
    }
    if (isEdit.value) {
      await store.edit(COLLECTIONS.CLIENTS, route.params.id, payload)
      router.push(`/clients/${route.params.id}`)
    } else {
      const created = await store.add(COLLECTIONS.CLIENTS, payload)
      router.push(`/clients/${created.id}`)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h2>{{ isEdit ? '编辑档案' : '新建档案' }}</h2>
      <button @click="router.back()">返回</button>
    </div>

    <form @submit.prevent="save">
      <div class="card">
        <div class="card-title">基础信息</div>
        <div class="form-row">
          <div class="field">
            <label>姓名 *</label>
            <input v-model="form.name" placeholder="客户姓名" required />
          </div>
          <div class="field">
            <label>性别</label>
            <select v-model="form.gender">
              <option v-for="g in GENDERS" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>出生日期</label>
            <input v-model="form.birthDate" type="date" />
          </div>
          <div class="field">
            <label>手机号</label>
            <input v-model="form.phone" placeholder="13800000000" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>身高（cm）</label>
            <input v-model="form.height" type="number" min="50" max="250" />
          </div>
          <div class="field">
            <label>体重（kg）</label>
            <input v-model="form.weight" type="number" min="10" max="300" step="0.1" />
          </div>
          <div class="field">
            <label>BMI（自动计算）</label>
            <input :value="bmi ?? '—'" disabled />
          </div>
        </div>

        <div class="field">
          <label>联系地址</label>
          <input v-model="form.address" />
        </div>

        <div class="form-row">
          <div class="field">
            <label>紧急联系人</label>
            <input v-model="form.emergencyContact" />
          </div>
          <div class="field">
            <label>紧急联系电话</label>
            <input v-model="form.emergencyPhone" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">健康背景</div>
        <div class="field">
          <label>既往病史 / 现有诊断</label>
          <textarea v-model="form.conditions" placeholder="如：2型糖尿病 5 年，高血压 2 年" />
        </div>
        <div class="field">
          <label>在用药物</label>
          <textarea v-model="form.medications" placeholder="药名、剂量、频次" />
        </div>
        <div class="form-row">
          <div class="field">
            <label>过敏史</label>
            <input v-model="form.allergies" placeholder="如：青霉素" />
          </div>
          <div class="field">
            <label>备注</label>
            <input v-model="form.note" />
          </div>
        </div>
      </div>

      <div class="btn-row" style="margin-top: 16px">
        <button class="primary" type="submit" :disabled="!valid || saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <button type="button" @click="router.back()">取消</button>
        <span v-if="!valid" class="muted small hint">姓名为必填项，填写后即可保存</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.hint { align-self: center; }
</style>
