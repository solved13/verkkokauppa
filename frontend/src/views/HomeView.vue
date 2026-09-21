<template>
  <div class="choice-screen">
    <div class="user-bar">
      <div class="user-bar-left">
        <AnimatedBrandMark small />
      </div>
      <SearchBar />
      <div class="user-bar-right">
        <ThemeToggle />
        <span class="hello-text">Hei, {{ user?.name }}!</span>
        <span v-if="user?.isAdmin" class="admin-badge">Ylläpitäjä</span>
        <button
          v-if="wishlist.length"
          class="btn btn-ghost btn-sm"
          @click="router.push('/wishlist')"
        >
          ♥ {{ wishlist.length }}
        </button>
        <button class="btn btn-back" @click="handleLogout">Kirjaudu ulos</button>
      </div>
    </div>

    <div class="choice-halves">
      <div class="choice-half choice-black" @click="openShop('old')">
        <span class="choice-tag">Retro</span>
        <h1 class="choice-title">VANHOJA TENNAREITA</h1>
        <p class="choice-desc">
          Klassisia malleja historialla. Todistettua laatua edulliseen hintaan.
        </p>
      </div>

      <div class="choice-half choice-white" @click="openShop('new')">
        <span class="choice-tag">Uutuus</span>
        <h1 class="choice-title">UUDET TENNARIT</h1>
        <p class="choice-desc">
          Kauden uusimmat julkaisut. Modernia muotoilua ja teknologiaa.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { user, wishlist, logout } from '../store.js'
import ThemeToggle from '../components/ThemeToggle.vue'
import AnimatedBrandMark from '../components/AnimatedBrandMark.vue'
import SearchBar from '../components/SearchBar.vue'

const router = useRouter()

function openShop(type) {
  router.push(`/shop/${type}`)
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>