import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(!authService.authEnabled) // local 模式无需等待
  const error = ref('')
  const busy = ref(false)

  const enabled = computed(() => authService.authEnabled)
  // local 模式视为始终已登录，路由守卫直接放行
  const signedIn = computed(() => !authService.authEnabled || user.value !== null)
  const email = computed(() => (user.value ? user.value.email : ''))

  /** 应用启动时调用一次，等 Firebase 恢复完本地会话 */
  function init() {
    if (!authService.authEnabled) return Promise.resolve()
    return new Promise((resolve) => {
      let settled = false
      authService.onAuthChanged((next) => {
        user.value = next
        ready.value = true
        if (!settled) {
          settled = true
          resolve()
        }
      })
    })
  }

  async function signIn(emailInput, password) {
    busy.value = true
    error.value = ''
    try {
      user.value = await authService.signIn(emailInput, password)
      return true
    } catch (err) {
      error.value = authService.authErrorMessage(err)
      return false
    } finally {
      busy.value = false
    }
  }

  async function register(emailInput, password) {
    busy.value = true
    error.value = ''
    try {
      user.value = await authService.register(emailInput, password)
      return true
    } catch (err) {
      error.value = authService.authErrorMessage(err)
      return false
    } finally {
      busy.value = false
    }
  }

  async function signOut() {
    await authService.signOut()
    user.value = null
  }

  return { user, ready, error, busy, enabled, signedIn, email, init, signIn, register, signOut }
})
