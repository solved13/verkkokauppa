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

// GET /api/products/:id — yhden tuotteen tiedot (esim. muokkauslomaketta varten)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ error: 'Tuotetta ei löytynyt' })
    }

    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Tuotteen haku epäonnistui' })
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

// PUT /api/products/:id — vain admin voi muokata tuotetta
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, price, category, image, stock, description, colors } = req.body

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Täytä nimi, hinta ja kategoria' })
  }

  if (category !== 'old' && category !== 'new') {
    return res.status(400).json({ error: "Kategorian pitää olla 'old' tai 'new'" })
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: Number(price),
        category,
        image: image || '',
        stock: stock !== undefined ? Number(stock) : 0,
        description: description || '',
        colors: Array.isArray(colors) ? colors : [],
      },
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Tuotetta ei löytynyt' })
    }

    res.json(updatedProduct)
  } catch (err) {
    res.status(500).json({ error: 'Tuotteen muokkaus epäonnistui' })
  }
})

// DELETE /api/products/:id — vain admin voi poistaa tuotteen
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Tuotetta ei löytynyt' })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Tuotteen poisto epäonnistui' })
  }
})

export default router
