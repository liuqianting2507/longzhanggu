/**
 * 认证服务。仅在 Firebase 数据源下启用；
 * local 数据源不需要登录，authEnabled 为 false，路由守卫会直接放行。
 *
 * 和 db.js 一样用懒加载，避免 local 模式把 Firebase SDK 打进包。
 */
import { dataSourceName } from './db.js'

export const authEnabled = dataSourceName === 'firebase'

let modPromise = null

function load() {
  if (!modPromise) {
    modPromise = Promise.all([
      import('firebase/auth'),
      import('./firebase.js'),
    ]).then(([sdk, app]) => ({ sdk, auth: app.auth }))
  }
  return modPromise
}

/** 把 Firebase 的错误码翻译成给用户看的话 */
export function authErrorMessage(err) {
  const code = err && err.code ? err.code : ''
  if (code === 'auth/invalid-email') return '邮箱格式不正确'
  if (code === 'auth/missing-password') return '请输入密码'
  if (code === 'auth/weak-password') return '密码太短，至少 6 位'
  if (code === 'auth/email-already-in-use') return '该邮箱已注册，请直接登录'
  if (code === 'auth/invalid-credential') return '邮箱或密码不正确'
  if (code === 'auth/user-not-found') return '该邮箱尚未注册'
  if (code === 'auth/wrong-password') return '密码不正确'
  if (code === 'auth/too-many-requests') return '尝试次数过多，请稍后再试'
  if (code === 'auth/network-request-failed') return '网络连接失败，请检查网络'
  if (code === 'auth/operation-not-allowed') {
    return '项目尚未启用「邮箱/密码」登录方式，请在 Firebase 控制台开启'
  }
  return (err && err.message) || '操作失败，请重试'
}

export async function signIn(email, password) {
  const { sdk, auth } = await load()
  const cred = await sdk.signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function register(email, password) {
  const { sdk, auth } = await load()
  const cred = await sdk.createUserWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signOut() {
  const { sdk, auth } = await load()
  await sdk.signOut(auth)
}

/**
 * 订阅登录状态。返回取消订阅函数。
 * 首次回调代表 Firebase 已经恢复完本地会话，可用来决定何时挂载应用。
 */
export async function onAuthChanged(callback) {
  const { sdk, auth } = await load()
  return sdk.onAuthStateChanged(auth, callback)
}
