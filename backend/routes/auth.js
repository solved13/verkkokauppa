import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readDB, writeDB } from '../utils/db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

// REKISTERÖINTI — uuden käyttäjän luonti
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Täytä nimi, sähköposti ja salasana' })
  }

  const db = readDB()

  const existingUser = db.users.find((u) => u.email === email)
  if (existingUser) {
    return res.status(400).json({ error: 'Tällä sähköpostilla on jo käyttäjä' })
  }

  // Salasana hashataan — sitä ei koskaan tallenneta selkokielisenä!
  const passwordHash = await bcrypt.hash(password, 10)

  const newUser = {
    id: db.users.length + 1,
    name,
    email,
    passwordHash,
  }

  db.users.push(newUser)
  writeDB(db)

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' })

  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } })
})

// KIRJAUTUMINEN olemassa olevana käyttäjänä
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const db = readDB()
  const user = db.users.find((u) => u.email === email)

  if (!user) {
    return res.status(400).json({ error: 'Väärä sähköposti tai salasana' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Väärä sähköposti tai salasana' })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

export default router
