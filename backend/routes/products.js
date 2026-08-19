import { Router } from 'express'
import { readDB } from '../utils/db.js'

const router = Router()

// GET /api/products?category=old  або  ?category=new
router.get('/', (req, res) => {
  const { category } = req.query
  const db = readDB()

  let products = db.products

  if (category) {
    products = products.filter((p) => p.category === category)
  }

  res.json(products)
})

export default router
