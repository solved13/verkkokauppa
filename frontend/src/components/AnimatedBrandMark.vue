<template>
  <button
    type="button"
    class="brand-mark brand-mark-animated"
    :class="{ small }"
    :aria-label="text"
    @click="playWalk"
  >
    <Transition name="fade">
      <span v-if="isWalking" :key="playKey" class="footstep-scene" aria-hidden="true">
        <!-- Paljaat jalanjäljet kävelevät logoa kohti vasemmalta -->
        <span class="footstep-trail footstep-trail-left">
          <svg
            v-for="n in 3"
            :key="'bare' + n"
            class="footstep footstep-bare"
            :style="{ '--step': n - 1 }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <ellipse cx="12" cy="15.5" rx="5.4" ry="7.2" />
            <circle cx="7.4" cy="5.2" r="1.5" />
            <circle cx="10.6" cy="3.2" r="1.7" />
            <circle cx="14.2" cy="3" r="1.7" />
            <circle cx="17.2" cy="4.8" r="1.4" />
          </svg>
        </span>

        <!-- Kengänpohjan jäljet jatkavat matkaa logosta oikealle -->
        <span class="footstep-trail footstep-trail-right">
          <svg
            v-for="n in 3"
            :key="'shoe' + n"
            class="footstep footstep-shoe"
            :style="{ '--step': n - 1 }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12 2c3.8 0 5.6 3 5.6 6.8 0 2.8-1 4.7-1 7.6 0 3-2 4.8-4.6 4.8s-4.6-1.8-4.6-4.8c0-2.9-1-4.8-1-7.6C6.4 5 8.2 2 12 2z"
            />
            <path d="M7.4 9h9.2M7 12.6h10M7.2 16.2h9.6" stroke-width="1.6" opacity="0.75" />
          </svg>
        </span>
      </span>
    </Transition>
    <span class="brand-mark-text">{{ text }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

// Askeleet käynnistyvät vain, kun käyttäjä itse painaa logoa — ei
// automaattisesti sivun latautuessa eikä jokaisella kerralla, kun logo
// toimii "koti"-linkkinä muualla sovelluksessa (ShopView/WishlistView
// käyttävät edelleen tavallista .brand-mark-link -painiketta ilman tätä
// komponenttia), koska animaatio joka klikkauksella olisi liikaa.
//
// Tarina: paljaat jalanjäljet kävelevät logoa kohti vasemmalta (3 askelta),
// ja heti perään kengänpohjan jäljet jatkavat matkaa logosta oikealle
// (3 askelta) — ikään kuin asiakas olisi tullut paljain jaloin ja lähtisi
// pois uusissa tennareissa.
defineProps({
  text: { type: String, default: 'AskeL' },
  small: { type: Boolean, default: false },
})

const isWalking = ref(false)
const playKey = ref(0)
let hideTimer = null

// 3 paljasta askelta + 3 kenkäaskelta, 110ms viive per askel, 300ms
// ponnahdusanimaatio ja pieni pito lopussa ennen häivytystä.
const STEP_DELAY_MS = 110
const STEP_DURATION_MS = 300
const HOLD_MS = 600
const TOTAL_MS = 5 * STEP_DELAY_MS + STEP_DURATION_MS + HOLD_MS

function playWalk() {
  clearTimeout(hideTimer)
  // playKey vaihtuu joka klikkauksella, joten Vue luo <span>:in uudelleen
  // ja CSS-animaatio käynnistyy aina alusta, vaikka edellinen olisi kesken.
  playKey.value += 1
  isWalking.value = true
  hideTimer = setTimeout(() => {
    isWalking.value = false
  }, TOTAL_MS)
}
</script>