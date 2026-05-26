import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string
}

test.describe('version and app updates', () => {
  test('top-left menu opens About with the deployed version identifier', async ({ page }) => {
    await page.goto('./')

    const menuButton = page.getByRole('button', { name: /open app menu/i })
    await expect(menuButton).toBeVisible()

    const box = await menuButton.boundingBox()
    expect(box?.x).toBeLessThan(80)
    expect(box?.y).toBeLessThan(80)

    await menuButton.click()

    const aboutItem = page.getByRole('menuitem', { name: /^about$/i })
    await expect(aboutItem).toBeVisible()
    await aboutItem.click()

    const dialog = page.getByRole('dialog', { name: /about simple subs/i })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(`Version ${packageJson.version}`)
    await expect(dialog).toContainText(/Build/i)
    await expect(dialog).toContainText(/Commit/i)
  })

  test('update prompt can be deferred without clearing saved local data', async ({ page }) => {
    await page.goto('./')

    await page.evaluate(() => {
      localStorage.setItem(
        'rosters',
        JSON.stringify([
          {
            id: 'roster-update-test',
            name: 'Saved Update Test Roster',
            players: [],
          },
        ]),
      )
      window.dispatchEvent(new CustomEvent('subtime:update-available'))
    })

    const prompt = page.getByTestId('update-available-prompt')
    await expect(prompt).toBeVisible()
    await expect(prompt).toContainText(/update available/i)
    await expect(page.getByRole('button', { name: /update now/i })).toBeVisible()

    await page.getByRole('button', { name: /later/i }).click()
    await expect(prompt).toBeHidden()

    const savedRosters = await page.evaluate(() => localStorage.getItem('rosters'))
    expect(savedRosters).toContain('Saved Update Test Roster')
  })
})
