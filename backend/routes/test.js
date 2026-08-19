import { Router } from 'express'
import User from '../models/User.js'
 
const router = Router()
 

router.post('/promote-admin', async (req, res) => {
  const { email } = req.body
 
  if (!email) {
    return res.status(400).json({ error: 'Tarvitaan email' })
  }
 
  const user = await User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true })
 
  if (!user) {
    return res.status(404).json({ error: 'Ei löytynyt käyttäjää tällä sähköpostiosoitteella' })
  }
 
  res.json({ ok: true })
})
 
export default router