<template>
  <div class="shop-screen">
    <!-- Банер помилки кошика, як і на сторінці магазину -->
    <transition name="fade">
      <p v-if="cartError" class="cart-toast">{{ cartError }}</p>
    </transition>

    <header class="shop-header">
      <AnimatedBrandMark small @click="goHome" />
      <h2 class="shop-title">Suosikit</h2>
      <div class="header-right">
        <ThemeToggle />
        <button class="cart-summary" @click="showCart = true">
          🛒 {{ totalItemsInCart }} kpl — {{ totalPrice }} €
        </button>
      </div>
    </header>

    <div class="shop-body">
      <div class="products-panel">
        <p v-if="loadingWishlistProducts" class="loading-text">Ladataan suosikkeja…</p>

        <div v-else-if="favoriteProducts.length === 0" class="empty-state">
          <p>Suosikkilista on tyhjä. Paina ♥ tuotekortilla kaupassa lisätäksesi.</p>
        </div>

        <template v-else>
          <div class="products-toolbar">
            <span class="products-count">{{ favoriteProducts.length }} tuotetta</span>
          </div>

          <div class="products-grid">
            <div
              v-for="product in favoriteProducts"
              :key="product._id"
              class="product-card"
              :class="{ 'is-out': product.stock === 0 }"
              @click="openProductDetail(product)"
            >
              <div class="product-image">
                <img :src="product.image" :alt="product.name" class="product-photo" />

                <span v-if="product.stock === 0" class="stock-badge stock-out">Loppuunmyyty</span>
                <span v-else-if="product.stock <= 3" class="stock-badge stock-low-badge">Vähän jäljellä</span>

                <!-- Suosikki-nappi — täältä voi myös poistaa suosikeista -->
                <button
                  class="wishlist-btn wishlist-btn-active"
                  title="Poista suosikeista"
                  @click.stop="toggleWishlist(product)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      d="M12 21s-7.5-4.6-10-9C.6 8.6 2 5 5.5 5 8 5 10 6.8 12 9c2-2.2 4-4 6.5-4C22 5 23.4 8.6 22 12c-2.5 4.4-10 9-10 9z"
                      fill="currentColor"
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

    <!-- Ostoskori — sama rakenne kuin ShopView.vue:ssa -->
    <div v-if="showCart" class="cart-overlay" @click.self="showCart = false">
      <aside class="cart-drawer">
        <div class="cart-drawer-header">
          <h3>Ostoskori</h3>
          <button class="cart-close" @click="showCart = false" aria-label="Sulje ostoskori">✕</button>
        </div>

        <div class="cart-scroll">
          <p v-if="cart.length === 0" class="cart-empty">Ostoskori on tyhjä</p>
          <ul v-else class="cart-list">
            <li v-for="item in cart" :key="item.product._id" class="cart-item">
              <img :src="item.product.image" :alt="item.product.name" class="cart-item-image" />
              <span class="cart-item-name">{{ item.product.name }}</span>

              <div class="qty-stepper">
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Vähennä määrää"
                  @click="decreaseQuantity(item.product._id)"
                >
                  −
                </button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Lisää määrää"
                  :disabled="item.quantity >= item.product.stock"
                  @click="increaseQuantity(item.product._id)"
                >
                  +
                </button>
              </div>

              <span class="cart-item-price">{{ item.product.price * item.quantity }} €</span>
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

    <!-- Tuotteen pikakatselu — sama rakenne kuin ShopView.vue:ssa -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '../components/ThemeToggle.vue'
import AnimatedBrandMark from '../components/AnimatedBrandMark.vue'
import {
  wishlistProducts,
  loadingWishlistProducts,
  loadWishlistProducts,
  isWishlisted,
  toggleWishlist,
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  cartError,
  clearCart,
  totalItemsInCart,
  totalPrice,
  checkout,
} from '../store.js'

const router = useRouter()

// Haetaan kaikki tuotteet (yli kategorioiden) ja suodatetaan ne, jotka ovat
// suosikeissa — sama data, jota .header-right:in "♥ Suosikit"-laskuri käyttää.
onMounted(() => {
  loadWishlistProducts()
})

const favoriteProducts = computed(() =>
  wishlistProducts.value.filter((product) => isWishlisted(product)),
)

// ------------------------------
// TUOTTEEN PIKAKATSELU
// ------------------------------
const selectedProduct = ref(null)
const selectedColorIndex = ref(-1)

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


function goHome() {
  setTimeout(() => {
    router.push('/')
  }, 800)
}
</script>