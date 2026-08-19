import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getJwtSecret } from '../middleware/auth.js'

const router = Router()

// REKISTERÖINTI
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Täytä nimi, sähköposti ja salasana' })
  }

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Tällä sähköpostilla on jo käyttäjä' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Ensimmäisestä rekisteröityneestä käyttäjästä tulee automaattisesti admin
    const usersCount = await User.countDocuments()
    const isAdmin = usersCount === 0

    const newUser = await User.create({ name, email, passwordHash, isAdmin })

    const token = jwt.sign({ userId: newUser._id }, getJwtSecret(), { expiresIn: '7d' })

    res.json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, isAdmin: newUser.isAdmin },
    })
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe rekisteröinnissä' })
  }
})

// KIRJAUTUMINEN
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Väärä sähköposti tai salasana' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Väärä sähköposti tai salasana' })
    }

    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '7d' })

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    })
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe kirjautumisessa' })
  }
})

export default router
