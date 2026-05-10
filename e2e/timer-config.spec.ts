import { expect, test } from '@playwright/test'

test.describe('timer config', () => {
  test('user fills game timer form and summary updates', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    await expect(page.getByRole('heading', { name: /set up game type/i })).toBeVisible()

    const periods = page.getByLabel(/number of periods/i)
    const periodMins = page.getByLabel(/period length/i)
    const breakMins = page.getByLabel(/break length/i)

    await periods.fill('3')
    await periodMins.fill('15')
    await breakMins.fill('5')

    const summary = page.getByTestId('timer-summary')
    await expect(summary).toContainText('3 periods')
    await expect(summary).toContainText('15 minutes')
    await expect(summary).toContainText('5-minute breaks')
  })
})
