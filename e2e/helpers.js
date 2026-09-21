import { BACKEND_URL } from './env.js'

// Shared helper functions for the API and UI tests around the
// catalog/cart/orders. The goal is for every test to set up its own data
// (a unique product, a unique user) and never depend on what other tests
// have already done, since tests run in parallel against the same
// temporary database.

let counter = 0
function unique(tag) {
  counter += 1
  return `${tag}.${Date.now()}.${counter}.${Math.floor(Math.random() * 100000)}`
}

export function uniqueEmail(tag) {
  return `${unique(tag)}@example.com`
}

export function uniqueProductName(tag) {
  return `${tag} ${unique('p')}`
}

// Registers a new user and returns { token, user, email, password }.
export async function registerUser(request, tag, overrides = {}) {
  const email = overrides.email || uniqueEmail(tag)
  const password = overrides.password || 'Parooli123'
  const name = overrides.name || `Test ${tag}`

  const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
    data: { name, email, password },
  })
  if (!res.ok()) {
    throw new Error(`registerUser(${tag}) failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { token: body.token, user: body.user, email, password, name }
}

// Registers a user and immediately promotes them to admin through the
// test-only backdoor route.
export async function registerAdmin(request, tag, overrides = {}) {
  const account = await registerUser(request, tag, overrides)

  const promote = await request.post(`${BACKEND_URL}/api/test/promote-admin`, {
    data: { email: account.email },
  })
  if (!promote.ok()) {
    throw new Error(`registerAdmin(${tag}) promote failed: ${promote.status()} ${await promote.text()}`)
  }

  // isAdmin on the token/user from registration hasn't been refreshed yet,
  // so we log in again to get a fresh user.isAdmin === true.
  const loginRes = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { email: account.email, password: account.password },
  })
  const loginBody = await loginRes.json()
  return { ...account, token: loginBody.token, user: loginBody.user }
}

// Creates a product as an admin. category: 'old' | 'new'.
export async function createProduct(request, adminToken, overrides = {}) {
  const name = overrides.name || uniqueProductName('Sneaker')
  const data = {
    name,
    price: overrides.price ?? 50,
    category: overrides.category || 'new',
    image: overrides.image || 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400',
    stock: overrides.stock ?? 5,
  }
  if (overrides.description !== undefined) data.description = overrides.description
  if (overrides.colors !== undefined) data.colors = overrides.colors

  const res = await request.post(`${BACKEND_URL}/api/products`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data,
  })
  if (!res.ok()) {
    throw new Error(`createProduct(${name}) failed: ${res.status()} ${await res.text()}`)
  }
  return res.json()
}

// Logs a user in through the real UI form (not localStorage) and waits
// until the home screen appears. We specifically wait for the "Kirjaudu
// ulos" button — it only shows up after a successful login and can be
// identified unambiguously by its role, unlike the "Hei, ..." text, which
// sits in the same block as the badge/button and could confuse a
// text/regex search.
export async function loginViaUI(page, email, password) {
  await page.goto('/')
  await page.getByPlaceholder('Sähköposti').fill(email)
  await page.getByPlaceholder('Salasana').fill(password)
  await page.getByRole('button', { name: 'Kirjaudu' }).click()
  await page.getByRole('button', { name: 'Kirjaudu ulos' }).waitFor({ state: 'visible' })
}

// Clicks the right "half" (VANHOJA TENNAREITA / UUDET TENNARIT) on the home
// screen to enter the catalog for that category. Clicks the card itself
// rather than a specific "Mene kauppaan" button inside it — the whole
// choice-half has its own @click="openShop(...)" handler, so this works
// the same way regardless of whether that button is present/visible.
export async function openCategory(page, category) {
  const title = category === 'old' ? 'VANHOJA TENNAREITA' : 'UUDET TENNARIT'
  await page.locator('.choice-half', { hasText: title }).click()
}