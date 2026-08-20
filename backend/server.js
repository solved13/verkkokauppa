import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'

dotenv.config() // зчитує змінні з файлу .env у process.env

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)

app.get('/', (req, res) => {
  res.send('Sneaker Shop API працює 👟 (MongoDB)')
})

// Спочатку підключаємось до MongoDB, і лише ПІСЛЯ успішного підключення
// запускаємо сервер — так уникаємо запитів до бази, яка ще не готова.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Підключено до MongoDB')
    app.listen(PORT, () => {
      console.log(`Сервер запущено: http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ Помилка підключення до MongoDB:', err.message)
  })
