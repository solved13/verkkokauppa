import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
 
import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import testRoutes from './routes/test.js'
 
dotenv.config() // зчитує змінні з файлу .env у process.env
 
const app = express()
const PORT = process.env.PORT || 3000
 
app.use(cors())
app.use(express.json())
 
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)
 
// Тестові роути (наприклад /api/test/promote-admin) підключаються ЛИШЕ коли
// явно увімкнено ENABLE_TEST_ROUTES=true — у продакшн-деплої на Render цієї
// змінної немає, тож цей код там взагалі не виконується.
if (process.env.ENABLE_TEST_ROUTES === 'true') {
  console.log('⚠️  Тестові роути увімкнені (ENABLE_TEST_ROUTES=true) — лише для e2e-тестів!')
  app.use('/api/test', testRoutes)
}
 
app.get('/', (req, res) => {
  res.send('Sneaker Shop API працює 👟 (MongoDB)')
})
 
// Якщо з'єднання з MongoDB обірветься ПІСЛЯ старту (наприклад, mongod
// на секунду "затнувся"), mongoose генерує подію 'error' на об'єкті
// з'єднання. Без цього обробника Node вважає таку подію необробленою
// винятковою ситуацією і аварійно завершує весь процес — тобто падає
// не тільки з'єднання з базою, а взагалі весь backend і всі активні
// HTTP-запити (це і виглядає як ECONNRESET на клієнті).
mongoose.connection.on('error', (err) => {
  console.error('⚠️ Помилка з’єднання з MongoDB:', err.message)
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
 