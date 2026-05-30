import type { Page } from '@playwright/test'

export function savedGameTypeRow(page: Page, name: string) {
  return page.getByTestId('saved-game-types').locator('li').filter({ hasText: name })
}

export function savedRosterRow(page: Page, name: string) {
  return page.getByTestId('rosters-list').locator('li').filter({ hasText: name })
}

export async function selectSavedGameType(page: Page, name: string) {
  await savedGameTypeRow(page, name).getByRole('button', { name: /^select$/i }).click()
}

export async function selectSavedRoster(page: Page, name: string) {
  await savedRosterRow(page, name).getByRole('button', { name: /^select$/i }).click()
}

export async function editSavedGameType(page: Page, name: string) {
  await savedGameTypeRow(page, name).getByRole('button', { name: /^edit$/i }).click()
}
