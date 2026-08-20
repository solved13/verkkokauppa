<template>
  <div id="app">

    <!-- ===================== -->
    <!-- NÄYTTÖ 0: KIRJAUTUMINEN/REKISTERÖINTI -->
    <!-- ===================== -->
    <div v-if="currentPage === 'auth'" class="auth-screen">
      <div class="auth-box">
        <h2>{{ authMode === 'login' ? 'Kirjaudu sisään' : 'Rekisteröidy' }}</h2>

        <p v-if="authError" class="auth-error">{{ authError }}</p>

        <input
          v-if="authMode === 'register'"
          v-model="authForm.name"
          type="text"
          placeholder="Nimi"
        />
        <input v-model="authForm.email" type="email" placeholder="Sähköposti" />
        <input v-model="authForm.password" type="password" placeholder="Salasana" />

        <button class="btn btn-black" @click="submitAuth">
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

    <!-- ===================== -->
    <!-- NÄYTTÖ 1: VALINTA VANHAT/UUDET -->
    <!-- ===================== -->
    <div v-if="currentPage === 'home'" class="choice-screen">
      <div class="user-bar">
        Hei, {{ user?.name }}!
        <span v-if="user?.isAdmin" class="admin-badge">Ylläpitäjä</span>
        <button class="btn btn-back" @click="logout">Kirjaudu ulos</button>
      </div>

      <div class="choice-halves">
        <div class="choice-half choice-black" @click="openShop('old')">
          <h1 class="choice-title">VANHOJA TENNAREITA</h1>
          <p class="choice-desc">
            Klassisia malleja historialla. Todistettua laatua edulliseen hintaan.
          </p>
          <button class="btn btn-white" @click.stop="openShop('old')">
            Mene kauppaan
          </button>
        </div>

        <div class="choice-half choice-white" @click="openShop('new')">
          <h1 class="choice-title">UUDET TENNARIT</h1>
          <p class="choice-desc">
            Kauden uusimmat julkaisut. Modernia muotoilua ja teknologiaa.
          </p>
          <button class="btn btn-black" @click.stop="openShop('new')">
            Mene kauppaan
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== -->
    <!-- NÄYTTÖ 2: TUOTELUETTELO -->
    <!-- ===================== -->
    <div v-if="currentPage === 'shop'" class="shop-screen">
      <header class="shop-header">
        <button class="btn btn-back" @click="goHome">← Takaisin</button>
        <h2 class="shop-title">
          {{ category === 'old' ? 'Käytettyjen tennareiden kauppa' : 'Uusien tennareiden kauppa' }}
        </h2>
        <div class="cart-summary">
          🛒 {{ totalItemsInCart }} kpl — {{ totalPrice }} €
        </div>
      </header>

      <button v-if="user?.isAdmin" class="btn btn-add-product" @click="openAddProduct">
        + Lisää uusi tuote
      </button>

      <p v-if="loadingProducts">Ladataan tuotteita…</p>

      <div v-else class="products-grid">
        <div v-for="product in products" :key="product._id" class="product-card">
          <!-- Tuotekuva ladataan internetistä annetusta linkistä -->
          <div class="product-image">
            <img :src="product.image" :alt="product.name" class="product-photo" />
            <!-- Merkki "loppuunmyyty", jos tuotetta ei ole varastossa -->
            <span v-if="product.stock === 0" class="stock-badge stock-out">Loppuunmyyty</span>
          </div>
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-price">{{ product.price }} €</p>

          <!-- Varastotilanne: näytetään eri väreillä riippuen jäljellä olevasta määrästä -->
          <p
            class="stock-info"
            :class="{
              'stock-low': product.stock > 0 && product.stock <= 3,
              'stock-zero': product.stock === 0,
            }"
          >
            <span v-if="product.stock === 0">Ei varastossa</span>
            <span v-else-if="product.stock <= 3">⚠️ Loppumassa! Jäljellä {{ product.stock }} kpl</span>
            <span v-else>Varastossa {{ product.stock }} kpl</span>
          </p>

          <button
            class="btn btn-add"
            :disabled="product.stock === 0"
            @click="addToCart(product)"
          >
            {{ product.stock === 0 ? 'Ei saatavilla' : 'Lisää ostoskoriin' }}
          </button>
        </div>
      </div>

      <div class="cart-box">
        <h3>Ostoskori</h3>
        <p v-if="cart.length === 0">Ostoskori on tyhjä</p>
        <ul v-else class="cart-list">
          <li v-for="(item, index) in cart" :key="index">{{ item.name }} — {{ item.price }} €</li>
        </ul>

        <p class="cart-total">
          Tuotteiden määrä: {{ totalItemsInCart }}<br />
          Summa yhteensä: {{ totalPrice }} €
        </p>

        <div class="cart-buttons" v-if="cart.length > 0">
          <button class="btn btn-clear" @click="clearCart">Tyhjennä ostoskori</button>
          <button class="btn btn-checkout" @click="checkout">Tee tilaus</button>
        </div>

        <p v-if="checkoutError" class="auth-error">{{ checkoutError }}</p>
      </div>
    </div>

    <!-- ===================== -->
    <!-- NÄYTTÖ 3: TILAUKSEN MAKSU -->
    <!-- ===================== -->
    <div v-if="currentPage === 'payment'" class="payment-screen">
      <div class="payment-box">
        <h2>Tilaus nro {{ activeOrder._id }}</h2>
        <p>Maksettava summa: <strong>{{ activeOrder.total }} €</strong></p>
        <p>Tila: {{ activeOrder.status }}</p>

        <!-- Tämä on maksun SIMULAATIO opetustarkoitukseen. -->
        <p class="payment-note">
          ⚠️ Tämä on opetustarkoitukseen tehty maksun simulaatio. Oikeita maksutietoja
          ei kerätä — oikeaan maksujen vastaanottoon käytetään palveluita kuten
          Stripe / Paytrail / Klarna.
        </p>

        <button class="btn btn-black" @click="payForOrder" v-if="activeOrder.status !== 'maksettu'">
          Simuloi maksu
        </button>

        <p v-else class="payment-success">✅ Tilaus on maksettu!</p>

        <button class="btn btn-back" @click="goHome">Etusivulle</button>
      </div>
    </div>

    <!-- ===================== -->
    <!-- NÄYTTÖ 4: UUDEN TUOTTEEN LISÄYS -->
    <!-- ===================== -->
    <div v-if="currentPage === 'addProduct'" class="add-product-screen">
      <div class="add-product-box">
        <h2>Lisää uusi tuote</h2>

        <p v-if="addProductError" class="auth-error">{{ addProductError }}</p>
        <p v-if="addProductSuccess" class="payment-success">✅ Tuote lisätty!</p>

        <input v-model="newProduct.name" type="text" placeholder="Tuotteen nimi" />
        <input v-model="newProduct.price" type="number" placeholder="Hinta (€)" />
        <input v-model="newProduct.stock" type="number" placeholder="Varaston määrä (kpl)" />
        <input v-model="newProduct.image" type="text" placeholder="Kuvan linkki (URL)" />

        <select v-model="newProduct.category">
          <option value="old">Vanhat tennarit</option>
          <option value="new">Uudet tennarit</option>
        </select>

        <div class="add-product-buttons">
          <button class="btn btn-back" @click="goToShop">Peruuta</button>
          <button class="btn btn-black" @click="submitNewProduct">Tallenna tuote</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Backendin osoite
