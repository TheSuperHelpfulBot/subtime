import { expect, test } from '@playwright/test'
import { completeStrategySetup } from './helpers/strategySetup'

test.describe('player rosters', () => {
  test('create roster, add player, survives reload; visible on game screen', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const gameTypeName = `Roster E2E GT ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(gameTypeName)
    await page.getByLabel(/number of periods/i).fill('4')
    await page.getByLabel(/period length/i).fill('12')
    await page.getByLabel(/break length/i).fill('2')
    await page.getByRole('button', { name: /save game type/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()

    await page
      .getByTestId('saved-game-types')
      .locator('li')
      .filter({ hasText: gameTypeName })
      .getByRole('button', { name: /start game/i })
      .click()

    await expect(page.getByTestId('set-up-roster-screen')).toBeVisible()

    const rosterName = `E2E Roster ${Date.now()}`
    await page.getByTestId('roster-name-input').fill(rosterName)
    await page.getByTestId('roster-save').click()

    await page.getByTestId('player-name-input').fill('Jordan')
    await page.getByTestId('player-shirt-input').fill('14')
    await page.getByTestId('add-player-submit').click()
    await expect(page.getByTestId('roster-players-list')).toContainText('Jordan')
    await expect(page.getByTestId('roster-players-list')).toContainText('14')

    await page.getByTestId('roster-continue-to-game').click()
    await completeStrategySetup(page)

    await expect(page.getByTestId('game-roster-panel')).toContainText(rosterName)
    await expect(page.getByTestId('on-field-list')).toContainText('Jordan')

    await page.reload()
    await page.getByRole('button', { name: /get started/i }).click()
    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()

    await page
      .getByTestId('saved-game-types')
      .locator('li')
      .filter({ hasText: gameTypeName })
      .getByRole('button', { name: /start game/i })
      .click()

    await expect(page.getByTestId('load-saved-rosters-screen')).toBeVisible()
    await expect(page.getByTestId('rosters-list')).toContainText(rosterName)

    await page
      .getByTestId('rosters-list')
      .locator('li')
      .filter({ hasText: rosterName })
      .getByRole('button', { name: /use for this game/i })
      .click()
    await completeStrategySetup(page)

    await expect(page.getByTestId('game-roster-panel')).toContainText(rosterName)
    await expect(page.getByTestId('on-field-list')).toContainText('Jordan')
  })
})
