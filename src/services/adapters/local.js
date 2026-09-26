/**
 * localStorage 数据源适配器（第一版默认）。
 * 接口与 firebase.js 保持一致，切换数据源时业务代码不用改。
 */

const PREFIX = 'lzg:'

function read(collection) {
  try {
    const raw = localStorage.getItem(PREFIX + collection)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error(`[local] 读取 ${collection} 失败`, err)
    return []
  }
}

function write(collection, rows) {
  localStorage.setItem(PREFIX + collection, JSON.stringify(rows))
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 简单等值过滤，例如 { clientId: 'xxx' } */
function matches(row, filter) {
  const keys = Object.keys(filter)
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    if (row[key] !== filter[key]) return false
  }
  return true
}

export const localAdapter = {
  name: 'local',

  async list(collection, filter = {}) {
    const rows = read(collection)
    return rows.filter((row) => matches(row, filter))
  },

  async get(collection, id) {
    const rows = read(collection)
    return rows.find((row) => row.id === id) || null
  },

  async create(collection, data) {
    const rows = read(collection)
    const now = new Date().toISOString()
    const row = { ...data, id: newId(), createdAt: now, updatedAt: now }
    rows.push(row)
    write(collection, rows)
    return row
  },

  async update(collection, id, patch) {
    const rows = read(collection)
    const index = rows.findIndex((row) => row.id === id)
    if (index === -1) throw new Error(`记录不存在: ${collection}/${id}`)
    rows[index] = { ...rows[index], ...patch, updatedAt: new Date().toISOString() }
    write(collection, rows)
    return rows[index]
  },

  async remove(collection, id) {
    const rows = read(collection)
    write(collection, rows.filter((row) => row.id !== id))
  },
}
