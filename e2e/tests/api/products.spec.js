import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'
import { registerUser, registerAdmin, createProduct, uniqueProductName } from '../../helpers.js'

test.describe('Products API', () => {
  test('admin can add a product, and it appears in its category', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-admin')
    const product = await createProduct(request, admin.token, { category: 'new' })

    const res = await request.get(`${BACKEND_URL}/api/products?category=new`)
    expect(res.ok()).toBeTruthy()
    const products = await res.json()

    const found = products.find((p) => p._id === product._id)
    expect(found).toBeTruthy()
    expect(found.name).toBe(product.name)
  })

  test('product from the "old" category does not appear in the "new" selection', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-cat')
    const oldProduct = await createProduct(request, admin.token, { category: 'old' })

    const res = await request.get(`${BACKEND_URL}/api/products?category=new`)
    const products = await res.json()

    const found = products.find((p) => p._id === oldProduct._id)
    expect(found).toBeFalsy()
  })

  test('regular user (not admin) cannot add a product — 403', async ({ request }) => {
    const user = await registerUser(request, 'products-forbidden')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: uniqueProductName('Forbidden'), price: 10, category: 'new' },
    })

    expect(res.status()).toBe(403)
  })

  test('cannot add a product without a token — 401', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/products`, {
      data: { name: uniqueProductName('No token'), price: 10, category: 'new' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/products with an invalid category returns 400', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-badcat')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { name: uniqueProductName('Bad category'), price: 10, category: 'middle' },
    })

    expect(res.status()).toBe(400)
  })

  test('POST /api/products without a price returns 400', async ({ request }) => {
    const admin = await registerAdmin(request, 'products-noprice')

    const res = await request.post(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { name: uniqueProductName('No price'), category: 'new' },
    })

    expect(res.status()).toBe(400)
  })
})