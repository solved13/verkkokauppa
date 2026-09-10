<template>
  <div :class="['shop-screen', category === 'old' ? 'shop-old' : 'shop-new']">
    <header class="shop-header">
      <button class="brand-mark brand-mark-link small" @click="router.push('/')">sneakr</button>
      <h2 class="shop-title">
        {{ category === 'old' ? 'Käytettyjen tennareiden kauppa' : 'Uusien tennareiden kauppa' }}
      </h2>
      <div class="header-right">
        <button
          class="btn btn-ghost btn-sm"
          :class="{ 'btn-ghost-active': showWishlistOnly }"
          @click="showWishlistOnly = !showWishlistOnly"
        >
          ♥ Suosikit ({{ wishlist.length }})
        </button>
        <button class="cart-summary" @click="showCart = true">
          🛒 {{ totalItemsInCart }} kpl — {{ totalPrice }} €
        </button>
      </div>
    </header>

    <div class="shop-body">
      <div class="products-panel">
        <button v-if="user?.isAdmin" class="btn btn-add-product" @click="goToAddProduct">
          + Lisää uusi tuote
        </button>

        <p v-if="loadingProducts" class="loading-text">Ladataan tuotteita…</p>

        <div v-else-if="visibleProducts.length === 0" class="empty-state">
          <p v-if="showWishlistOnly">Suosikkilista on tyhjä. Paina ♥ tuotekortilla lisätäksesi.</p>
          <p v-else>Ei tuotteita tässä kategoriassa vielä.</p>
        </div>

        <template v-else>
          <div class="products-toolbar">
            <span class="products-count">{{ visibleProducts.length }} tuotetta</span>
            <label class="sort-control">
              Järjestä:
              <select v-model="sortBy">
                <option value="default">Suositellut</option>
                <option value="price-asc">Hinta: halvin ensin</option>
                <option value="price-desc">Hinta: kallein ensin</option>
                <option value="name">Nimi A-Ö</option>
              </select>
            </label>
          </div>

          <div class="products-grid">
            <div
              v-for="product in visibleProducts"
              :key="product._id"
              class="product-card"
              :class="{ 'is-out': product.stock === 0 }"
              @click="openProductDetail(product)"
            >
              <!-- Tuotekuva ladataan internetistä annetusta linkistä -->
              <div class="product-image">
                <img :src="product.image" :alt="product.name" class="product-photo" />

                <!-- Merkki "loppuunmyyty", jos tuotetta ei ole varastossa -->
                <span v-if="product.stock === 0" class="stock-badge stock-out">Loppuunmyyty</span>
                <span v-else-if="product.stock <= 3" class="stock-badge stock-low-badge">Vähän jäljellä</span>

                <!-- Suosikki-nappi -->
                <button
                  class="wishlist-btn"
                  :class="{ 'wishlist-btn-active': isWishlisted(product) }"
                  :title="isWishlisted(product) ? 'Poista suosikeista' : 'Lisää suosikkeihin'"
                  @click.stop="toggleWishlist(product)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      d="M12 21s-7.5-4.6-10-9C.6 8.6 2 5 5.5 5 8 5 10 6.8 12 9c2-2.2 4-4 6.5-4C22 5 23.4 8.6 22 12c-2.5 4.4-10 9-10 9z"
                      :fill="isWishlisted(product) ? 'currentColor' : 'none'"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-price">{{ product.price }} €</p>
                <p v-if="product.colors && product.colors.length" class="product-colors-hint">
                  {{ product.colors.length + 1 }} väriä saatavilla
                </p>

                <!-- Varastotilanne: näytetään eri väreillä riippuen jäljellä olevasta määrästä -->
                <p
                  class="stock-info"
                  :class="{
                    'stock-low': product.stock > 0 && product.stock <= 3,
                    'stock-zero': product.stock === 0,
                  }"
                >
                  <span v-if="product.stock === 0">Ei varastossa</span>
                  <span v-else-if="product.stock <= 3">⚠️ Jäljellä {{ product.stock }} kpl</span>
                  <span v-else>Varastossa {{ product.stock }} kpl</span>
                </p>

                <button
                  class="btn btn-add"
                  :disabled="product.stock === 0"
                  @click.stop="addToCart(product)"
                >
                  {{ product.stock === 0 ? 'Ei saatavilla' : 'Lisää ostoskoriin' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Ostoskori avautuu vain, kun asiakas painaa koria ylhäältä -->
    <div v-if="showCart" class="cart-overlay" @click.self="showCart = false">
      <aside class="cart-drawer">
        <div class="cart-drawer-header">
          <h3>Ostoskori</h3>
          <button class="cart-close" @click="showCart = false" aria-label="Sulje ostoskori">✕</button>
        </div>

        <div class="cart-scroll">
          <p v-if="cart.length === 0" class="cart-empty">Ostoskori on tyhjä</p>
          <ul v-else class="cart-list">
            <li v-for="(item, index) in cart" :key="index">
              <span>{{ item.name }}</span>
              <span class="cart-item-price">{{ item.price }} €</span>
            </li>
          </ul>
        </div>

        <div class="cart-footer">
          <p class="cart-total">
            Tuotteiden määrä: {{ totalItemsInCart }}<br />
            Summa yhteensä: <strong>{{ totalPrice }} €</strong>
          </p>

          <div class="cart-buttons" v-if="cart.length > 0">
            <button class="btn btn-clear" @click="clearCart">Tyhjennä ostoskori</button>
            <button class="btn btn-checkout" @click="handleCheckout">Tee tilaus</button>
          </div>

          <p v-if="checkoutError" class="auth-error">{{ checkoutError }}</p>
        </div>
      </aside>
    </div>

    <!-- Tuotteen pikakatselu: tiedot ja värivaihtoehdot -->
    <div v-if="selectedProduct" class="detail-overlay" @click.self="closeProductDetail">
      <div class="detail-modal">
        <button class="cart-close detail-close" @click="closeProductDetail" aria-label="Sulje">✕</button>

        <div class="detail-image">
          <img :src="detailImage" :alt="selectedProduct.name" />
        </div>

        <div class="detail-info">
          <h2 class="detail-name">{{ selectedProduct.name }}</h2>
          <p class="detail-price">{{ selectedProduct.price }} €</p>

          <p v-if="selectedProduct.description" class="detail-description">
            {{ selectedProduct.description }}
          </p>
          <p v-else class="detail-description detail-description-empty">
            Tälle tuotteelle ei ole vielä lisätty kuvausta.
          </p>

          <div v-if="selectedProduct.colors && selectedProduct.colors.length" class="detail-colors">
            <span class="detail-colors-label">Värit</span>
            <div class="color-swatches">
              <button
                class="color-swatch"
                :class="{ 'color-swatch-active': selectedColorIndex === -1 }"
                :title="selectedProduct.name"
                @click="selectedColorIndex = -1"
              >
                <img :src="selectedProduct.image" :alt="selectedProduct.name" />
              </button>
              <button
                v-for="(color, index) in selectedProduct.colors"
                :key="index"
                class="color-swatch"
                :class="{ 'color-swatch-active': selectedColorIndex === index }"
                :title="color.name || 'Väri ' + (index + 2)"
                @click="selectedColorIndex = index"
              >
                <img :src="color.image" :alt="color.name" />
              </button>
            </div>
          </div>

          <p
            class="stock-info"
            :class="{
              'stock-low': selectedProduct.stock > 0 && selectedProduct.stock <= 3,
              'stock-zero': selectedProduct.stock === 0,
            }"
          >
            <span v-if="selectedProduct.stock === 0">Ei varastossa</span>
            <span v-else-if="selectedProduct.stock <= 3">⚠️ Jäljellä {{ selectedProduct.stock }} kpl</span>
            <span v-else>Varastossa {{ selectedProduct.stock }} kpl</span>
          </p>

          <button
            class="btn btn-add btn-block"
            :disabled="selectedProduct.stock === 0"
            @click="addToCart(selectedProduct)"
          >
            {{ selectedProduct.stock === 0 ? 'Ei saatavilla' : 'Lisää ostoskoriin' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  user,
  products,
  loadingProducts,
  loadProducts,
  wishlist,
  isWishlisted,
  toggleWishlist,
  cart,
  addToCart,
  clearCart,
  totalItemsInCart,
  totalPrice,
  checkout,
} from '../store.js'

const route = useRoute()
const router = useRouter()

const category = computed(() => route.params.category)

// ------------------------------
// SUODATUS JA JÄRJESTÄMINEN
// ------------------------------
const showWishlistOnly = ref(false)
const sortBy = ref('default')

const visibleProducts = computed(() => {
  let list = showWishlistOnly.value
    ? products.value.filter((product) => isWishlisted(product))
    : products.value

  if (sortBy.value === 'price-asc') {
    list = [...list].sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price-desc') {
    list = [...list].sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  }

  return list
})

// ------------------------------
// TUOTTEEN PIKAKATSELU (nimi, kuvaus, värivaihtoehdot)
// ------------------------------
const selectedProduct = ref(null)
const selectedColorIndex = ref(-1) // -1 = tuotteen oma pääkuva

function openProductDetail(product) {
  selectedProduct.value = product
  selectedColorIndex.value = -1
}

function closeProductDetail() {
  selectedProduct.value = null
}

const detailImage = computed(() => {
  if (!selectedProduct.value) return ''
  const colors = selectedProduct.value.colors || []
  const selected = selectedColorIndex.value >= 0 ? colors[selectedColorIndex.value] : null
  return (selected && selected.image) || selectedProduct.value.image
})

// ------------------------------
// OSTOSKORI
// ------------------------------
const showCart = ref(false)
const checkoutError = ref('')

async function handleCheckout() {
  checkoutError.value = ''
  const result = await checkout()

  if (!result.ok) {
    checkoutError.value = result.error
    return
  }

  showCart.value = false
  router.push('/payment')
}

// Kun kategoria vaihtuu URL:ssa (esim. /shop/old -> /shop/new), nollataan
// näytön oma tila ja ladataan uuden kategorian tuotteet palvelimelta.
watch(
  category,
  (newCategory) => {
    showWishlistOnly.value = false
    showCart.value = false
    selectedProduct.value = null
    loadProducts(newCategory)
  },
  { immediate: true }
)

function goToAddProduct() {
  router.push({ path: '/admin/products/new', query: { category: category.value } })
}
</script>
