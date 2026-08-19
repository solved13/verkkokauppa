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

    // The cart is shown as a separate panel (drawer), opened only after clicking
    // "cart-summary" in the header — the product list is not in the DOM before that.
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

    // The "Tee tilaus" button lives inside the cart panel — open it first.
    await page.locator('.cart-summary').click()
    await page.getByRole('button', { name: 'Tee tilaus' }).click()

    await expect(page.getByText(/Tilaus nro/)).toBeVisible()
    await expect(page.getByText('Maksettava summa: 25 €')).toBeVisible()

    await page.getByRole('button', { name: 'Simuloi maksu' }).click()
    await expect(page.getByText(' Tilaus on maksettu!')).toBeVisible({ timeout: 15000 })
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

    // On success the page automatically returns to the catalog — we check the
    // result there, since the intermediate "✅ Tuote lisätty!" message is only
    // visible for too short a time for a stable assertion.
    await expect(page.locator('.product-card', { hasText: newName })).toBeVisible()
  })

  test('user can favorite a product and filter the catalog down to favorites', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-wishlist')
    const liked = await createProduct(request, admin.token, { category: 'new', price: 60 })
    const other = await createProduct(request, admin.token, { category: 'new', price: 20 })
    const buyer = await registerUser(request, 'shop-wishlist-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    await expect(page.locator('.product-card', { hasText: liked.name })).toBeVisible()
    await expect(page.locator('.product-card', { hasText: other.name })).toBeVisible()

    // Favorite only one of the two products.
    await page
      .locator('.product-card', { hasText: liked.name })
      .locator('.wishlist-btn:not(.edit-product-btn)')
      .click()

    // The "♥ Suosikit" toggle in the header filters the grid down to favorites only.
    await page.getByRole('button', { name: /Suosikit/ }).click()

    await expect(page.locator('.product-card', { hasText: liked.name })).toBeVisible()
    await expect(page.locator('.product-card', { hasText: other.name })).toHaveCount(0)
  })

  test('the home screen favorites link opens the catalog pre-filtered to favorites', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-wishlist-home')
    const liked = await createProduct(request, admin.token, { category: 'new', price: 45 })
    const buyer = await registerUser(request, 'shop-wishlist-home-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')
    await page
      .locator('.product-card', { hasText: liked.name })
      .locator('.wishlist-btn:not(.edit-product-btn)')
      .click()

    // Back to the home screen — the "♥ N" link there only shows up once
    // something has been favorited.
    await page.goto('/')
    const homeWishlistLink = page.getByRole('button', { name: '♥ 1' })
    await expect(homeWishlistLink).toBeVisible()
    await homeWishlistLink.click()

    await expect(page).toHaveURL(/\/shop\/new\?wishlist=1/)
    await expect(page.locator('.product-card', { hasText: liked.name })).toBeVisible()
  })

  test('admin can edit an existing product and see the change reflected in the catalog', async ({
    page,
    request,
  }) => {
    const admin = await registerAdmin(request, 'shop-edit')
    const product = await createProduct(request, admin.token, { category: 'new', price: 40, stock: 3 })

    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'new')

    await page.locator('.product-card', { hasText: product.name }).getByTitle('Muokkaa tuotetta').click()

    await expect(page.getByRole('heading', { name: 'Muokkaa tuotetta' })).toBeVisible()
    // The form comes pre-filled with the product's current price.
    await expect(page.getByPlaceholder('Hinta (€)')).toHaveValue('40')

    await page.getByPlaceholder('Hinta (€)').fill('77')
    await page.getByRole('button', { name: 'Tallenna muutokset' }).click()

    await expect(page.locator('.product-card', { hasText: product.name })).toContainText('77 €')
  })

  test('admin can delete a product from the edit form', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'shop-delete')
    const product = await createProduct(request, admin.token, { category: 'old', price: 15, stock: 2 })

    await loginViaUI(page, admin.email, admin.password)
    await openCategory(page, 'old')

    await page.locator('.product-card', { hasText: product.name }).getByTitle('Muokkaa tuotetta').click()
    await expect(page.getByRole('heading', { name: 'Muokkaa tuotetta' })).toBeVisible()

    // Deletion is confirmed through the browser's native confirm() dialog.
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Poista tuote' }).click()

    await expect(page.locator('.product-card', { hasText: product.name })).toHaveCount(0)
  })
})