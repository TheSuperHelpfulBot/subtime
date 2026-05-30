import { expect, test } from '@playwright/test'
import { editSavedGameType } from './helpers/navigation'

test.describe('game types · on-field player count', () => {
  test('create and edit persist on-field player count', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    await expect(page.getByRole('heading', { name: /set up game type/i })).toBeVisible()

    const uniqueName = `E2E OnField ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/players on field/i).fill('7')
    await page.getByLabel(/number of periods/i).fill('4')
    await page.getByLabel(/period length/i).fill('12')
    await page.getByLabel(/break length/i).fill('2')

    await page.getByRole('button', { name: /save game type/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()
    const row = page.getByTestId('saved-game-types').getByText(uniqueName, { exact: true })
    await expect(row).toBeVisible()

    await editSavedGameType(page, uniqueName)

    await expect(page.getByLabel(/players on field/i)).toHaveValue('7')
    await page.getByLabel(/players on field/i).fill('5')
    await page.getByRole('button', { name: /save game type/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: /get started/i }).click()

    await editSavedGameType(page, uniqueName)
    await expect(page.getByLabel(/players on field/i)).toHaveValue('5')
  })
})
