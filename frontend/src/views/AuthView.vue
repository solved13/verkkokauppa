<template>
  <div class="auth-screen">
    <div class="auth-box">
      <div class="brand-mark">sneakr</div>
      <h2>{{ authMode === 'login' ? 'Kirjaudu sisään' : 'Rekisteröidy' }}</h2>

      <p v-if="authError" class="auth-error">{{ authError }}</p>

      <div class="field">
        <input
          v-if="authMode === 'register'"
          v-model="authForm.name"
          type="text"
          placeholder="Nimi"
        />
      </div>
      <div class="field">
        <input v-model="authForm.email" type="email" placeholder="Sähköposti" />
      </div>
      <div class="field">
        <input v-model="authForm.password" type="password" placeholder="Salasana" />
      </div>

      <button class="btn btn-black btn-block" @click="submitAuth">
        {{ authMode === 'login' ? 'Kirjaudu' : 'Rekisteröidy' }}
      </button>

      <p class="auth-switch">
        <span v-if="authMode === 'login'">
          Ei vielä tiliä?
          <a href="#" @click.prevent="authMode = 'register'">Rekisteröidy</a>
        </span>
        <span v-else>
          Onko sinulla jo tili?
          <a href="#" @click.prevent="authMode = 'login'">Kirjaudu sisään</a>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { performAuth } from '../store.js'

const router = useRouter()

const authMode = ref('login') // 'login' tai 'register'
const authForm = ref({ name: '', email: '', password: '' })
const authError = ref('')

async function submitAuth() {
  authError.value = ''
  const result = await performAuth(authMode.value, authForm.value)

  if (!result.ok) {
    authError.value = result.error
    return
  }

  router.push('/')
}
</script>
