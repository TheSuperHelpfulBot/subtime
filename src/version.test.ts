import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { APP_VERSION_INFO, formatAppVersionLabel } from './version'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string
}

describe('app version metadata', () => {
  test('uses package.json as the release version source of truth', () => {
    expect(APP_VERSION_INFO.version).toBe(packageJson.version)
  })

  test('formats a traceable display label with version and commit', () => {
    expect(
      formatAppVersionLabel({
        version: '1.2.3',
        commit: 'abcdef1234567890',
        buildTime: '2026-05-26T07:20:00.000Z',
      }),
    ).toBe('1.2.3 (abcdef1)')
  })
})
