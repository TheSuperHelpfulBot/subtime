import { expect, test } from '@playwright/test'

test.describe('welcome', () => {
  test('shows Simple Subs welcome screen', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: /simple subs/i })).toBeVisible()
    await expect(page.getByText(/substitution scheduling/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible()
  })

  test('exposes web app manifest', async ({ page }) => {
    await page.goto('./')
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveCount(1)
    const href = await manifestLink.getAttribute('href')
    expect(href).toBeTruthy()
    const manifestUrl = new URL(href!, page.url()).href
    const res = await page.request.get(manifestUrl)
    expect(res.ok()).toBeTruthy()
    const json = (await res.json()) as { name?: string }
    expect(json.name).toMatch(/simple subs/i)
  })

  test('welcome stays visible offline after service worker caches shell', async ({
    page,
    context,
  }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: /simple subs/i })).toBeVisible()
    await page.waitForFunction(
      () =>
        typeof navigator !== 'undefined' &&
        !!navigator.serviceWorker &&
        navigator.serviceWorker.controller != null,
      undefined,
      { timeout: 60_000 },
    )
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: /simple subs/i })).toBeVisible()
  })
})
