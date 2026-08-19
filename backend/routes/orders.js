import { Router } from 'express'
import { readDB, writeDB } from '../utils/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Kaikki tilausreitit vaativat kirjautumisen
router.use(requireAuth)

// TILAUKSEN LUONTI ostoskorista
// Pyynnön runko: { items: [{ productId: 1, quantity: 2 }, ...] }
router.post('/', (req, res) => {
  const { items } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Ostoskori on tyhjä' })
  }

  const db = readDB()

  // Summa lasketaan PALVELIMELLA, ei luoteta frontendin hintaan —
  // näin kukaan ei voi muuttaa hintaa selaimessa ennen lähetystä.
  let total = 0
  const orderItems = []

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId)
    if (!product) {
      return res.status(400).json({ error: `Tuotetta id=${item.productId} ei löydy` })
    }
    const quantity = item.quantity || 1
    total += product.price * quantity
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    })
  }

  const newOrder = {
    id: db.orders.length + 1,
    userId: req.userId,
    items: orderItems,
    total,
    status: 'odottaa maksua',
    createdAt: new Date().toISOString(),
  }

  db.orders.push(newOrder)
  writeDB(db)

  res.json(newOrder)
})

// TILAUKSEN "MAKSU" — SIMULAATIO.
// Oikeaa maksujen vastaanottoa ei ole: mitään korttitietoja ei kerätä
// eikä tallenneta. Oikeaa maksua varten käytetään erillistä maksupalvelua
// (Stripe, Klarna, Paytrail jne.) — se on tämän opetusprojektin ulkopuolella.
router.post('/:id/pay', (req, res) => {
  const orderId = Number(req.params.id)
  const db = readDB()

  const order = db.orders.find((o) => o.id === orderId && o.userId === req.userId)
  if (!order) {
    return res.status(404).json({ error: 'Tilausta ei löydy' })
  }

  order.status = 'maksettu'
  order.paidAt = new Date().toISOString()
  writeDB(db)

  res.json(order)
})

// OMIEN TILAUSTEN LISTA
router.get('/', (req, res) => {
  const db = readDB()
  const myOrders = db.orders.filter((o) => o.userId === req.userId)
  res.json(myOrders)
})

export default router
