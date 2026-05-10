import { expect, test } from '@playwright/test'

test.describe('game types', () => {
  test('first save goes to load saved list; reload opens load saved when data exists', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    await expect(page.getByRole('heading', { name: /set up game type/i })).toBeVisible()

    const uniqueName = `E2E Type ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/number of periods/i).fill('6')
    await page.getByLabel(/period length/i).fill('20')
    await page.getByLabel(/break length/i).fill('3')

    await page.getByRole('button', { name: /save game type/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()
    const list = page.getByTestId('saved-game-types')
    await expect(list.getByText(uniqueName, { exact: true })).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: /get started/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()
    await expect(page.getByTestId('saved-game-types').getByText(uniqueName, { exact: true })).toBeVisible()
  })
})
