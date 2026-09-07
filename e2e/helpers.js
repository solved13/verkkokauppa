import { BACKEND_URL } from './env.js'

// Спільні допоміжні функції для API- і UI-тестів каталогу/кошика/замовлень.
// Мета — щоб кожен тест сам собі готував дані (унікальний товар, унікальний
// користувач) і ніколи не залежав від того, що вже зробили інші тести,
// які виконуються паралельно проти тієї ж тимчасової бази.

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

// Реєструє нового користувача і повертає { token, user, email, password }.
export async function registerUser(request, tag, overrides = {}) {
  const email = overrides.email || uniqueEmail(tag)
  const password = overrides.password || 'Parooli123'
  const name = overrides.name || `Тест ${tag}`

  const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
    data: { name, email, password },
  })
  if (!res.ok()) {
    throw new Error(`registerUser(${tag}) failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { token: body.token, user: body.user, email, password, name }
}

// Реєструє користувача і одразу робить його адміном через тестовий "чорний хід".
export async function registerAdmin(request, tag, overrides = {}) {
  const account = await registerUser(request, tag, overrides)

  const promote = await request.post(`${BACKEND_URL}/api/test/promote-admin`, {
    data: { email: account.email },
  })
  if (!promote.ok()) {
    throw new Error(`registerAdmin(${tag}) promote failed: ${promote.status()} ${await promote.text()}`)
  }

  // isAdmin у токені/юзері з моменту реєстрації ще не оновлений — тому логінимось
  // ще раз, щоб отримати свіжий user.isAdmin === true.
  const loginRes = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { email: account.email, password: account.password },
  })
  const loginBody = await loginRes.json()
  return { ...account, token: loginBody.token, user: loginBody.user }
}

// Створює товар від імені адміна. category: 'old' | 'new'.
export async function createProduct(request, adminToken, overrides = {}) {
  const name = overrides.name || uniqueProductName('Sneaker')
  const data = {
    name,
    price: overrides.price ?? 50,
    category: overrides.category || 'new',
    image: overrides.image || 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400',
    stock: overrides.stock ?? 5,
  }

  const res = await request.post(`${BACKEND_URL}/api/products`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data,
  })
  if (!res.ok()) {
    throw new Error(`createProduct(${name}) failed: ${res.status()} ${await res.text()}`)
  }
  return res.json()
}

// Логінить користувача через справжню UI-форму (не localStorage) і чекає,
// поки з'явиться головна сторінка. Чекаємо саме на кнопку "Kirjaudu ulos" —
// вона з'являється лише після успішного логіну і однозначно ідентифікується
// за роллю, на відміну від тексту "Hei, ...", який змішаний в одному блоці
// з кнопкою/бейджем і може підвести пошук за текстом/регуляркою.
export async function loginViaUI(page, email, password) {
  await page.goto('/')
  await page.getByPlaceholder('Sähköposti').fill(email)
  await page.getByPlaceholder('Salasana').fill(password)
  await page.getByRole('button', { name: 'Kirjaudu' }).click()
  await page.getByRole('button', { name: 'Kirjaudu ulos' }).waitFor({ state: 'visible' })
}

// Клікає на потрібну "половину" (VANHOJA TENNAREITA / UUDET TENNARIT) на
// головній сторінці, щоб перейти в каталог потрібної категорії.
export async function openCategory(page, category) {
  const title = category === 'old' ? 'VANHOJA TENNAREITA' : 'UUDET TENNARIT'
  await page
    .locator('.choice-half', { hasText: title })
    .getByRole('button', { name: 'Mene kauppaan' })
    .click()
}
