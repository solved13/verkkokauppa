import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'

function uniqueEmail(tag) {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`
}

test.describe('Автентифікація (UI)', () => {
  test('нова людина може зареєструватись через форму і потрапляє на головну', async ({ page }) => {
    const email = uniqueEmail('ui-register')

    await page.goto('/')

    // На старті відкрита форма логіну — перемикаємось на реєстрацію
    await page.getByRole('link', { name: 'Rekisteröidy' }).click()

    await page.getByPlaceholder('Nimi').fill('Testi Käyttäjä')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill('Salasana123')
    await page.getByRole('button', { name: 'Rekisteröidy' }).click()

    await expect(page.getByText(/Hei, Testi Käyttäjä/)).toBeVisible()
  })

  test('вже зареєстрований користувач може увійти через форму логіну', async ({ page, request }) => {
    const email = uniqueEmail('ui-login')
    const password = 'PravidniyParol123'

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Логін Тест', email, password },
    })

    await page.goto('/')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill(password)
    await page.getByRole('button', { name: 'Kirjaudu' }).click()

    await expect(page.getByText(/Hei, Логін Тест/)).toBeVisible()
  })

  test('невірний пароль показує повідомлення про помилку і не пускає далі', async ({ page, request }) => {
    const email = uniqueEmail('ui-wrong-pass')

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Помилка Тест', email, password: 'PravidniyParol123' },
    })

    await page.goto('/')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill('NevirnyiParol')
    await page.getByRole('button', { name: 'Kirjaudu' }).click()

    await expect(page.getByText('Väärä sähköposti tai salasana')).toBeVisible()
    // все ще на екрані логіну, не потрапили на головну
    await expect(page.getByRole('button', { name: 'Kirjaudu' })).toBeVisible()
  })

  test('перемикання між формами логіну і реєстрації працює в обидва боки', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Kirjaudu sisään' })).toBeVisible()

    await page.getByRole('link', { name: 'Rekisteröidy' }).click()
    await expect(page.getByRole('heading', { name: 'Rekisteröidy' })).toBeVisible()
    await expect(page.getByPlaceholder('Nimi')).toBeVisible()

    await page.getByRole('link', { name: 'Kirjaudu sisään' }).click()
    await expect(page.getByRole('heading', { name: 'Kirjaudu sisään' })).toBeVisible()
  })
})
