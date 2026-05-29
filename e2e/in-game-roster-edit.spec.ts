import { expect, type Locator, type Page, test } from '@playwright/test'
import { completeStrategySetup } from './helpers/strategySetup'

async function createRunningGame(page: Page, uniqueName: string) {
  await page.goto('./')
  await page.getByRole('button', { name: /get started/i }).click()

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
  await expect(page.getByTestId('timer-pause')).toBeVisible()
}

async function timerSeconds(readout: Locator): Promise<number> {
  const label = (await readout.innerText()).trim()
  const [minutes, seconds] = label.split(':').map((part) => Number.parseInt(part, 10))
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    throw new Error(`Could not parse timer readout: ${label}`)
  }
  return minutes * 60 + seconds
}

test.describe('in-game roster editing', () => {
  test('edits player details and adds a bench player without stopping the running clock', async ({
    page,
  }) => {
    await createRunningGame(page, `In Game Roster ${Date.now()}`)

    const readout = page.getByTestId('timer-readout')
    const beforeEditSeconds = await timerSeconds(readout)
    await expect(page.getByTestId('timer-pause')).toBeVisible()

    await page.getByTestId('game-edit-roster').click()
    const editor = page.getByRole('dialog', { name: /edit roster/i })
    await expect(editor).toBeVisible()

    await page.waitForTimeout(1200)
    expect(await timerSeconds(readout)).toBeLessThan(beforeEditSeconds)
    await expect(page.getByTestId('timer-pause')).toBeVisible()

    const alexRow = editor.getByTestId('roster-players-list').locator('li').filter({ hasText: 'Alex' })
    await alexRow.getByRole('button', { name: /edit player/i }).click()
    await alexRow.getByLabel(/^name$/i).fill('Avery')
    await alexRow.getByRole('button', { name: /save player/i }).click()

    await editor.getByTestId('player-name-input').fill('Dana')
    await editor.getByTestId('player-shirt-input').fill('4')
    await editor.getByTestId('add-player-submit').click()

    await editor.getByTestId('roster-editor-back').click()

    await expect(page.getByRole('dialog', { name: /edit roster/i })).toBeHidden()
    await expect(page.getByTestId('on-field-list')).toContainText('Avery')
    await expect(page.getByTestId('on-field-list')).not.toContainText('Alex')
    await expect(page.getByTestId('bench-list')).toContainText('Dana')
    await expect(page.getByTestId('timer-pause')).toBeVisible()
  })
})
