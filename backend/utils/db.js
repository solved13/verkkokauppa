// Дуже проста "база даних" на основі JSON-файлу.
// Для навчального проєкту цього достатньо: не треба встановлювати
// і налаштовувати справжню СУБД (PostgreSQL, MongoDB тощо).
// У реальному продукті замість цього файлу використовували б Prisma/Sequelize + справжню БД.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'db.json')

// Зчитує весь вміст db.json і повертає як звичайний JS-об'єкт
export function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

// Перезаписує db.json новими даними
export function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
