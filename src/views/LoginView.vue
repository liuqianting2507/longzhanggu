<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useHealthStore } from '@/stores/health.js'

const auth = useAuthStore()
const health = useHealthStore()
const router = useRouter()
const route = useRoute()

const mode = ref('signin') // signin | register
const email = ref('')
const password = ref('')

const isRegister = computed(() => mode.value === 'register')
const valid = computed(() => email.value.trim() !== '' && password.value.length >= 6)

async function submit() {
  if (!valid.value) return
  const ok = isRegister.value
    ? await auth.register(email.value.trim(), password.value)
    : await auth.signIn(email.value.trim(), password.value)
  if (!ok) return
  await health.loadAll()
  router.replace(route.query.redirect || '/dashboard')
}

function switchMode() {
  mode.value = isRegister.value ? 'signin' : 'register'
  auth.error = ''
}
</script>

<template>
  <div class="login-page">
    <form class="card login-card" @submit.prevent="submit">
      <h1>龙掌沽</h1>
      <p class="muted small">客户健康档案管理系统</p>

      <div class="field" style="margin-top: 22px">
        <label>邮箱</label>
        <input v-model="email" type="email" autocomplete="username" placeholder="you@example.com" required />
      </div>

      <div class="field">
        <label>密码{{ isRegister ? '（至少 6 位）' : '' }}</label>
        <input
          v-model="password"
          type="password"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          placeholder="••••••"
          required
        />
      </div>

      <p v-if="auth.error" class="error">{{ auth.error }}</p>

      <button class="primary block" type="submit" :disabled="!valid || auth.busy">
        {{ auth.busy ? '请稍候…' : (isRegister ? '注册并登录' : '登录') }}
      </button>

      <p class="switch small">
        {{ isRegister ? '已经有账号了？' : '还没有账号？' }}
        <a href="#" @click.prevent="switchMode">{{ isRegister ? '去登录' : '注册一个' }}</a>
      </p>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.login-card { width: 100%; max-width: 380px; padding: 28px; }
.login-card h1 { font-size: 22px; }
.block { width: 100%; }
.error {
  background: var(--danger-soft);
  color: var(--danger);
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  margin: 0 0 12px;
}
.switch { text-align: center; margin: 14px 0 0; color: var(--text-muted); }
</style>
