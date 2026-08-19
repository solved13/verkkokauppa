<template>
  <button
    type="button"
    class="theme-toggle"
    :title="theme === 'dark' ? 'Enable light theme' : 'Turn on dark mode'"
    :aria-label="theme === 'dark' ? 'Enable light theme' : 'Turn on dark mode'"
    @click="toggleTheme"
  >
    {{ theme === 'dark' ? '☀️' : '🌙' }}
  </button>
</template>

<script setup>
import { theme, toggleTheme } from '../store.js'
</script>