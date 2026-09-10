<template>
  <div class="payment-screen">
    <div v-if="activeOrder" class="payment-box">
      <h2>Tilaus nro {{ activeOrder._id }}</h2>
      <p>Maksettava summa: <strong>{{ activeOrder.total }} €</strong></p>
      <p>
        Tila:
        <span class="status-pill" :class="{ 'status-paid': activeOrder.status === 'maksettu' }">{{
          activeOrder.status
        }}</span>
      </p>

      <!-- Tämä on maksun SIMULAATIO opetustarkoitukseen. -->
      <p class="payment-note">
        ⚠️ Tämä on opetustarkoitukseen tehty maksun simulaatio. Oikeita maksutietoja
        ei kerätä — oikeaan maksujen vastaanottoon käytetään palveluita kuten
        Stripe / Paytrail / Klarna.
      </p>

      <button class="btn btn-black btn-block" @click="payForOrder" v-if="activeOrder.status !== 'maksettu'">
        Simuloi maksu
      </button>

      <p v-else class="payment-success">✅ Tilaus on maksettu!</p>

      <button class="btn btn-back btn-block" @click="router.push('/')">Etusivulle</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { activeOrder, payForOrder } from '../store.js'

const router = useRouter()

// Jos tälle sivulle tullaan suoraan (esim. selaimen päivityksellä) ilman
// aktiivista tilausta, ei ole mitään näytettävää — palataan etusivulle.
if (!activeOrder.value) {
  router.replace('/')
}
</script>
