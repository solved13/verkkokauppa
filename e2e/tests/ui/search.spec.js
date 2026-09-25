import { test, expect } from '@playwright/test'
import { registerUser, registerAdmin, createProduct, uniqueProductName, loginViaUI, openCategory } from '../../helpers.js'


test.describe('Site search (UI)', () => {
  test('typing a query shows a matching result with its name, price and category', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-basic')
    const product = await createProduct(request, admin.token, { category: 'new', price: 65 })
    const buyer = await registerUser(request, 'search-basic-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill(product.name)

    const result = page.locator('.site-search-result', { hasText: product.name })
    await expect(result).toBeVisible()
    await expect(result.locator('.site-search-meta')).toContainText('65 €')
    await expect(result.locator('.site-search-meta')).toContainText('Uudet')
  })

  test('search tolerates a typo in the product name', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-typo')
    
    const product = await createProduct(request, admin.token, {
      name: uniqueProductName('Nike Runner'),
      category: 'new',
    })
    const buyer = await registerUser(request, 'search-typo-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill('nikee runner')

    await expect(page.locator('.site-search-result', { hasText: product.name })).toBeVisible()
  })

  test('search also matches the category, not just the product name', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-category')
   
    const product = await createProduct(request, admin.token, {
      name: uniqueProductName('Perus'),
      category: 'old',
    })
    const uniqueSuffix = product.name.split(' ').slice(-1)[0]
    const buyer = await registerUser(request, 'search-category-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill(`retro ${uniqueSuffix}`)

    await expect(page.locator('.site-search-result', { hasText: product.name })).toBeVisible()
  })

  test('search also matches the product description', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-description')
    const product = await createProduct(request, admin.token, {
      name: uniqueProductName('Kuvaustuote'),
      category: 'new',
      description: 'Erittäin hengittävä verkkokangas ja kevyt pohja pitkille lenkeille.',
    })
    const buyer = await registerUser(request, 'search-description-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill('hengittävä verkkokangas')

    await expect(page.locator('.site-search-result', { hasText: product.name })).toBeVisible()
  })

  test('a query that matches nothing shows the "no results" message', async ({ page, request }) => {
    const buyer = await registerUser(request, 'search-empty')
    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill('qzxjklwnosuchproduct')

    await expect(page.locator('.site-search-status')).toContainText('Ei tuloksia haulle')
  })

  test('clicking a result opens the product detail view for the right product', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-click')
    const product = await createProduct(request, admin.token, { category: 'old', price: 48 })
    const buyer = await registerUser(request, 'search-click-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    await page.getByPlaceholder('Hae tuotteita…').fill(product.name)
    await page.locator('.site-search-result', { hasText: product.name }).click()

    await expect(page).toHaveURL(new RegExp(`/shop/old\\?product=${product._id}`))
    const modal = page.locator('.detail-modal')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(product.name)).toBeVisible()
    await expect(modal.getByText('48 €')).toBeVisible()
  })

  test('pressing Enter with a single result opens it, same as clicking', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-enter')
    const product = await createProduct(request, admin.token, { category: 'new', price: 72 })
    const buyer = await registerUser(request, 'search-enter-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    const input = page.getByPlaceholder('Hae tuotteita…')
    await input.fill(product.name)
    await expect(page.locator('.site-search-result', { hasText: product.name })).toBeVisible()
    await input.press('Enter')

    await expect(page.locator('.detail-modal')).toBeVisible()
    await expect(page.locator('.detail-modal').getByText(product.name)).toBeVisible()
  })

  test('the clear button empties the field and closes the results', async ({ page, request }) => {
    const admin = await registerAdmin(request, 'search-clear')
    const product = await createProduct(request, admin.token, { category: 'new' })
    //const buyer = await registerUser(request, 'search-clear-buyer')

    await loginViaUI(page, buyer.email, buyer.password)

    const input = page.getByPlaceholder('Hae tuotteita…')
    await input.fill(product.name)
    await expect(page.locator('.site-search-result', { hasText: product.name })).toBeVisible()

    await page.getByRole('button', { name: 'Tyhjennä haku' }).click()

    await expect(input).toHaveValue('')
    await expect(page.locator('.site-search-results')).toHaveCount(0)
  })

  test('the search field is available on the home, shop and wishlist screens', async ({ page, request }) => {
    const buyer = await registerUser(request, 'search-everywhere')
    await loginViaUI(page, buyer.email, buyer.password)

    await expect(page.locator('.user-bar .site-search')).toBeVisible()

    await openCategory(page, 'new')
    await expect(page.locator('.shop-header .site-search')).toBeVisible()

    await page.goto('/wishlist')
    await expect(page.locator('.shop-header .site-search')).toBeVisible()
  })
})