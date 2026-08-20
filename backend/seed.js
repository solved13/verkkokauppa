// Цей скрипт заповнює базу даних стартовими товарами.
// Запускається ОДИН РАЗ вручну: npm run seed
// Повторний запуск видалить старі товари і додасть ці ж самі заново.

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from './models/Product.js'

dotenv.config()

const startProducts = [
  { name: 'Retro Runner Black', price: 35, category: 'old', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', stock: 8 },
  { name: 'Classic Vintage 90', price: 42, category: 'old', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400', stock: 2 },
  { name: 'Old School Kicks', price: 29, category: 'old', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400', stock: 0 },
  { name: 'Legacy Black Edition', price: 48, category: 'old', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400', stock: 15 },
  { name: 'Street Vintage', price: 32, category: 'old', image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=400', stock: 5 },
  { name: 'Dark Classic Pro', price: 39, category: 'old', image: 'https://images.unsplash.com/photo-1533681904393-9ab6eee7e408?w=400', stock: 1 },
  { name: 'Cloud White Max', price: 65, category: 'new', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400', stock: 10 },
  { name: 'Air Fresh 2026', price: 72, category: 'new', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', stock: 3 },
  { name: 'New Wave Sneaker', price: 58, category: 'new', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400', stock: 6 },
  { name: 'Future Step White', price: 78, category: 'new', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400', stock: 0 },
  { name: 'Pure White Runner', price: 61, category: 'new', image: 'https://images.unsplash.com/photo-1465479423260-c4afc24172c6?w=400', stock: 20 },
  { name: 'Next Gen Sport', price: 69, category: 'new', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400', stock: 4 },
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Підключено до MongoDB, наповнюю базу...')

  await Product.deleteMany({}) // спочатку прибираємо старі товари, щоб не дублювались
  await Product.insertMany(startProducts)

  console.log(`Додано ${startProducts.length} товарів.`)
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Помилка наповнення бази:', err)
  process.exit(1)
})
