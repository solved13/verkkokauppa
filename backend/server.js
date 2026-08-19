import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
 
import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import testRoutes from './routes/test.js'
 
dotenv.config() // 
 
const app = express()
const PORT = process.env.PORT || 3000
 
app.use(cors())
app.use(express.json())
 
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)
 

if (process.env.ENABLE_TEST_ROUTES === 'true') {
  console.log('  Testireitit ovat käytössä (ENABLE_TEST_ROUTES=true) — vain e2e-testeihin!')
  app.use('/api/test', testRoutes)
}
 
app.get('/', (req, res) => {
  res.send('Sneaker Shop API toimi  (MongoDB)')
})
 

mongoose.connection.on('error', (err) => {
  console.error(' Virhe yhdistettäessä MongoDB:hen:', err.message)
})
 

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Yhdistetty MongoDB:hen')
    app.listen(PORT, () => {
      console.log(`Palvelin käynnistetty: http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Virhe yhdistettäessä MongoDB:hen:', err.message)
  })
 