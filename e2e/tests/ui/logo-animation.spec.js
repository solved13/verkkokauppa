import { test, expect } from '@playwright/test'
import { registerUser, registerAdmin, createProduct, loginViaUI, openCategory } from '../../helpers.js'

test.describe('Animated logo (UI)', () => {

  test('clicking the logo on the home screen plays the footstep animation without navigating away', async ({
    page,
    request,
  }) => {
    const buyer = await registerUser(request, 'logo-home')
    await loginViaUI(page, buyer.email, buyer.password)

    const logo = page.locator('.brand-mark-animated')
    await logo.click()


    await expect(page.locator('.footstep-trail').first()).toBeVisible()
    // The home screen's logo has no navigation attached either.
    await expect(page).toHaveURL(/\/$/)
  })

  test('clicking the logo plays the animation every time, not just once', async ({ page, request }) => {
    const buyer = await registerUser(request, 'logo-repeat')
    await loginViaUI(page, buyer.email, buyer.password)
    const logo = page.locator('.brand-mark-animated')

    await logo.click()
    await expect(page.locator('.footstep-trail').first()).toBeVisible()
    await expect(page.locator('.footstep-scene')).toHaveCount(0, { timeout: 3000 })

    // Clicking again after it has fully finished plays it again.
    await logo.click()
    await expect(page.locator('.footstep-trail').first()).toBeVisible()
  })

  test('clicking the logo on the shop screen plays the animation, then returns to the home screen', async ({
    page,
    request,
  }) => {
    const admin = await registerAdmin(request, 'logo-shop')
    await createProduct(request, admin.token, { category: 'new' })
    const buyer = await registerUser(request, 'logo-shop-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')

    const logo = page.locator('.brand-mark-animated')
    await logo.click()


    await expect(page.locator('.footstep-trail').first()).toBeVisible()
    await expect(page).toHaveURL(/\/shop\/new/)

    /
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('clicking the logo on the wishlist page plays the animation, then returns to the home screen', async ({
    page,
    request,
  }) => {
    const admin = await registerAdmin(request, 'logo-wishlist')
    const product = await createProduct(request, admin.token, { category: 'new' })
    const buyer = await registerUser(request, 'logo-wishlist-buyer')

    await loginViaUI(page, buyer.email, buyer.password)
    await openCategory(page, 'new')
    await page
      .locator('.product-card', { hasText: product.name })
      .locator('.wishlist-btn:not(.edit-product-btn)')
      .click()
    await page.goto('/wishlist')

    const logo = page.locator('.brand-mark-animated')
    await logo.click()

    await expect(page.locator('.footstep-trail').first()).toBeVisible()
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })
})

test.describe('Shop/home header consistency (UI)', () => {
  test('the shop header is the same height as the home screen header', async ({ page, request }) => {
    const buyer = await registerUser(request, 'header-height')
    await loginViaUI(page, buyer.email, buyer.password)

    const homeHeaderBox = await page.locator('.user-bar').boundingBox()
    await openCategory(page, 'new')
    const shopHeaderBox = await page.locator('.shop-header').boundingBox()

    expect(homeHeaderBox).not.toBeNull()
    expect(shopHeaderBox).not.toBeNull()
  
    expect(Math.abs(homeHeaderBox.height - shopHeaderBox.height)).toBeLessThanOrEqual(2)
  })
})