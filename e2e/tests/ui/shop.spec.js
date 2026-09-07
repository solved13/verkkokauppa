import { test, expect } from '@playwright/test'
import {
  registerUser,
  registerAdmin,
  createProduct,
  uniqueProductName,
  loginViaUI,
  openCategory,
} from '../../helpers.js'

test.describe('Каталог і кошик (UI)', () => {
  test('користувач бачить товар адміна в каталозі і може додати його в кошик', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-browse')
    const product = await createProduct(request, admin.token, {
      category: 'new',
      price: 55,
      stock: 5,
    })
    const buyer = await registerUser(request, 'shop-browse-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    const card = page.locator('.product-card', { hasText: product.name })
    await expect(card).toBeVisible()
    await expect(card.getByText('55 €')).toBeVisible()

    await card.getByRole('button', { name: 'Lisää ostoskoriin' }).click()

    await expect(page.locator('.cart-summary')).toContainText('1 kpl')
    await expect(page.locator('.cart-list')).toContainText(product.name)
  })

  test('товар без залишку на складі не можна додати в кошик', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-outofstock')
    const product = await createProduct(request, admin.token, { category: 'old', stock: 0 })
    const buyer = await registerUser(request, 'shop-outofstock-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'old')

    const card = page.locator('.product-card', { hasText: product.name })
    await expect(card.getByText('Loppuunmyyty')).toBeVisible()

    const addButton = card.getByRole('button', { name: 'Ei saatavilla' })
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeDisabled()
  })

  test('оформлення замовлення веде на екран оплати з правильною сумою, і оплата змінює статус', async ({
    page,
    request,
  }) => {
    const admin = await registerAdmin(request, 'shop-checkout')
    const product = await createProduct(request, admin.token, { category: 'new', price: 25, stock: 4 })
    const buyer = await registerUser(request, 'shop-checkout-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    const card = page.locator('.product-card', { hasText: product.name })
    await card.getByRole('button', { name: 'Lisää ostoskoriin' }).click()

    await page.getByRole('button', { name: 'Tee tilaus' }).click()

    await expect(page.getByText(/Tilaus nro/)).toBeVisible()
    await expect(page.getByText('Maksettava summa: 25 €')).toBeVisible()

    await page.getByRole('button', { name: 'Simuloi maksu' }).click()
    await expect(page.getByText('✅ Tilaus on maksettu!')).toBeVisible()
  })

  test('адмін бачить кнопку додавання товару', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-admin-btn')
    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'new')
    await expect(page.getByRole('button', { name: '+ Lisää uusi tuote' })).toBeVisible()
  })

  test('звичайний користувач не бачить кнопку додавання товару', async ({ page, request }) => {
    const buyer = await registerUser(request, 'shop-admin-btn-buyer')
    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')
    await expect(page.getByRole('button', { name: '+ Lisää uusi tuote' })).toHaveCount(0)
  })

  test('адмін може додати новий товар через форму, і він з’являється в каталозі', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-add-product')
    const newName = uniqueProductName('Форма Кед')

    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'new')

    await page.getByRole('button', { name: '+ Lisää uusi tuote' }).click()

    await page.getByPlaceholder('Tuotteen nimi').fill(newName)
    await page.getByPlaceholder('Hinta (€)').fill('99')
    await page.getByPlaceholder('Varaston määrä (kpl)').fill('7')
    await page.getByPlaceholder('Kuvan linkki (URL)').fill('https://example.com/shoe.jpg')
    await page.locator('select').selectOption('new')

    await page.getByRole('button', { name: 'Tallenna tuote' }).click()

    // Після успіху сторінка сама повертається в каталог — саме там перевіряємо результат,
    // бо проміжне повідомлення "✅ Tuote lisätty!" видно надто коротко для стабільної перевірки.
    await expect(page.locator('.product-card', { hasText: newName })).toBeVisible()
  })
})
