import { expect, test } from '@playwright/test'

/**
 * HTML5 drag-and-drop onto empty column chrome is flaky under Playwright’s iPhone 12 profile (touch emulation).
 * This flow runs on desktop Chromium via playwright.config `chromium-desktop` project.
 */
test.describe('substitutions · column chrome drop', () => {
  test('dragging an on-field player onto the bench column sends them off without a swap', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const uniqueName = `M7 Bench ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/number of periods/i).fill('2')
    await page.getByLabel(/period length/i).fill('0:30')
    await page.getByLabel(/break length/i).fill('0:05')
    await page.getByLabel(/players on field/i).fill('2')

    await page.getByRole('button', { name: /save game type/i }).click()
    await page.getByRole('button', { name: /^start game$/i }).click()

    await page.getByTestId('roster-name-input').fill(`Roster ${uniqueName}`)
    await page.getByTestId('roster-save').click()

    for (const row of [
      { name: 'Alex', shirt: '1' },
      { name: 'Blake', shirt: '2' },
    ]) {
      await page.getByTestId('player-name-input').fill(row.name)
      await page.getByTestId('player-shirt-input').fill(row.shirt)
      await page.getByTestId('add-player-submit').click()
    }

    await page.getByTestId('roster-continue-to-game').click()
    await page.getByTestId('timer-start').click()

    const fieldCards = page.getByTestId('on-field-list').locator('[data-testid^="game-player-field-"]')
    const benchCards = page.getByTestId('bench-list').locator('[data-testid^="game-player-bench-"]')

    await expect(fieldCards).toHaveCount(2)
    await expect(benchCards).toHaveCount(0)

    const benchGutter = page.getByTestId('bench-drop-gutter')
    await benchGutter.waitFor({ state: 'visible' })
    const gutterBox = await benchGutter.boundingBox()
    expect(gutterBox).not.toBeNull()
    expect(gutterBox!.height).toBeGreaterThan(32)

    await fieldCards.first().dragTo(benchGutter, {
      targetPosition: {
        x: Math.max(6, Math.floor(gutterBox!.width / 2)),
        y: Math.max(6, Math.floor(gutterBox!.height - 8)),
      },
    })

    await expect(fieldCards).toHaveCount(1)
    await expect(benchCards).toHaveCount(1)
    await expect(page.getByTestId('bench-list')).toContainText('Alex')
    await expect(page.getByTestId('on-field-list')).toContainText('Blake')
  })
})
