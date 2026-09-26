/**
 * Firestore 数据源适配器。
 * 接口与 local.js 一致，业务代码不感知底层是哪个数据源。
 *
 * 集合结构见 services/models.js 的 COLLECTIONS；
 * 读写权限由 firestore.rules 控制（当前：仅登录用户可读写）。
 */
import {
  collection as coll, doc, getDoc, getDocs, addDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '../firebase.js'

/** Firestore Timestamp -> ISO 字符串，保证与 local 适配器返回同样的形状 */
function normalize(id, data) {
  const row = { id, ...data }
  if (row.createdAt && typeof row.createdAt.toDate === 'function') {
    row.createdAt = row.createdAt.toDate().toISOString()
  }
  if (row.updatedAt && typeof row.updatedAt.toDate === 'function') {
    row.updatedAt = row.updatedAt.toDate().toISOString()
  }
  return row
}

export const firebaseAdapter = {
  name: 'firebase',

  async list(collection, filter = {}) {
    const conditions = []
    const keys = Object.keys(filter)
    for (let i = 0; i < keys.length; i += 1) {
      conditions.push(where(keys[i], '==', filter[keys[i]]))
    }
    const snap = await getDocs(query(coll(firestore, collection), ...conditions))
    return snap.docs.map((d) => normalize(d.id, d.data()))
  },

  async get(collection, id) {
    const snap = await getDoc(doc(firestore, collection, id))
    return snap.exists() ? normalize(snap.id, snap.data()) : null
  },

  async create(collection, data) {
    const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
    const ref = await addDoc(coll(firestore, collection), payload)
    // serverTimestamp() 要回读才拿得到真实值，这里直接回读保证返回形状一致
    return this.get(collection, ref.id)
  },

  async update(collection, id, patch) {
    await updateDoc(doc(firestore, collection, id), { ...patch, updatedAt: serverTimestamp() })
    return this.get(collection, id)
  },

  async remove(collection, id) {
    await deleteDoc(doc(firestore, collection, id))
  },
}
