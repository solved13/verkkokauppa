import { test, expect } from '@playwright/test'
import { registerUser, registerAdmin, createProduct, loginViaUI, openCategory } from '../../helpers.js'

test.describe('Animated logo (UI)', () => {
  // The login screen no longer shows the animated logo at all (it was
  // removed together with the theme toggle to keep that screen minimal —
  // see 'the login screen has no logo or theme toggle' in auth.spec.js),
  // so every animation test below runs against a screen that still has it:
  // home, shop and wishlist.
  test('clicking the logo on the home screen plays the footstep animation without navigating away', async ({
    page,
    request,
  }) => {
    const buyer = await registerUser(request, 'logo-home')
    await loginViaUI(page, buyer.email, buyer.password)

    const logo = page.locator('.brand-mark-animated')
    await logo.click()

    // .footstep-scene itself is an empty wrapper with no box of its own —
    // its trail children are position:absolute against the logo button
    // (deliberately, so they aren't clipped to the wrapper), so the visible
    // check has to target a trail rather than the wrapper span.
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

    // The footsteps show up right away — navigation is deliberately delayed
    // (~800ms) so the animation has time to play before the screen changes.
    await expect(page.locator('.footstep-trail').first()).toBeVisible()
    await expect(page).toHaveURL(/\/shop\/new/)

    // After the delay it lands back on the home screen. The margin over the
    // ~800ms setTimeout is generous on purpose — with many workers sharing
    // one CPU/backend, a tight timeout here is the kind of thing that makes
    // an otherwise-correct test flaky under load.
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
    // A couple of pixels of tolerance for sub-pixel rendering differences.
    expect(Math.abs(homeHeaderBox.height - shopHeaderBox.height)).toBeLessThanOrEqual(2)
  })
})