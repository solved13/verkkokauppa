import { test, expect } from '@playwright/test'
import {
  registerUser,
  registerAdmin,
  createProduct,
  uniqueProductName,
  loginViaUI,
  openCategory,
} from '../../helpers.js'
 
test.describe('Catalog and cart (UI)', () => {
  test('user sees admin product in the catalog and can add it to the cart', async ({ page, request }) => {
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
 
    // The cart is now opened as a separate panel (drawer) only after clicking
    // "cart-summary" in the header — the list of products in the cart is not in the DOM before this.
    await page.locator('.cart-summary').click()
    await expect(page.locator('.cart-list')).toContainText(product.name)
  })
 
  test('product with no stock cannot be added to the cart', async ({ page, request }) => {
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
 
  test('checkout leads to the payment screen with the correct amount, and payment changes the status', async ({
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
 
    // The "Tee tilaus" button is now inside the cart panel — open it first.
    await page.locator('.cart-summary').click()
    await page.getByRole('button', { name: 'Tee tilaus' }).click()

    await expect(page.getByText(/Tilaus nro/)).toBeVisible()
    await expect(page.getByText('Maksettava summa: 25 €')).toBeVisible()

    await page.getByRole('button', { name: 'Simuloi maksu' }).click()
    await expect(page.getByText(' Tilaus on maksettu!')).toBeVisible()
  })
 
  test('admin sees the add product button', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-admin-btn')
    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'new')
    await expect(page.getByRole('button', { name: '+ Lisää uusi tuote' })).toBeVisible()
  })
 
  test('regular user does not see the add product button', async ({ page, request }) => {
    const buyer = await registerUser(request, 'shop-admin-btn-buyer')
    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')
    await expect(page.getByRole('button', { name: '+ Lisää uusi tuote' })).toHaveCount(0)
  })
 
  test('admin can add a new product through the form, and it appears in the catalog', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-add-product')
    const newName = uniqueProductName('Form Sneaker')
 
    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'new')

    await page.getByRole('button', { name: '+ Lisää uusi tuote' }).click()

    await page.getByPlaceholder('Tuotteen nimi').fill(newName)
    await page.getByPlaceholder('Hinta (€)').fill('99')
    await page.getByPlaceholder('Varaston määrä (kpl)').fill('7')
    await page.getByPlaceholder('Kuvan linkki (URL)').fill('https://example.com/shoe.jpg')
    await page.locator('select').selectOption('new')

    await page.getByRole('button', { name: 'Tallenna tuote' }).click()
 
    // After success, the page automatically returns to the catalog — this is where we check the result,
    // because the intermediate " Tuote lisätty!" message is visible for too short a time for a stable check.
    await expect(page.locator('.product-card', { hasText: newName })).toBeVisible()
  })
})