const API_URL = 'https://verkkokauppa.onrender.com/api'

// ------------------------------
// NAVIGOINTI
// ------------------------------
// 'auth' -> kirjautuminen/rekisteröinti, 'home' -> kategorian valinta,
// 'shop' -> tuoteluettelo, 'payment' -> tilauksen maksu
const currentPage = ref('auth')
const category = ref('old')

function goHome() {
  currentPage.value = 'home'
}

function openShop(type) {
  category.value = type
  currentPage.value = 'shop'
  loadProducts()
}

// ------------------------------
// KIRJAUTUMINEN
// ------------------------------
const token = ref(localStorage.getItem('token') || '')
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const authMode = ref('login') // 'login' tai 'register'
const authForm = ref({ name: '', email: '', password: '' })
const authError = ref('')

// Jos token on jo tallennettu selaimeen — päästetään suoraan etusivulle
onMounted(() => {
  if (token.value && user.value) {
    currentPage.value = 'home'
  }
})

async function submitAuth() {
  authError.value = ''
  const endpoint = authMode.value === 'login' ? 'login' : 'register'

  try {
    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm.value),
    })
    const data = await response.json()

    if (!response.ok) {
      authError.value = data.error || 'Tapahtui virhe'
      return
    }

    // Tallennetaan token ja käyttäjä localStorageen, ettei tarvitse kirjautua joka kerta
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    currentPage.value = 'home'
  } catch (err) {
    authError.value = 'Yhteys palvelimeen epäonnistui'
  }
}

