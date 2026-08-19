import { ref, computed } from 'vue'

// Backendin osoite.

export const API_URL = import.meta.env.VITE_API_URL || 'https://verkkokauppa.onrender.com/api'

// ------------------------------
// TEEMA (vaalea / tumma)

const storedTheme = localStorage.getItem('theme')
const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const theme = ref(storedTheme || (prefersDark ? 'dark' : 'light'))

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
}
applyTheme(theme.value)

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  applyTheme(theme.value)
}

// ------------------------------
// KIRJAUTUMINEN
// ------------------------------
export const token = ref(localStorage.getItem('token') || '')
export const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

// Apufunktio: pyynnön otsikot tokenilla suojattuihin pyyntöihin
export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.value}`,
  }
}

export async function performAuth(mode, form) {
  const endpoint = mode === 'login' ? 'login' : 'register'

  try {
    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await response.json()

    if (!response.ok) {
      return { ok: false, error: data.error || 'Tapahtui virhe' }
    }

    // Tallennetaan token ja käyttäjä localStorageen, ettei tarvitse kirjautua joka kerta
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Yhteys palvelimeen epäonnistui' }
  }
}

export function logout() {
  token.value = ''
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// ------------------------------
// TUOTTEET (haetaan palvelimelta)
// ------------------------------
export const products = ref([])
export const loadingProducts = ref(false)

export async function loadProducts(category) {
  loadingProducts.value = true
  try {
    const response = await fetch(`${API_URL}/products?category=${category}`)
    products.value = await response.json()
  } finally {
    loadingProducts.value = false
  }
}

export async function fetchProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`)
  const data = await response.json()

  if (!response.ok) {
    return { ok: false, error: data.error || 'Tuotteen haku epäonnistui' }
  }

  return { ok: true, product: data }
}

// ------------------------------
// SUOSIKIT (tallennetaan selaimen muistiin, säilyy sivun päivityksen yli)
// ------------------------------
export const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'))


export const wishlistProducts = ref([])
export const loadingWishlistProducts = ref(false)

export async function loadWishlistProducts() {
  loadingWishlistProducts.value = true
  try {
    const response = await fetch(`${API_URL}/products`)
    wishlistProducts.value = await response.json()
  } finally {
    loadingWishlistProducts.value = false
  }
}

export function isWishlisted(product) {
  return wishlist.value.includes(product._id)
}

export function toggleWishlist(product) {
  if (isWishlisted(product)) {
    wishlist.value = wishlist.value.filter((id) => id !== product._id)
  } else {
    wishlist.value = [...wishlist.value, product._id]
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist.value))
}

// OSTOSKORI (tallennetaan toistaiseksi vain selaimen muistiin)

export const cart = ref([])


export const cartError = ref('')
let cartErrorTimer = null

function showCartError(message) {
  cartError.value = message
  clearTimeout(cartErrorTimer)
  cartErrorTimer = setTimeout(() => {
    cartError.value = ''
  }, 4000)
}

function findCartItem(productId) {
  return cart.value.find((item) => item.product._id === productId)
}

export function addToCart(product) {
  const existing = findCartItem(product._id)
  const currentQty = existing ? existing.quantity : 0

  if (currentQty >= product.stock) {
    showCartError(`Valitettavasti tuotetta "${product.name}" on varastossa vain ${product.stock} kpl`)
    return
  }

  if (existing) {
    existing.quantity += 1
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}


export function increaseQuantity(productId) {
  const item = findCartItem(productId)
  if (!item) return

  if (item.quantity >= item.product.stock) {
    showCartError(`Valitettavasti tuotetta "${item.product.name}" on varastossa vain ${item.product.stock} kpl`)
    return
  }

  item.quantity += 1
}

export function decreaseQuantity(productId) {
  const item = findCartItem(productId)
  if (!item) return

  if (item.quantity <= 1) {
    // Viimeisen kappaleen vähentäminen poistaa tuotteen korista kokonaan.
    cart.value = cart.value.filter((i) => i.product._id !== productId)
    return
  }

  item.quantity -= 1
}

export function removeFromCart(productId) {
  cart.value = cart.value.filter((item) => item.product._id !== productId)
}

export function clearCart() {
  cart.value = []
}

export const totalItemsInCart = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0),
)
export const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
)

// ------------------------------
// TILAUKSEN TEKO JA MAKSU
// ------------------------------
export const activeOrder = ref(null)

export async function checkout() {
  // Kori on jo muodossa { product, quantity } per tuote, joten tässä ei
  // tarvitse enää itse laskea, kuinka monta kertaa sama tuote esiintyy.
  const items = cart.value.map((item) => ({
    productId: item.product._id,
    quantity: item.quantity,
  }))

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    })
    const data = await response.json()

    if (!response.ok) {
      return { ok: false, error: data.error || 'Tilauksen teko epäonnistui' }
    }

    activeOrder.value = data
    cart.value = [] // tyhjennetään ostoskori tilauksen jälkeen
    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Yhteys palvelimeen epäonnistui' }
  }
}

export async function payForOrder() {
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
export async function submitProduct(payload) {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (!response.ok) {
      return { ok: false, error: data.error || 'Tuotteen lisäys epäonnistui' }
    }

    await loadProducts(data.category) // päivitetään lista, jotta uusi tuote näkyy heti
    return { ok: true, product: data }
  } catch (err) {
    return { ok: false, error: 'Yhteys palvelimeen epäonnistui' }
  }
}

// ------------------------------
// TUOTTEEN MUOKKAUS JA POISTO
// ------------------------------
export async function updateProduct(id, payload) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (!response.ok) {
      return { ok: false, error: data.error || 'Tuotteen muokkaus epäonnistui' }
    }

    await loadProducts(data.category) // päivitetään lista, jotta muutokset näkyvät heti
    return { ok: true, product: data }
  } catch (err) {
    return { ok: false, error: 'Yhteys palvelimeen epäonnistui' }
  }
}

export async function deleteProduct(id, category) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await response.json()

    if (!response.ok) {
      return { ok: false, error: data.error || 'Tuotteen poisto epäonnistui' }
    }

    await loadProducts(category) // päivitetään lista, jotta poistettu tuote katoaa heti
    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Yhteys palvelimeen epäonnistui' }
  }
}