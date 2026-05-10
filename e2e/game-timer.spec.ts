import { expect, test } from '@playwright/test'

test.describe('game timer', () => {
  test('select game type, start match, pause, resume, skip, return to list', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const uniqueName = `M4 Timer ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/number of periods/i).fill('2')
    await page.getByLabel(/period length/i).fill('0:20')
    await page.getByLabel(/break length/i).fill('0:05')

    await page.getByRole('button', { name: /save game type/i }).click()

    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()
    await page.getByRole('button', { name: /^start game$/i }).click()

    await expect(page.getByTestId('set-up-roster-screen')).toBeVisible()
    await page.getByTestId('roster-name-input').fill(`Roster ${uniqueName}`)
    await page.getByTestId('roster-save').click()

    await expect(page.getByTestId('roster-editor')).toBeVisible()
    await page.getByTestId('roster-continue-to-game').click()

    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByTestId('game-roster-panel')).toBeVisible()
    await expect(page.getByTestId('timer-segment-label')).toHaveText(/ready/i)

    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('timer-pause')).toBeVisible()
    await expect(page.getByTestId('timer-segment-label')).toHaveText(/period 1/i)

    await page.getByTestId('timer-pause').click()
    await expect(page.getByTestId('timer-resume')).toBeVisible()

    await page.getByTestId('timer-resume').click()
    await page.getByTestId('timer-skip-forward').click()
    await expect(page.getByTestId('timer-segment-label')).toHaveText(/break|period 2/i)

    await page.getByTestId('game-back-to-types').click()
    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()
    await expect(page.getByTestId('saved-game-types').getByText(uniqueName, { exact: true })).toBeVisible()
  })
})
