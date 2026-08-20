import { Router } from 'express'
import { readDB, writeDB } from '../utils/db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/products?category=old  tai  ?category=new
// Julkinen reitti — kaikki voivat katsoa tuotteita ilman kirjautumista
router.get('/', (req, res) => {
  const { category } = req.query
  const db = readDB()

  let products = db.products

  if (category) {
    products = products.filter((p) => p.category === category)
  }

  res.json(products)
})

// POST /api/products — UUDEN TUOTTEEN LISÄYS
// Vaatii ADMIN-oikeudet (requireAdmin) — tavallinen käyttäjä ei voi lisätä tuotteita.
// Pyynnön runko: { name, price, category, image, stock }
router.post('/', requireAdmin, (req, res) => {
  const { name, price, category, image, stock } = req.body

  // Yksinkertainen validointi — tarkistetaan, että pakolliset kentät on annettu
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Täytä nimi, hinta ja kategoria' })
  }

  if (category !== 'old' && category !== 'new') {
    return res.status(400).json({ error: "Kategorian pitää olla 'old' tai 'new'" })
  }

  const db = readDB()

  // Uusi id on suurin nykyinen id + 1
  const newId = db.products.length > 0
    ? Math.max(...db.products.map((p) => p.id)) + 1
    : 1

  const newProduct = {
    id: newId,
    name,
    price: Number(price),
    category,
    image: image || '', // jos kuvaa ei annettu, jätetään tyhjäksi
    stock: stock !== undefined ? Number(stock) : 0,
  }

  db.products.push(newProduct)
  writeDB(db)

  res.json(newProduct)
})

export default router
