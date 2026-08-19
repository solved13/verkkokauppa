// Middleware перевіряє, чи користувач авторизований (є валідний JWT-токен)
import jwt from 'jsonwebtoken'

// У реальному проєкті секрет зберігають у змінних оточення (.env),
// а не прямо в коді! Тут — спрощено, для навчання.
export const JWT_SECRET = 'navchalnyi-sekret-zminy-mene'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization // очікуємо "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Потрібна авторизація' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId // зберігаємо id користувача в запиті
    next() // все ок, пропускаємо запит далі
  } catch (err) {
    return res.status(401).json({ error: 'Недійсний або протермінований токен' })
  }
}
