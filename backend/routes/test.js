import { Router } from 'express'
import User from '../models/User.js'
 
const router = Router()
 
// Цей роут існує ЛИШЕ для e2e-тестів (дивись server.js — підключається тільки
// коли ENABLE_TEST_ROUTES=true). У продакшн-деплої ця змінна не встановлена,
// тож роут там взагалі не реєструється.
//
// Навіщо він потрібен: перший зареєстрований користувач автоматично стає
// адміном (так задумано в auth.js). Але в тестах користувачі реєструються
// паралельно й у випадковому порядку, тому покладатись на "хто був першим"
// ненадійно. Цей роут дозволяє тесту явно зробити СВОГО користувача адміном.
router.post('/promote-admin', async (req, res) => {
  const { email } = req.body
 
  if (!email) {
    return res.status(400).json({ error: 'Потрібен email' })
  }
 
  const user = await User.findOneAndUpdate({ email }, { isAdmin: true }, { new: true })
 
  if (!user) {
    return res.status(404).json({ error: 'Користувача з таким email не знайдено' })
  }
 
  res.json({ ok: true })
})
 
export default router