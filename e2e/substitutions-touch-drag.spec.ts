import { expect, type Locator, type Page, test } from '@playwright/test'
import { completeStrategySetup } from './helpers/strategySetup'

async function createGameWithThreePlayers(page: Page, uniqueName: string) {
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
  await expect(page.getByTestId('game-screen')).toBeVisible()
}

async function dragWithImmediateTouch(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Expected drag endpoints to be visible')

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  }
  const end = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  }

  await page.evaluate(
    ({ start, end }) => {
      const pointerId = 1145
      const source = document.elementFromPoint(start.x, start.y)
      if (!source) throw new Error('Expected source element at touch start point')

      const init = {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
      } as const

      source.dispatchEvent(
        new PointerEvent('pointerdown', {
          ...init,
          clientX: start.x,
          clientY: start.y,
        }),
      )

      for (const ratio of [0.35, 0.7, 1]) {
        const x = start.x + (end.x - start.x) * ratio
        const y = start.y + (end.y - start.y) * ratio
        document.dispatchEvent(
          new PointerEvent('pointermove', {
            ...init,
            clientX: x,
            clientY: y,
          }),
        )
      }

      document.dispatchEvent(
        new PointerEvent('pointerup', {
          ...init,
          buttons: 0,
          clientX: end.x,
          clientY: end.y,
        }),
      )
    },
    { start, end },
  )
}

test.describe('substitutions · immediate touch drag', () => {
  test('moves a bench player onto the field without a long press', async ({ page }) => {
    const uniqueName = `Touch Drag ${Date.now()}`
    await createGameWithThreePlayers(page, uniqueName)

    const fieldRows = page.getByTestId('on-field-list').locator('[data-testid^="game-player-field-"]')
    const benchRows = page.getByTestId('bench-list').locator('[data-testid^="game-player-bench-"]')

    await expect(fieldRows).toHaveCount(2)
    await expect(benchRows).toHaveCount(1)

    await dragWithImmediateTouch(
      page,
      benchRows.first(),
      fieldRows.first().getByTestId('player-drop-target'),
    )

    await expect(page.getByTestId('on-field-list')).toContainText('Casey')
    await expect(page.getByTestId('bench-list')).toContainText('Alex')
  })
})
