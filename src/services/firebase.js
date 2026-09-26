/**
 * Firebase 应用初始化。全局只初始化一次，其他模块从这里取 firestore / auth 实例。
 */
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!config.projectId) {
  throw new Error(
    'Firebase 配置缺失。请复制 .env.example 为 .env.local 并填入项目配置，' +
    '或把 VITE_DATA_SOURCE 改回 local。',
  )
}

const app = initializeApp(config)

export const firestore = getFirestore(app)
export const auth = getAuth(app)
