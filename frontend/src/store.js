import { ref, computed } from 'vue'

// Backendin osoite.
// VITE_API_URL voidaan asettaa .env-tiedostossa tai ympäristömuuttujana
// (esim. testejä tai eri ympäristöjä varten) — tuotannossa käytetään oletusarvoa.
export const API_URL = import.meta.env.VITE_API_URL || 'https://verkkokauppa.onrender.com/api'

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

// ------------------------------
// SUOSIKIT (tallennetaan selaimen muistiin, säilyy sivun päivityksen yli)
// ------------------------------
export const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'))

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

// ------------------------------
// OSTOSKORI (tallennetaan toistaiseksi vain selaimen muistiin)
// ------------------------------
export const cart = ref([])

export function addToCart(product) {
  // Lasketaan, kuinka monta tätä tuotetta on jo ostoskorissa,
  // jotta emme anna lisätä enempää kuin varastossa on jäljellä.
  const alreadyInCart = cart.value.filter((item) => item._id === product._id).length

  if (alreadyInCart >= product.stock) {
    alert(`Valitettavasti tuotetta "${product.name}" on varastossa vain ${product.stock} kpl`)
    return
  }

  cart.value.push(product)
}

export function clearCart() {
  cart.value = []
}

export const totalItemsInCart = computed(() => cart.value.length)
export const totalPrice = computed(() => cart.value.reduce((sum, item) => sum + item.price, 0))

// ------------------------------
// TILAUKSEN TEKO JA MAKSU
// ------------------------------
export const activeOrder = ref(null)

export async function checkout() {
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
