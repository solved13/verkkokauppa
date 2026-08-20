// Middleware perustaa käyttäjän kirjautumisen ja roolin tarkistuksen
import jwt from 'jsonwebtoken'
import { readDB } from '../utils/db.js'

// Oikeassa projektissa salaisuus säilytetään .env-tiedostossa,
// ei suoraan koodissa! Tässä yksinkertaistettuna opetusta varten.
export const JWT_SECRET = 'navchalnyi-sekret-zminy-mene'

// Tarkistaa, että pyynnössä on kelvollinen JWT-token
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization // odotetaan "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kirjautuminen vaaditaan' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId // tallennetaan käyttäjän id pyyntöön
    next() // kaikki ok, jatketaan eteenpäin
  } catch (err) {
    return res.status(401).json({ error: 'Virheellinen tai vanhentunut token' })
  }
}

// Tarkistaa ensin kirjautumisen (requireAuth) ja sen jälkeen,
// että käyttäjällä on admin-oikeudet (isAdmin === true).
// Käytetään reiteillä, joita vain ylläpitäjä saa käyttää (esim. tuotteen lisäys).
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const db = readDB()
    const user = db.users.find((u) => u.id === req.userId)

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Vain ylläpitäjä voi tehdä tämän' })
    }

    next()
  })
}
