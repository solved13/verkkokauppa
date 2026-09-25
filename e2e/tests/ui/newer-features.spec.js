import { test, expect } from '@playwright/test'
import { registerUser, registerAdmin, createProduct, loginViaUI, openCategory } from '../../helpers.js'



test.describe('Theme toggle (UI)', () => {
  test('theme toggle switches between light and dark mode and remembers the choice', async ({ page, request }) => {
    const buyer = await registerUser(request, 'theme-toggle')
    await loginViaUI(page, buyer.email, buyer.password)

    const html = page.locator('html')
    const toggle = page.locator('.theme-toggle')
    await expect(toggle).toBeVisible()

    const before = await html.getAttribute('data-theme')
    expect(['light', 'dark']).toContain(before)

    await toggle.click()
    const after = await html.getAttribute('data-theme')
    expect(after).not.toBe(before)
    expect(['light', 'dark']).toContain(after)
    await expect(toggle).toHaveText(after === 'dark' ? '☀️' : '🌙')


    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', after)
  })
})

test.describe('Cart quantity and product photos (UI)', () => {
  test('cart shows a product photo per line and supports increasing/decreasing the quantity', async ({
    page,
    request,
  }) => {
    const admin = await registerAdmin(request, 'cart-qty')
    const product = await createProduct(request, admin.token, { category: 'new', price: 30, stock: 5 })
    const buyer = await registerUser(request, 'cart-qty-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    await page.locator('.product-card', { hasText: product.name }).getByRole('button', { name: 'Lisää ostoskoriin' }).click()
    await page.locator('.cart-summary').click()

    const cartItem = page.locator('.cart-list .cart-item', { hasText: product.name })
    await expect(cartItem).toBeVisible()
    await expect(cartItem.locator('.cart-item-image')).toBeVisible()
    await expect(cartItem.locator('.qty-value')).toHaveText('1')
    await expect(cartItem.locator('.cart-item-price')).toContainText('30 €')

    await cartItem.getByRole('button', { name: 'Lisää määrää' }).click()
    await expect(cartItem.locator('.qty-value')).toHaveText('2')
    await expect(cartItem.locator('.cart-item-price')).toContainText('60 €')
    await expect(page.locator('.cart-summary')).toContainText('2 kpl')

    await cartItem.getByRole('button', { name: 'Vähennä määrää' }).click()
    await expect(cartItem.locator('.qty-value')).toHaveText('1')

    
    await cartItem.getByRole('button', { name: 'Vähennä määrää' }).click()
    await expect(page.locator('.cart-list .cart-item', { hasText: product.name })).toHaveCount(0)
    await expect(page.locator('.cart-empty')).toBeVisible()
  })

  test('the "+" button is disabled once the cart quantity reaches the available stock', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'cart-qty-limit')
    const product = await createProduct(request, admin.token, { category: 'new', price: 10, stock: 2 })
    const buyer = await registerUser(request, 'cart-qty-limit-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    await page.locator('.product-card', { hasText: product.name }).getByRole('button', { name: 'Lisää ostoskoriin' }).click()
    await page.locator('.cart-summary').click()

    const cartItem = page.locator('.cart-list .cart-item', { hasText: product.name })
    await cartItem.getByRole('button', { name: 'Lisää määrää' }).click()
    await expect(cartItem.locator('.qty-value')).toHaveText('2')
    await expect(cartItem.getByRole('button', { name: 'Lisää määrää' })).toBeDisabled()
  })
})

test.describe('Wishlist page (UI)', () => {
  test('user can open the dedicated favorites page from the home screen', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'wishlist-page')
    const product = await createProduct(request, admin.token, { category: 'new', price: 65 })
    const buyer = await registerUser(request, 'wishlist-page-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    await page
      .locator('.product-card', { hasText: product.name })
      .locator('.wishlist-btn:not(.edit-product-btn)')
      .click()


    await page.goto('/')
    await page.getByRole('button', { name: '♥ 1' }).click()

    await expect(page).toHaveURL(/\/wishlist/)
    await expect(page.getByRole('heading', { name: 'Suosikit' })).toBeVisible()
    await expect(page.locator('.product-card', { hasText: product.name })).toBeVisible()
  })

  test('user can remove a product from favorites directly on the wishlist page', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'wishlist-remove')
    const product = await createProduct(request, admin.token, { category: 'old', price: 22 })
    const buyer = await registerUser(request, 'wishlist-remove-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'old')

    await page
      .locator('.product-card', { hasText: product.name })
      .locator('.wishlist-btn:not(.edit-product-btn)')
      .click()

    await page.goto('/wishlist')
    const card = page.locator('.product-card', { hasText: product.name })
    await expect(card).toBeVisible()

    await card.locator('.wishlist-btn').click()
    await expect(page.getByText(/Suosikkilista on tyhjä/)).toBeVisible()
  })
})