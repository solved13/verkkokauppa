import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors()) // дозволяє фронтенду (з іншого порту) звертатись до цього API
app.use(express.json()) // дозволяє читати JSON у тілі запитів

// Підключаємо роути
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)

app.get('/', (req, res) => {
  res.send('Sneaker Shop API працює 👟')
})

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})
