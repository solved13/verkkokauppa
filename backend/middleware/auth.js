import jwt from 'jsonwebtoken'
import User from '../models/User.js'


export function getJwtSecret() {
  return process.env.JWT_SECRET
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization 

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
