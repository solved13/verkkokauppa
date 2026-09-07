import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'
import { registerUser, registerAdmin, createProduct } from '../../helpers.js'

test.describe('Orders API', () => {
  test('оформлення замовлення зменшує залишок на складі', async ({ request }) => {
    const admin = await registerAdmin(request, 'orders-stock')
    const product = await createProduct(request, admin.token, { stock: 5, price: 40 })
    const buyer = await registerUser(request, 'orders-buyer')

    const orderRes = await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { items: [{ productId: product._id, quantity: 2 }] },
    })
    expect(orderRes.ok()).toBeTruthy()
    const order = await orderRes.json()
    expect(order.total).toBe(80) // 2 x 40
    expect(order.status).toBe('odottaa maksua')

    const productsRes = await request.get(`${BACKEND_URL}/api/products?category=${product.category}`)
    const products = await productsRes.json()
    const updated = products.find((p) => p._id === product._id)
    expect(updated.stock).toBe(3) // 5 - 2
  })

  test('неможливо замовити більше, ніж є в наявності', async ({ request }) => {
    const admin = await registerAdmin(request, 'orders-overstock')
    const product = await createProduct(request, admin.token, { stock: 1 })
    const buyer = await registerUser(request, 'orders-overstock-buyer')

    const res = await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { items: [{ productId: product._id, quantity: 2 }] },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()

    // і залишок на складі не мав змінитись
    const productsRes = await request.get(`${BACKEND_URL}/api/products?category=${product.category}`)
    const products = await productsRes.json()
    const unchanged = products.find((p) => p._id === product._id)
    expect(unchanged.stock).toBe(1)
  })

  test('порожній кошик неможливо оформити — 400', async ({ request }) => {
    const buyer = await registerUser(request, 'orders-empty')

    const res = await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { items: [] },
    })

    expect(res.status()).toBe(400)
  })

  test('без токена замовлення оформити неможливо — 401', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/orders`, {
      data: { items: [{ productId: '000000000000000000000000', quantity: 1 }] },
    })
    expect(res.status()).toBe(401)
  })

  test('оплата (pay) переводить замовлення у статус "maksettu"', async ({ request }) => {
    const admin = await registerAdmin(request, 'orders-pay')
    const product = await createProduct(request, admin.token, { stock: 3, price: 20 })
    const buyer = await registerUser(request, 'orders-pay-buyer')

    const orderRes = await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { items: [{ productId: product._id, quantity: 1 }] },
    })
    const order = await orderRes.json()

    const payRes = await request.post(`${BACKEND_URL}/api/orders/${order._id}/pay`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
    })
    expect(payRes.ok()).toBeTruthy()
    const paid = await payRes.json()
    expect(paid.status).toBe('maksettu')
    expect(paid.paidAt).toBeTruthy()
  })

  test('чужого замовлення оплатити не можна — 404', async ({ request }) => {
    const admin = await registerAdmin(request, 'orders-foreign')
    const product = await createProduct(request, admin.token, { stock: 3, price: 15 })
    const owner = await registerUser(request, 'orders-foreign-owner')
    const stranger = await registerUser(request, 'orders-foreign-stranger')

    const orderRes = await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { items: [{ productId: product._id, quantity: 1 }] },
    })
    const order = await orderRes.json()

    const payRes = await request.post(`${BACKEND_URL}/api/orders/${order._id}/pay`, {
      headers: { Authorization: `Bearer ${stranger.token}` },
    })
    expect(payRes.status()).toBe(404)
  })

  test('GET /api/orders повертає тільки власні замовлення', async ({ request }) => {
    const admin = await registerAdmin(request, 'orders-list')
    const product = await createProduct(request, admin.token, { stock: 5, price: 10 })
    const buyerA = await registerUser(request, 'orders-list-a')
    const buyerB = await registerUser(request, 'orders-list-b')

    await request.post(`${BACKEND_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${buyerA.token}` },
      data: { items: [{ productId: product._id, quantity: 1 }] },
    })

    const listA = await (
      await request.get(`${BACKEND_URL}/api/orders`, { headers: { Authorization: `Bearer ${buyerA.token}` } })
    ).json()
    const listB = await (
      await request.get(`${BACKEND_URL}/api/orders`, { headers: { Authorization: `Bearer ${buyerB.token}` } })
    ).json()

    expect(listA.length).toBeGreaterThan(0)
    expect(listB.length).toBe(0)
  })
})
