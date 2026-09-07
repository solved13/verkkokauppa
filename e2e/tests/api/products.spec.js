import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'
import { registerUser, registerAdmin, createProduct, uniqueProductName } from '../../helpers.js'

test.describe('Products API', () => {
  test('адмін може додати товар, і він з’являється у своїй категорії', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-admin')
    const product = await createProduct(request, admin.token, { category: 'new' })

    const res = await request.get(`${BACKEND_URL}/api/products?category=new`)
    expect(res.ok()).toBeTruthy()
    const products = await res.json()

    const found = products.find((p) => p._id === product._id)
    expect(found).toBeTruthy()
    expect(found.name).toBe(product.name)
  })

  test('товар з категорії "old" не потрапляє у вибірку "new"', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-cat')
    const oldProduct = await createProduct(request, admin.token, { category: 'old' })

    const res = await request.get(`${BACKEND_URL}/api/products?category=new`)
    const products = await res.json()

    const found = products.find((p) => p._id === oldProduct._id)
    expect(found).toBeFalsy()
  })

  test('звичайний користувач (не адмін) не може додати товар — 403', async ({ request }) => {
    const user = await registerUser(request, 'products-forbidden')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: uniqueProductName('Заборонений'), price: 10, category: 'new' },
    })

    expect(res.status()).toBe(403)
  })

  test('без токена додати товар неможливо — 401', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/products`, {
      data: { name: uniqueProductName('Без токена'), price: 10, category: 'new' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/products з невалідною категорією повертає 400', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-badcat')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { name: uniqueProductName('Погана категорія'), price: 10, category: 'middle' },
    })

    expect(res.status()).toBe(400)
  })

  test('POST /api/products без ціни повертає 400', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-noprice')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { name: uniqueProductName('Без ціни'), category: 'new' },
    })

    expect(res.status()).toBe(400)
  })
})
