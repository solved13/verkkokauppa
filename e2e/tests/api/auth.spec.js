import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'

// Each test registers its own unique user,
// so tests do not depend on each other and can run in parallel.
function uniqueEmail(tag) {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`
}

test.describe('Auth API', () => {
  test('POST /api/auth/register creates a new user and returns a token', async ({ request }) => {
    const email = uniqueEmail('register')

    const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'API Test', email, password: 'Parooli123' },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.token).toBeTruthy()
    expect(body.user.email).toBe(email)
    expect(body.user.name).toBe('API Test')
  })

  test('POST /api/auth/register with an email that already exists returns 400', async ({ request }) => {
    const email = uniqueEmail('duplicate')

    const first = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'First', email, password: 'Parooli123' },
    })
    expect(first.ok()).toBeTruthy()

    const second = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Second', email, password: 'InshiiParol456' },
    })
    expect(second.status()).toBe(400)
    const body = await second.json()
    expect(body.error).toBeTruthy()
  })

  test('POST /api/auth/register without required fields returns 400', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { email: uniqueEmail('incomplete') },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/login with correct credentials returns a token', async ({ request }) => {
    const email = uniqueEmail('login-ok')
    const password = 'PravidniyParol123'

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Valid User', email, password },
    })

    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email, password },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.token).toBeTruthy()
    expect(body.user.email).toBe(email)
  })

  test('POST /api/auth/login with an incorrect password returns 400', async ({ request }) => {
    const email = uniqueEmail('login-bad-pass')

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'User', email, password: 'PravidniyParol123' },
    })

    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email, password: 'NevirnyiParol' },
    })

    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/login with a non-existent email returns 400', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email: uniqueEmail('nobody'), password: 'any-password' },
    })
    expect(res.status()).toBe(400)
  })
})