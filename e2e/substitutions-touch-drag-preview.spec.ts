import { expect, type Locator, type Page, test } from '@playwright/test'
import { selectSavedGameType } from './helpers/navigation'
import { completeStrategySetup } from './helpers/strategySetup'

type Point = { x: number; y: number }

async function createGame(page: Page, uniqueName: string, playersOnField = 2) {
  await page.goto('./')
  await page.getByRole('button', { name: /get started/i }).click()

  await page.getByLabel(/game type name/i).fill(uniqueName)
  await page.getByLabel(/number of periods/i).fill('2')
  await page.getByLabel(/period length/i).fill('0:30')
  await page.getByLabel(/break length/i).fill('0:05')
  await page.getByLabel(/players on field/i).fill(String(playersOnField))

  await page.getByRole('button', { name: /save game type/i }).click()
  await selectSavedGameType(page, uniqueName)

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

async function center(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Expected visible element')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function startImmediateTouchDrag(page: Page, source: Locator, target: Locator) {
  const start = await center(source)
  const end = await center(target)

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
    },
    { start, end },
  )
}

async function finishTouchDrag(page: Page, target: Locator) {
  const end = await center(target)
  await page.evaluate(({ end }) => {
    document.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1145,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 0,
        clientX: end.x,
        clientY: end.y,
      }),
    )
  }, { end })
}

test.describe('substitutions · touch drag drop preview', () => {
  test('highlights the player that will be replaced while dragging over a card', async ({
    page,
  }) => {
    await createGame(page, `Touch Preview Replace ${Date.now()}`)

    const fieldRows = page.getByTestId('on-field-list').locator('[data-testid^="game-player-field-"]')
    const benchRows = page.getByTestId('bench-list').locator('[data-testid^="game-player-bench-"]')

    await startImmediateTouchDrag(
      page,
      benchRows.first(),
      fieldRows.first().getByTestId('player-drop-target'),
    )

    await expect(fieldRows.first()).toHaveClass(/game-player-card-drop-target/)

    await finishTouchDrag(page, fieldRows.first().getByTestId('player-drop-target'))
  })

  test('highlights the bench drop area while dragging into empty bench space', async ({
    page,
  }) => {
    await createGame(page, `Touch Preview Space ${Date.now()}`, 3)

    const fieldRows = page.getByTestId('on-field-list').locator('[data-testid^="game-player-field-"]')
    const benchDropGutter = page.getByTestId('bench-drop-gutter')

    await expect(page.getByTestId('bench-list')).toContainText('Nobody on the bench')

    await startImmediateTouchDrag(page, fieldRows.first(), benchDropGutter)

    await expect(page.getByTestId('bench-column-drop')).toHaveClass(
      /game-roster-column-drop-target/,
    )

    await finishTouchDrag(page, benchDropGutter)
  })
})