function logout() {
  token.value = ''
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  currentPage.value = 'auth'
}

// Apufunktio: pyynnön otsikot tokenilla suojattuihin pyyntöihin
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.value}`,
  }
}

// ------------------------------
// TUOTTEET (haetaan palvelimelta)
// ------------------------------
const products = ref([])
const loadingProducts = ref(false)

async function loadProducts() {
  loadingProducts.value = true
  try {
    const response = await fetch(`${API_URL}/products?category=${category.value}`)
    products.value = await response.json()
  } finally {
    loadingProducts.value = false
  }
}

// ------------------------------
// OSTOSKORI (tallennetaan toistaiseksi vain selaimen muistiin)
// ------------------------------
const cart = ref([])

function addToCart(product) {
  // Lasketaan, kuinka monta tätä tuotetta on jo ostoskorissa,
  // jotta emme anna lisätä enempää kuin varastossa on jäljellä.
  const alreadyInCart = cart.value.filter((item) => item._id === product._id).length

  if (alreadyInCart >= product.stock) {
    alert(`Valitettavasti tuotetta "${product.name}" on varastossa vain ${product.stock} kpl`)
    return
  }

  cart.value.push(product)
}

function clearCart() {
  cart.value = []
}

const totalItemsInCart = computed(() => cart.value.length)
const totalPrice = computed(() => cart.value.reduce((sum, item) => sum + item.price, 0))

// ------------------------------
// TILAUKSEN TEKO JA MAKSU
// ------------------------------
const activeOrder = ref(null)
const checkoutError = ref('')

async function checkout() {
  checkoutError.value = ''

  // Lasketaan kunkin tuotteen määrä ostoskorissa palvelinta varten
  // (MongoDB:n _id on merkkijono, ei numero — siksi ei muunneta Number():ksi)
  const itemsMap = {}
  for (const item of cart.value) {
    itemsMap[item._id] = (itemsMap[item._id] || 0) + 1
  }
  const items = Object.entries(itemsMap).map(([productId, quantity]) => ({
    productId,
    quantity,
  }))

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    })
    const data = await response.json()

    if (!response.ok) {
      checkoutError.value = data.error || 'Tilauksen teko epäonnistui'
      return
    }

    activeOrder.value = data
    cart.value = [] // tyhjennetään ostoskori tilauksen jälkeen
    currentPage.value = 'payment'
  } catch (err) {
    checkoutError.value = 'Yhteys palvelimeen epäonnistui'
  }
}

async function payForOrder() {
  const response = await fetch(`${API_URL}/orders/${activeOrder.value._id}/pay`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const data = await response.json()
  if (response.ok) {
    activeOrder.value = data
  }
}

// ------------------------------
// UUDEN TUOTTEEN LISÄYS
// ------------------------------
const newProduct = ref({ name: '', price: '', stock: '', image: '', category: 'old' })
const addProductError = ref('')
const addProductSuccess = ref(false)

function openAddProduct() {
  addProductError.value = ''
  addProductSuccess.value = false
  // Ehdotetaan oletuksena samaa kategoriaa, jota käyttäjä parhaillaan katsoo
  newProduct.value = { name: '', price: '', stock: '', image: '', category: category.value }
  currentPage.value = 'addProduct'
}

function goToShop() {
  currentPage.value = 'shop'
}

async function submitNewProduct() {
  addProductError.value = ''
  addProductSuccess.value = false

  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(newProduct.value),
    })
    const data = await response.json()

    if (!response.ok) {
      addProductError.value = data.error || 'Tuotteen lisäys epäonnistui'
      return
    }

    addProductSuccess.value = true
    category.value = data.category // varmistetaan oikea kategoria näkyville
    await loadProducts() // päivitetään lista, jotta uusi tuote näkyy heti
    currentPage.value = 'shop'
  } catch (err) {
    addProductError.value = 'Yhteys palvelimeen epäonnistui'
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'Segoe UI', Arial, sans-serif;
}
#app {
  min-height: 100vh;
}

/* ---------- Kirjautuminen ---------- */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111;
}
.auth-box {
  background: #fff;
  padding: 32px;
  border-radius: 10px;
  width: 320px;
  text-align: center;
}
.auth-box input {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}
.auth-error {
  color: #c62828;
  font-size: 0.9rem;
}
.auth-switch {
  margin-top: 14px;
  font-size: 0.9rem;
}

/* ---------- Kategorian valinta ---------- */
.user-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f0f0f0;
}
.admin-badge {
  background-color: #1565c0;
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}
.choice-halves {
  display: flex;
  min-height: calc(100vh - 56px);
}
.choice-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.choice-half:hover {
  filter: brightness(1.15);
}
.choice-black {
  background-color: #111111;
  color: #ffffff;
}
.choice-white {
  background-color: #f5f5f5;
  color: #111111;
}
.choice-title {
  font-size: 2.5rem;
  margin-bottom: 16px;
}
.choice-desc {
  max-width: 320px;
  margin-bottom: 32px;
  font-size: 1.1rem;
  line-height: 1.5;
}

/* ---------- Napit ---------- */
.btn {
  padding: 12px 28px;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.1s ease, opacity 0.2s ease;
}
.btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}
.btn-white {
  background-color: #ffffff;
  color: #111111;
}
.btn-black {
  background-color: #111111;
  color: #ffffff;
}
.btn-back {
  background-color: #e0e0e0;
  color: #111111;
}
.btn-add {
  background-color: #2e7d32;
  color: #ffffff;
  width: 100%;
  margin-top: 12px;
}
.btn-clear {
  background-color: #c62828;
  color: #ffffff;
}
.btn-checkout {
  background-color: #1565c0;
  color: #ffffff;
}
.cart-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

/* ---------- Kauppa ---------- */
.shop-screen {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.cart-summary {
  font-weight: 600;
  background-color: #f0f0f0;
  padding: 8px 14px;
  border-radius: 6px;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.product-image {
  width: 100%;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background-color: #f0f0f0;
}
.product-photo {
  width: 100%;
  height: 100%;
  object-fit: cover; /* kuva rajautuu kauniisti eikä veny */
}
.cart-box {
  border-top: 2px solid #e0e0e0;
  padding-top: 20px;
}

/* ---------- Varastotilanne ---------- */
.product-image {
  position: relative;
}
.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}
.stock-out {
  background-color: #c62828;
}
.stock-info {
  font-size: 0.85rem;
  color: #555;
  margin: 4px 0 0;
}
.stock-low {
  color: #e65100;
  font-weight: 600;
}
.stock-zero {
  color: #c62828;
  font-weight: 600;
}
.btn-add:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
  transform: none;
}
.btn-add-product {
  background-color: #1565c0;
  color: #fff;
  margin-bottom: 20px;
}

/* ---------- Uuden tuotteen lisäys ---------- */
.add-product-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}
.add-product-box {
  background: #fff;
  padding: 32px;
  border-radius: 10px;
  width: 360px;
  text-align: center;
}
.add-product-box input,
.add-product-box select {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}
.add-product-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

/* ---------- Maksu ---------- */
.payment-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}
.payment-box {
  background: #fff;
  padding: 32px;
  border-radius: 10px;
  width: 380px;
  text-align: center;
}
.payment-note {
  font-size: 0.85rem;
  color: #555;
  background: #fff8e1;
  padding: 10px;
  border-radius: 6px;
  margin: 16px 0;
}
.payment-success {
  color: #2e7d32;
  font-weight: 700;
  margin: 16px 0;
}

@media (max-width: 700px) {
  .choice-halves {
    flex-direction: column;
  }
}
</style>
