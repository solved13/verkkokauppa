import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Секрет читається зі змінних оточення (.env) — так безпечніше,
// ніж тримати його прямо в коді.
// Luetaan process.env.JWT_SECRET vasta funktion sisällä (ei moduulin
// lataushetkellä), koska ESM-importit suoritetaan ennen server.js:n
// dotenv.config()-kutsua — muuten JWT_SECRET jäisi pysyvästi undefined.
export function getJwtSecret() {
  return process.env.JWT_SECRET
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization // очікуємо "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kirjautuminen vaaditaan' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.userId = payload.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Virheellinen tai vanhentunut token' })
  }
}

// Перевіряє токен, а потім — чи користувач є адміном (шукає його в MongoDB)
export function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    try {
      const user = await User.findById(req.userId)

      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Vain ylläpitäjä voi tehdä tämän' })
      }

      next()
    } catch (err) {
      return res.status(500).json({ error: 'Palvelinvirhe' })
    }
  })
}
