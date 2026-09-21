<template>
  <div class="site-search" :class="{ open: showDropdown }" v-click-outside="close">
    <div class="site-search-field">
      <span class="site-search-icon" aria-hidden="true">🔍</span>
      <input
        ref="inputEl"
        v-model="queryInput"
        type="text"
        class="site-search-input"
        placeholder="Hae tuotteita…"
        aria-label="Hae tuotteita"
        @input="onInput"
        @focus="onFocus"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="selectActive"
        @keydown.esc="close"
      />
      <button
        v-if="queryInput"
        type="button"
        class="site-search-clear"
        aria-label="Tyhjennä haku"
        @click="clear"
      >
        ✕
      </button>
    </div>

    <div v-if="showDropdown" class="site-search-results">
      <p v-if="searchLoading" class="site-search-status">Haetaan…</p>
      <p v-else-if="searchResults.length === 0" class="site-search-status">
        Ei tuloksia haulle "{{ searchQuery }}"
      </p>
      <ul v-else class="site-search-list">
        <li
          v-for="(product, index) in searchResults"
          :key="product._id"
          class="site-search-result"
          :class="{ active: index === activeIndex }"
          @mouseenter="activeIndex = index"
          @click="goToProduct(product)"
        >
          <img :src="product.image" :alt="product.name" class="site-search-thumb" />
          <span class="site-search-info">
            <span class="site-search-name">{{ product.name }}</span>
            <span class="site-search-meta">
              {{ product.price }} € · {{ product.category === 'old' ? 'Vanhat' : 'Uudet' }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { searchQuery, searchResults, searchLoading, runSiteSearch, clearSiteSearch } from '../store.js'

const router = useRouter()
const inputEl = ref(null)
const queryInput = ref('')
const showDropdown = ref(false)
const activeIndex = ref(-1)

// Debounce — ei laukaista hakua jokaisella näppäinpainalluksella, vaan
// hetken päästä kun käyttäjä on tauottanut kirjoittamisen.
let debounceTimer = null
function onInput() {
  activeIndex.value = -1
  showDropdown.value = true
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    runSiteSearch(queryInput.value)
  }, 250)
}

function onFocus() {
  if (queryInput.value) showDropdown.value = true
}

function close() {
  showDropdown.value = false
}

function clear() {
  queryInput.value = ''
  clearSiteSearch()
  showDropdown.value = false
  nextTick(() => inputEl.value && inputEl.value.focus())
}

function moveActive(delta) {
  if (!showDropdown.value || searchResults.value.length === 0) return
  const max = searchResults.value.length - 1
  let next = activeIndex.value + delta
  if (next < 0) next = max
  if (next > max) next = 0
  activeIndex.value = next
}

function selectActive() {
  if (activeIndex.value === -1 && searchResults.value.length === 1) {
    goToProduct(searchResults.value[0])
    return
  }
  const product = searchResults.value[activeIndex.value]
  if (product) goToProduct(product)
}

function goToProduct(product) {
  close()
  router.push({ path: `/shop/${product.category}`, query: { product: product._id } })
}

// Pieni oma click-outside-direktiivi — ei tarvitse ulkoista riippuvuutta
// pelkästään tätä yhtä käyttötapausta varten.
const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutsideHandler = (event) => {
      if (!el.contains(event.target)) binding.value()
    }
    document.addEventListener('mousedown', el.__clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el.__clickOutsideHandler)
  },
}
</script>