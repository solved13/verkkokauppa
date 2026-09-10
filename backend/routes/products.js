import { Router } from 'express'
import Product from '../models/Product.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/products?category=old  tai  ?category=new
router.get('/', async (req, res) => {
  const { category } = req.query

  try {
    const filter = category ? { category } : {}
    const products = await Product.find(filter)
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Tuotteiden haku epäonnistui' })
  }
})

// POST /api/products — vain admin voi lisätä uuden tuotteen
router.post('/', requireAdmin, async (req, res) => {
  const { name, price, category, image, stock, description, colors } = req.body

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Täytä nimi, hinta ja kategoria' })
  }

  if (category !== 'old' && category !== 'new') {
    return res.status(400).json({ error: "Kategorian pitää olla 'old' tai 'new'" })
  }

  try {
    const newProduct = await Product.create({
      name,
      price: Number(price),
      category,
      image: image || '',
      stock: stock !== undefined ? Number(stock) : 0,
      description: description || '',
      colors: Array.isArray(colors) ? colors : [],
    })

    res.json(newProduct)
  } catch (err) {
    res.status(500).json({ error: 'Tuotteen lisäys epäonnistui' })
  }
})

export default router
