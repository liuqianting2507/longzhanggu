/**
 * 首次打开时写入一条演示客户及其记录，方便直接看到界面效果。
 * 清空演示数据：浏览器控制台执行 localStorage.clear() 后刷新。
 */
import { db } from './db.js'
import { COLLECTIONS } from './models.js'

const SEED_FLAG = 'lzg:seeded'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export async function seedIfEmpty() {
  if (localStorage.getItem(SEED_FLAG)) return
  const existing = await db.list(COLLECTIONS.CLIENTS)
  if (existing.length > 0) {
    localStorage.setItem(SEED_FLAG, '1')
    return
  }

  const client = await db.create(COLLECTIONS.CLIENTS, {
    name: '示例客户·张明',
    gender: 'male',
    birthDate: '1968-04-12',
    phone: '13800000000',
    height: 172,
    weight: 78,
    address: '示例地址',
    emergencyContact: '张小明',
    emergencyPhone: '13900000000',
    conditions: '2型糖尿病 5 年，高血压 2 年',
    medications: '二甲双胍 0.5g bid；氨氯地平 5mg qd',
    allergies: '青霉素',
    note: '这是一条演示数据，可直接删除。',
    archivedAt: null,
  })

  await db.create(COLLECTIONS.VITALS, {
    clientId: client.id, date: daysAgo(1), period: 'morning',
    systolic: 146, diastolic: 92, heartRate: 78, note: '',
  })
  await db.create(COLLECTIONS.VITALS, {
    clientId: client.id, date: daysAgo(1), period: 'evening',
    systolic: 138, diastolic: 86, heartRate: 72, note: '晚饭后散步 30 分钟',
  })
  await db.create(COLLECTIONS.VITALS, {
    clientId: client.id, date: daysAgo(0), period: 'morning',
    systolic: 134, diastolic: 84, heartRate: 70, note: '',
  })

  await db.create(COLLECTIONS.GLUCOSE, {
    clientId: client.id, date: daysAgo(1), meal: 'breakfast',
    timing: 'before', value: 7.4, note: '',
  })
  await db.create(COLLECTIONS.GLUCOSE, {
    clientId: client.id, date: daysAgo(1), meal: 'breakfast',
    timing: 'after', value: 10.2, note: '',
  })
  await db.create(COLLECTIONS.GLUCOSE, {
    clientId: client.id, date: daysAgo(0), meal: 'breakfast',
    timing: 'before', value: 6.5, note: '',
  })

  await db.create(COLLECTIONS.METRICS, {
    clientId: client.id, date: daysAgo(30), name: '糖化血红蛋白',
    value: '7.8', unit: '%', note: '入组基线',
  })
  await db.create(COLLECTIONS.METRICS, {
    clientId: client.id, date: daysAgo(0), name: '糖化血红蛋白',
    value: '7.1', unit: '%', note: '较基线下降 0.7',
  })

  await db.create(COLLECTIONS.SOLUTIONS, {
    clientId: client.id, date: daysAgo(30), title: '入组首次方案',
    content: '1. 每日早晚监测血压心率\n2. 三餐餐前餐后测血糖\n3. 主食减量 1/3，增加蔬菜摄入\n4. 每日快走 30 分钟',
    author: '管理师', followUpAt: daysAgo(-7), effect: '',
  })
  await db.create(COLLECTIONS.SOLUTIONS, {
    clientId: client.id, date: daysAgo(0), title: '一月复评',
    content: '空腹血糖较入组改善，血压仍偏高。建议：\n1. 控盐至每日 5g 以内\n2. 保持现有运动量\n3. 两周后复诊评估是否调整降压药',
    author: '管理师', followUpAt: daysAgo(-14), effect: '糖化下降 0.7%，体重下降 2kg',
  })

  localStorage.setItem(SEED_FLAG, '1')
}
