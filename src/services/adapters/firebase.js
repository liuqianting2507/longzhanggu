/**
 * Firebase / Firestore 适配器占位实现（第二版启用）。
 *
 * 启用步骤：
 *   1. npm install firebase
 *   2. 复制 .env.example 为 .env.local，填入 Firebase 控制台的配置
 *   3. 把 VITE_DATA_SOURCE 改为 firebase
 *   4. 解开下方注释，删除 notConfigured 的抛错
 *
 * 集合结构与 localAdapter 完全一致（见 services/models.js 的 COLLECTIONS），
 * 因此切换数据源后业务代码与组件无需改动。
 */

// import { initializeApp } from 'firebase/app'
// import {
//   getFirestore, collection as coll, doc, getDoc, getDocs,
//   addDoc, updateDoc, deleteDoc, query, where, serverTimestamp,
// } from 'firebase/firestore'

// const app = initializeApp({
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// })
// const db = getFirestore(app)

function notConfigured() {
  throw new Error(
    'Firebase 数据源尚未接入。请按 src/services/adapters/firebase.js 顶部的步骤配置，' +
    '或把 VITE_DATA_SOURCE 改回 local。',
  )
}

export const firebaseAdapter = {
  name: 'firebase',

  async list(/* collection, filter = {} */) {
    notConfigured()
    // const conditions = Object.entries(filter).map(([k, v]) => where(k, '==', v))
    // const snap = await getDocs(query(coll(db, collection), ...conditions))
    // return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async get(/* collection, id */) {
    notConfigured()
    // const snap = await getDoc(doc(db, collection, id))
    // return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async create(/* collection, data */) {
    notConfigured()
    // const ref = await addDoc(coll(db, collection), {
    //   ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    // })
    // return { id: ref.id, ...data }
  },

  async update(/* collection, id, patch */) {
    notConfigured()
    // await updateDoc(doc(db, collection, id), { ...patch, updatedAt: serverTimestamp() })
    // return this.get(collection, id)
  },

  async remove(/* collection, id */) {
    notConfigured()
    // await deleteDoc(doc(db, collection, id))
  },
}
