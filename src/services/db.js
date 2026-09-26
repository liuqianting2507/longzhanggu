/**
 * 数据访问门面。业务代码只 import 这里，不直接碰适配器。
 * 通过 .env 的 VITE_DATA_SOURCE 决定用哪个数据源。
 *
 * 适配器用动态 import 懒加载：用 local 时不会把 Firebase SDK 打进包，
 * 也不会去执行 Firebase 的初始化检查。
 */
const source = import.meta.env.VITE_DATA_SOURCE || 'local'

export const dataSourceName = source === 'firebase' ? 'firebase' : 'local'

let adapterPromise = null

function getAdapter() {
  if (!adapterPromise) {
    adapterPromise = source === 'firebase'
      ? import('./adapters/firebase.js').then((m) => m.firebaseAdapter)
      : import('./adapters/local.js').then((m) => m.localAdapter)
  }
  return adapterPromise
}

export const db = {
  async list(collection, filter) {
    return (await getAdapter()).list(collection, filter)
  },
  async get(collection, id) {
    return (await getAdapter()).get(collection, id)
  },
  async create(collection, data) {
    return (await getAdapter()).create(collection, data)
  },
  async update(collection, id, patch) {
    return (await getAdapter()).update(collection, id, patch)
  },
  async remove(collection, id) {
    return (await getAdapter()).remove(collection, id)
  },
}
