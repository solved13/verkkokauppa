import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../env.js'

function uniqueEmail(tag) {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`
}

test.describe('Authentication (UI)', () => {
  test('new user can register through the form and is redirected to the home page', async ({ page }) => {
    const email = uniqueEmail('ui-register')

    await page.goto('/')

    // The login form is open initially — switch to registration
    await page.getByRole('link', { name: 'Rekisteröidy' }).click()

    await page.getByPlaceholder('Nimi').fill('Testi Käyttäjä')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill('Salasana123')
    await page.getByRole('button', { name: 'Rekisteröidy' }).click()

    await expect(page.getByText(/Hei, Testi Käyttäjä/)).toBeVisible()
  })

  test('already registered user can log in through the login form', async ({ page, request }) => {
    const email = uniqueEmail('ui-login')
    const password = 'PravidniyParol123'

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Login Test', email, password },
    })

    await page.goto('/')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill(password)
    await page.getByRole('button', { name: 'Kirjaudu' }).click()

    await expect(page.getByText(/Hei, Login Test/)).toBeVisible()
  })

  test('incorrect password displays an error message and does not allow access', async ({ page, request }) => {
    const email = uniqueEmail('ui-wrong-pass')

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: 'Error Test', email, password: 'PravidniyParol123' },
    })

    await page.goto('/')
    await page.getByPlaceholder('Sähköposti').fill(email)
    await page.getByPlaceholder('Salasana').fill('NevirnyiParol')
    await page.getByRole('button', { name: 'Kirjaudu' }).click()

    await expect(page.getByText('Väärä sähköposti tai salasana')).toBeVisible()
    // Still on the login screen, did not reach the home page
    await expect(page.getByRole('button', { name: 'Kirjaudu' })).toBeVisible()
  })

  test('switching between login and registration forms works both ways', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Kirjaudu sisään' })).toBeVisible()

    await page.getByRole('link', { name: 'Rekisteröidy' }).click()
    await expect(page.getByRole('heading', { name: 'Rekisteröidy' })).toBeVisible()
    await expect(page.getByPlaceholder('Nimi')).toBeVisible()

    await page.getByRole('link', { name: 'Kirjaudu sisään' }).click()
    await expect(page.getByRole('heading', { name: 'Kirjaudu sisään' })).toBeVisible()
  })
})