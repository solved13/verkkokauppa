import { BACKEND_URL } from './env.js'



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


export async function loginViaUI(page, email, password) {
  await page.goto('/')
  await page.getByPlaceholder('Sähköposti').fill(email)
  await page.getByPlaceholder('Salasana').fill(password)
  await page.getByRole('button', { name: 'Kirjaudu' }).click()
  await page.getByRole('button', { name: 'Kirjaudu ulos' }).waitFor({ state: 'visible' })
}


export async function openCategory(page, category) {
  const title = category === 'old' ? 'VANHOJA TENNAREITA' : 'UUDET TENNARIT'
  await page.locator('.choice-half', { hasText: title }).click()
}