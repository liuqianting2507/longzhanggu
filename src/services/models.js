/**
 * 数据模型定义与常量。
 * 集合（collection）名称与将来 Firestore 的集合一一对应，换数据源时无需改动业务代码。
 */

export const COLLECTIONS = {
  CLIENTS: 'clients',       // 客户基础档案
  VITALS: 'vitals',         // 血压 / 心率打卡
  GLUCOSE: 'glucose',       // 血糖打卡
  METRICS: 'metrics',       // 管理过程指标
  SOLUTIONS: 'solutions',   // 解决方案记录
}

/** 早晚两次血压心率打卡 */
export const VITAL_PERIODS = [
  { value: 'morning', label: '早' },
  { value: 'evening', label: '晚' },
]

/** 三餐 */
export const MEALS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
]

/** 餐前 / 餐后 */
export const GLUCOSE_TIMINGS = [
  { value: 'before', label: '餐前' },
  { value: 'after', label: '餐后' },
]

export const GENDERS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

export function labelOf(options, value) {
  const hit = options.find((o) => o.value === value)
  return hit ? hit.label : value
}

/** 新建客户档案的默认字段 */
export function emptyClient() {
  return {
    name: '',
    gender: 'male',
    birthDate: '',
    phone: '',
    height: null,
    weight: null,
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    conditions: '',       // 既往病史 / 现有诊断
    medications: '',      // 在用药物
    allergies: '',        // 过敏史
    note: '',             // 备注
    archivedAt: null,     // 归档时间，null 表示在管
  }
}

/**
 * 血压参考区间（中国高血压防治指南，成人）。
 * 仅用于前端提示，不构成诊断。
 */
export function bloodPressureLevel(systolic, diastolic) {
  const s = Number(systolic)
  const d = Number(diastolic)
  if (!s || !d) return { level: 'unknown', label: '—', tone: 'muted' }
  if (s >= 180 || d >= 110) return { level: 'grade3', label: '3级高血压', tone: 'danger' }
  if (s >= 160 || d >= 100) return { level: 'grade2', label: '2级高血压', tone: 'danger' }
  if (s >= 140 || d >= 90) return { level: 'grade1', label: '1级高血压', tone: 'warn' }
  if (s >= 120 || d >= 80) return { level: 'high-normal', label: '正常高值', tone: 'warn' }
  if (s < 90 || d < 60) return { level: 'low', label: '偏低', tone: 'warn' }
  return { level: 'normal', label: '正常', tone: 'ok' }
}

/**
 * 血糖参考区间（mmol/L）。餐前与餐后阈值不同。
 * 仅用于前端提示，不构成诊断。
 */
export function glucoseLevel(value, timing) {
  const v = Number(value)
  if (!v) return { level: 'unknown', label: '—', tone: 'muted' }
  if (v < 3.9) return { level: 'low', label: '偏低', tone: 'danger' }
  if (timing === 'before') {
    if (v > 7.0) return { level: 'high', label: '偏高', tone: 'danger' }
    if (v > 6.1) return { level: 'elevated', label: '临界', tone: 'warn' }
    return { level: 'normal', label: '正常', tone: 'ok' }
  }
  if (v > 11.1) return { level: 'high', label: '偏高', tone: 'danger' }
  if (v > 7.8) return { level: 'elevated', label: '临界', tone: 'warn' }
  return { level: 'normal', label: '正常', tone: 'ok' }
}

/** 由身高体重计算 BMI，数据不全时返回 null */
export function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm)
  const w = Number(weightKg)
  if (!h || !w) return null
  return Number((w / (h / 100) ** 2).toFixed(1))
}
