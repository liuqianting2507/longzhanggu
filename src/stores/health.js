import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/db.js'
import { COLLECTIONS } from '@/services/models.js'

/** 按日期倒序（同日则按创建时间倒序） */
function byDateDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return (a.createdAt || '') < (b.createdAt || '') ? 1 : -1
}

export const useHealthStore = defineStore('health', () => {
  const clients = ref([])
  const vitals = ref([])
  const glucose = ref([])
  const metrics = ref([])
  const solutions = ref([])
  const loading = ref(false)
  const error = ref('')

  const activeClients = computed(() => clients.value.filter((c) => !c.archivedAt))
  const today = () => new Date().toISOString().slice(0, 10)

  /** 今日已打卡（血压或血糖任一）的客户 id 集合 */
  const checkedInToday = computed(() => {
    const d = today()
    const ids = new Set()
    vitals.value.forEach((r) => { if (r.date === d) ids.add(r.clientId) })
    glucose.value.forEach((r) => { if (r.date === d) ids.add(r.clientId) })
    return ids
  })

  function clientById(id) {
    return clients.value.find((c) => c.id === id) || null
  }

  function vitalsOf(clientId) {
    return vitals.value.filter((r) => r.clientId === clientId).sort(byDateDesc)
  }
  function glucoseOf(clientId) {
    return glucose.value.filter((r) => r.clientId === clientId).sort(byDateDesc)
  }
  function metricsOf(clientId) {
    return metrics.value.filter((r) => r.clientId === clientId).sort(byDateDesc)
  }
  function solutionsOf(clientId) {
    return solutions.value.filter((r) => r.clientId === clientId).sort(byDateDesc)
  }

  async function loadAll() {
    loading.value = true
    error.value = ''
    try {
      const [c, v, g, m, s] = await Promise.all([
        db.list(COLLECTIONS.CLIENTS),
        db.list(COLLECTIONS.VITALS),
        db.list(COLLECTIONS.GLUCOSE),
        db.list(COLLECTIONS.METRICS),
        db.list(COLLECTIONS.SOLUTIONS),
      ])
      clients.value = c
      vitals.value = v
      glucose.value = g
      metrics.value = m
      solutions.value = s
    } catch (err) {
      error.value = err.message || '加载数据失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  /** collection 名 -> 本地 ref，保证写库与内存同步 */
  function bucketOf(collection) {
    if (collection === COLLECTIONS.CLIENTS) return clients
    if (collection === COLLECTIONS.VITALS) return vitals
    if (collection === COLLECTIONS.GLUCOSE) return glucose
    if (collection === COLLECTIONS.METRICS) return metrics
    if (collection === COLLECTIONS.SOLUTIONS) return solutions
    throw new Error(`未知集合: ${collection}`)
  }

  async function add(collection, data) {
    const row = await db.create(collection, data)
    bucketOf(collection).value.push(row)
    return row
  }

  async function edit(collection, id, patch) {
    const row = await db.update(collection, id, patch)
    const bucket = bucketOf(collection)
    const index = bucket.value.findIndex((r) => r.id === id)
    if (index !== -1) bucket.value[index] = row
    return row
  }

  async function remove(collection, id) {
    await db.remove(collection, id)
    const bucket = bucketOf(collection)
    bucket.value = bucket.value.filter((r) => r.id !== id)
  }

  /** 删除客户时一并清掉其所有记录 */
  async function removeClient(clientId) {
    const related = [
      [COLLECTIONS.VITALS, vitals],
      [COLLECTIONS.GLUCOSE, glucose],
      [COLLECTIONS.METRICS, metrics],
      [COLLECTIONS.SOLUTIONS, solutions],
    ]
    for (const [collection, bucket] of related) {
      const rows = bucket.value.filter((r) => r.clientId === clientId)
      for (const row of rows) {
        await db.remove(collection, row.id)
      }
      bucket.value = bucket.value.filter((r) => r.clientId !== clientId)
    }
    await remove(COLLECTIONS.CLIENTS, clientId)
  }

  return {
    clients, vitals, glucose, metrics, solutions, loading, error,
    activeClients, checkedInToday, today,
    clientById, vitalsOf, glucoseOf, metricsOf, solutionsOf,
    loadAll, add, edit, remove, removeClient,
  }
})
