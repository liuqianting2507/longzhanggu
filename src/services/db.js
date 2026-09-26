/**
 * 数据访问门面。业务代码只 import 这里，不直接碰适配器。
 * 通过 .env 的 VITE_DATA_SOURCE 决定用哪个数据源。
 */
import { localAdapter } from './adapters/local.js'
import { firebaseAdapter } from './adapters/firebase.js'

const source = import.meta.env.VITE_DATA_SOURCE || 'local'
const adapter = source === 'firebase' ? firebaseAdapter : localAdapter

export const dataSourceName = adapter.name

export const db = {
  list: (collection, filter) => adapter.list(collection, filter),
  get: (collection, id) => adapter.get(collection, id),
  create: (collection, data) => adapter.create(collection, data),
  update: (collection, id, patch) => adapter.update(collection, id, patch),
  remove: (collection, id) => adapter.remove(collection, id),
}
