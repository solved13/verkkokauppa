<template>
  <div class="choice-screen">
    <div class="user-bar">
      <div class="user-bar-left">
        <span class="brand-mark small">sneakr</span>
      </div>
      <div class="user-bar-right">
        <span class="hello-text">Hei, {{ user?.name }}!</span>
        <span v-if="user?.isAdmin" class="admin-badge">Ylläpitäjä</span>
        <button v-if="wishlist.length" class="btn btn-ghost btn-sm" @click="goToWishlist">
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
        <button class="btn btn-white btn-arrow" @click.stop="openShop('old')">
          Mene kauppaan <span class="arrow">→</span>
        </button>
      </div>

      <div class="choice-half choice-white" @click="openShop('new')">
        <span class="choice-tag">Uutuus</span>
        <h1 class="choice-title">UUDET TENNARIT</h1>
        <p class="choice-desc">
          Kauden uusimmat julkaisut. Modernia muotoilua ja teknologiaa.
        </p>
        <button class="btn btn-black btn-arrow" @click.stop="openShop('new')">
          Mene kauppaan <span class="arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { user, wishlist, logout } from '../store.js'

const router = useRouter()

function openShop(type) {
  router.push(`/shop/${type}`)
}

function goToWishlist() {
  router.push({ path: '/shop/new', query: { wishlist: '1' } })
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>
