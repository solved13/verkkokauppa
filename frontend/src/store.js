import { ref, computed } from "vue";

// Backendin osoite.

export const API_URL =
  import.meta.env.VITE_API_URL || "https://verkkokauppa.onrender.com/api";


// TEEMA (vaalea / tumma)

const storedTheme = localStorage.getItem("theme");
const prefersDark =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const theme = ref(storedTheme || (prefersDark ? "dark" : "light"));

function applyTheme(value) {
  document.documentElement.setAttribute("data-theme", value);
}
applyTheme(theme.value);

export function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme.value);
  applyTheme(theme.value);
}
// TOKEN ja KÄYTTÄJA

export const token = ref(localStorage.getItem("token") || "");
export const user = ref(JSON.parse(localStorage.getItem("user") || "null"));

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token.value}`,
  };
}

export async function performAuth(mode, form) {
  const endpoint = mode === "login" ? "login" : "register";

  try {
    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error || "Tapahtui virhe" };
    }

    token.value = data.token;
    user.value = data.user;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Yhteys palvelimeen epäonnistui" };
  }
}

export function logout() {
  token.value = "";
  user.value = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export const products = ref([]);
export const loadingProducts = ref(false);

export async function loadProducts(category) {
  loadingProducts.value = true;
  try {
    const response = await fetch(`${API_URL}/products?category=${category}`);
    products.value = await response.json();
  } finally {
    loadingProducts.value = false;
  }
}
// HAKU 

export async function fetchProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  const data = await response.json();

  if (!response.ok) {
    return { ok: false, error: data.error || "Tuotteen haku epäonnistui" };
  }

  return { ok: true, product: data };
}

function normalizeSearchText(str) {
  return (str || "").toLowerCase().trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

function maxAllowedTypoDistance(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

function wordMatchScore(token, word) {
  if (!word) return 0;
  if (word === token) return 3;
  if (word.startsWith(token)) return 2.5;
  if (word.includes(token)) return 2;
  const distance = levenshtein(token, word);
  if (distance <= maxAllowedTypoDistance(token.length))
    return 1.5 - distance * 0.3;
  return 0;
}

function categorySearchText(category) {
  return category === "old"
    ? "vanhat käytetyt tennarit retro"
    : "uudet tennarit uutuus";
}

function scoreProductForSearch(product, tokens) {
  const fields = [
    { text: product.name, weight: 3 },
    { text: categorySearchText(product.category), weight: 1.5 },
    { text: product.description, weight: 1 },
  ];

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      const words = normalizeSearchText(field.text).split(/\s+/);
      for (const word of words) {
        const score = wordMatchScore(token, word) * field.weight;
        if (score > best) best = score;
      }
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export const searchQuery = ref("");
export const searchResults = ref([]);
export const searchLoading = ref(false);

let searchProductsCache = null;

export function invalidateSearchCache() {
  searchProductsCache = null;
}

async function getAllProductsForSearch() {
  if (searchProductsCache) return searchProductsCache;
  const response = await fetch(`${API_URL}/products`);
  searchProductsCache = await response.json();
  return searchProductsCache;
}

export async function runSiteSearch(query) {
  searchQuery.value = query;
  const trimmed = normalizeSearchText(query);

  if (!trimmed) {
    searchResults.value = [];
    return;
  }

  searchLoading.value = true;
  try {
    const all = await getAllProductsForSearch();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    searchResults.value = all
      .map((product) => ({
        product,
        score: scoreProductForSearch(product, tokens),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.product);
  } finally {
    searchLoading.value = false;
  }
}

export function clearSiteSearch() {
  searchQuery.value = "";
  searchResults.value = [];
}
// WISHLIST 

export const wishlist = ref(
  JSON.parse(localStorage.getItem("wishlist") || "[]"),
);

export const wishlistProducts = ref([]);
export const loadingWishlistProducts = ref(false);

export async function loadWishlistProducts() {
  loadingWishlistProducts.value = true;
  try {
    const response = await fetch(`${API_URL}/products`);
    wishlistProducts.value = await response.json();
  } finally {
    loadingWishlistProducts.value = false;
  }
}

export function isWishlisted(product) {
  return wishlist.value.includes(product._id);
}

export function toggleWishlist(product) {
  if (isWishlisted(product)) {
    wishlist.value = wishlist.value.filter((id) => id !== product._id);
  } else {
    wishlist.value = [...wishlist.value, product._id];
  }
  localStorage.setItem("wishlist", JSON.stringify(wishlist.value));
}

// OSTOSKORI

export const cart = ref([]);

export const cartError = ref("");
let cartErrorTimer = null;

function showCartError(message) {
  cartError.value = message;
  clearTimeout(cartErrorTimer);
  cartErrorTimer = setTimeout(() => {
    cartError.value = "";
  }, 4000);
}

function findCartItem(productId) {
  return cart.value.find((item) => item.product._id === productId);
}

export function addToCart(product) {
  const existing = findCartItem(product._id);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty >= product.stock) {
    showCartError(
      `Valitettavasti tuotetta "${product.name}" on varastossa vain ${product.stock} kpl`,
    );
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.value.push({ product, quantity: 1 });
  }
}

export function increaseQuantity(productId) {
  const item = findCartItem(productId);
  if (!item) return;

  if (item.quantity >= item.product.stock) {
    showCartError(
      `Valitettavasti tuotetta "${item.product.name}" on varastossa vain ${item.product.stock} kpl`,
    );
    return;
  }

  item.quantity += 1;
}

export function decreaseQuantity(productId) {
  const item = findCartItem(productId);
  if (!item) return;

  if (item.quantity <= 1) {
    cart.value = cart.value.filter((i) => i.product._id !== productId);
    return;
  }

  item.quantity -= 1;
}

export function removeFromCart(productId) {
  cart.value = cart.value.filter((item) => item.product._id !== productId);
}

export function clearCart() {
  cart.value = [];
}

export const totalItemsInCart = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0),
);
export const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
);

// TILAUKSEN TEKO JA MAKSU

export const activeOrder = ref(null);

export async function checkout() {
  const items = cart.value.map((item) => ({
    productId: item.product._id,
    quantity: item.quantity,
  }));

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    });
    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error || "Tilauksen teko epäonnistui" };
    }

    activeOrder.value = data;
    cart.value = [];
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Yhteys palvelimeen epäonnistui" };
  }
}
// TILATA

export async function payForOrder() {
  const response = await fetch(
    `${API_URL}/orders/${activeOrder.value._id}/pay`,
    {
      method: "POST",
      headers: authHeaders(),
    },
  );
  const data = await response.json();
  if (response.ok) {
    activeOrder.value = data;
  }
}

// UUDEN TUOTTEEN LISÄYS

export async function submitProduct(payload) {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error || "Tuotteen lisäys epäonnistui" };
    }

    await loadProducts(data.category);
    invalidateSearchCache();
    return { ok: true, product: data };
  } catch (err) {
    return { ok: false, error: "Yhteys palvelimeen epäonnistui" };
  }
}

// TUOTTEEN MUOKKAUS JA POISTO

export async function updateProduct(id, payload) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Tuotteen muokkaus epäonnistui",
      };
    }

    await loadProducts(data.category);
    invalidateSearchCache();
    return { ok: true, product: data };
  } catch (err) {
    return { ok: false, error: "Yhteys palvelimeen epäonnistui" };
  }
}

export async function deleteProduct(id, category) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error || "Tuotteen poisto epäonnistui" };
    }

    await loadProducts(category);
    invalidateSearchCache();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Yhteys palvelimeen epäonnistui" };
  }
}
