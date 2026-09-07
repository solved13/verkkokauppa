import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'

// Кожен тест реєструє свого унікального користувача,
// щоб тести не залежали одне від одного і могли йти паралельно.
function uniqueEmail(tag) {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`
}

test.describe('Auth API', () => {
  test('POST /api/auth/register створює нового користувача і повертає токен', async ({ request }) => {
    const email = uniqueEmail('register')

    const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'API Тест', email, password: 'Parooli123' },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.token).toBeTruthy()
    expect(body.user.email).toBe(email)
    expect(body.user.name).toBe('API Тест')
  })

  test('POST /api/auth/register з email, що вже існує, повертає 400', async ({ request }) => {
    const email = uniqueEmail('duplicate')

    const first = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Перший', email, password: 'Parooli123' },
    })
    expect(first.ok()).toBeTruthy()

    const second = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Другий', email, password: 'InshiiParol456' },
    })
    expect(second.status()).toBe(400)
    const body = await second.json()
    expect(body.error).toBeTruthy()
  })

  test('POST /api/auth/register без обов’язкових полів повертає 400', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { email: uniqueEmail('incomplete') },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/login з правильними даними повертає токен', async ({ request }) => {
    const email = uniqueEmail('login-ok')
    const password = 'PravidniyParol123'

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Валідний Юзер', email, password },
    })

    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email, password },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.token).toBeTruthy()
    expect(body.user.email).toBe(email)
  })

  test('POST /api/auth/login з невірним паролем повертає 400', async ({ request }) => {
    const email = uniqueEmail('login-bad-pass')

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Юзер', email, password: 'PravidniyParol123' },
    })

    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email, password: 'NevirnyiParol' },
    })

    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/login з неіснуючим email повертає 400', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email: uniqueEmail('nobody'), password: 'будь-який' },
    })
    expect(res.status()).toBe(400)
  })
})
