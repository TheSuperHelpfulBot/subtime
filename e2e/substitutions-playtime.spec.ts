import { expect, test } from '@playwright/test'
import { completeStrategySetup } from './helpers/strategySetup'

test.describe('substitutions and playtime (Milestone 7)', () => {
  test('warns when fewer than expected on field but Start stays enabled', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const uniqueName = `M7 Slots ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/number of periods/i).fill('2')
    await page.getByLabel(/period length/i).fill('0:30')
    await page.getByLabel(/break length/i).fill('0:05')
    await page.getByLabel(/players on field/i).fill('3')

    await page.getByRole('button', { name: /save game type/i }).click()
    await expect(page.getByRole('heading', { name: /load saved game type/i })).toBeVisible()

    await page.getByRole('button', { name: /^start game$/i }).click()
    await expect(page.getByTestId('set-up-roster-screen')).toBeVisible()

    await page.getByTestId('roster-name-input').fill(`Roster ${uniqueName}`)
    await page.getByTestId('roster-save').click()
    await expect(page.getByTestId('roster-editor')).toBeVisible()

    await page.getByTestId('player-name-input').fill('Alex')
    await page.getByTestId('player-shirt-input').fill('1')
    await page.getByTestId('add-player-submit').click()

    await page.getByTestId('player-name-input').fill('Blake')
    await page.getByTestId('player-shirt-input').fill('2')
    await page.getByTestId('add-player-submit').click()

    await page.getByTestId('roster-continue-to-game').click()
    await completeStrategySetup(page)
    await expect(page.getByTestId('game-screen')).toBeVisible()

    await expect(page.getByTestId('lineup-count-warning')).toContainText(/expected 3 on field/i)
    await expect(page.getByTestId('lineup-count-warning')).toContainText(/you have 2/i)

    const start = page.getByTestId('timer-start')
    await expect(start).toBeEnabled()
  })

  test('after starting the period, each on-field player shows live cumulative time', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const uniqueName = `M7 Time ${Date.now()}`
    await page.getByLabel(/game type name/i).fill(uniqueName)
    await page.getByLabel(/number of periods/i).fill('2')
    await page.getByLabel(/period length/i).fill('1:00')
    await page.getByLabel(/break length/i).fill('0:05')
    await page.getByLabel(/players on field/i).fill('2')

    await page.getByRole('button', { name: /save game type/i }).click()
    await page.getByRole('button', { name: /^start game$/i }).click()

    await page.getByTestId('roster-name-input').fill(`Roster ${uniqueName}`)
    await page.getByTestId('roster-save').click()

    for (const row of [
      { name: 'Alex', shirt: '1' },
      { name: 'Blake', shirt: '2' },
      { name: 'Casey', shirt: '3' },
    ]) {
      await page.getByTestId('player-name-input').fill(row.name)
      await page.getByTestId('player-shirt-input').fill(row.shirt)
      await page.getByTestId('add-player-submit').click()
    }

    await page.getByTestId('roster-continue-to-game').click()
    await completeStrategySetup(page)
    await expect(page.getByTestId('game-screen')).toBeVisible()

    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('timer-pause')).toBeVisible()

    await page.waitForTimeout(1200)

    const readouts = page.locator('[data-testid^="player-on-field-seconds-"]')
    await expect(readouts).toHaveCount(2)

    const first = await readouts.first().innerText()
    const second = await readouts.nth(1).innerText()

    function parseMmSs(label: string): number {
      const [m, s] = label.trim().split(':').map((x) => Number.parseInt(x, 10))
      if (!Number.isFinite(m) || !Number.isFinite(s)) return NaN
      return m * 60 + s
    }

    expect(parseMmSs(first)).toBeGreaterThanOrEqual(1)
    expect(parseMmSs(second)).toBeGreaterThanOrEqual(1)

    await page.getByTestId('timer-pause').click()
    await page.waitForTimeout(1200)

    const pausedFirst = await readouts.first().innerText()
    const pausedSecond = await readouts.nth(1).innerText()

    expect(parseMmSs(pausedFirst)).toBe(parseMmSs(first))
    expect(parseMmSs(pausedSecond)).toBe(parseMmSs(second))
  })

  test('dragging a bench player onto a field player swaps them', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /get started/i }).click()

    const uniqueName = `M7 Drag ${Date.now()}`
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
      { name: 'Casey', shirt: '3' },
    ]) {
      await page.getByTestId('player-name-input').fill(row.name)
      await page.getByTestId('player-shirt-input').fill(row.shirt)
      await page.getByTestId('add-player-submit').click()
    }

    await page.getByTestId('roster-continue-to-game').click()
    await completeStrategySetup(page)

    await page.getByTestId('timer-start').click()

    const fieldRows = page.getByTestId('on-field-list').locator('[data-testid^="game-player-field-"]')
    const benchRows = page.getByTestId('bench-list').locator('[data-testid^="game-player-bench-"]')

    await expect(fieldRows).toHaveCount(2)
    await expect(benchRows).toHaveCount(1)

    const dropTarget = fieldRows.first().getByTestId('player-drop-target')

    await benchRows.first().dragTo(dropTarget)

    await expect(page.getByTestId('on-field-list')).toContainText('Casey')
    await expect(page.getByTestId('bench-list')).toContainText('Alex')
  })
})
