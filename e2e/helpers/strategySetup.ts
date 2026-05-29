import { expect, type Page } from '@playwright/test'

/** After roster pick or roster editor continue, complete the strategy screen with defaults. */
export async function completeStrategySetup(page: Page) {
  await expect(page.getByTestId('sub-strategy-setup')).toBeVisible()
  await page.getByTestId('strategy-start-game').click()
}
