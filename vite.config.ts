/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub project Pages URL: https://<user>.github.io/subtime/ */
const repo = 'subtime'
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }
const appCommit = process.env.VITE_APP_COMMIT ?? process.env.GITHUB_SHA ?? 'dev'
const appBuildTime = process.env.VITE_APP_BUILD_TIME ?? new Date().toISOString()

export default defineConfig({
  base: `/${repo}/`,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_COMMIT__: JSON.stringify(appCommit),
    __APP_BUILD_TIME__: JSON.stringify(appBuildTime),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Simple Subs',
        short_name: 'Simple Subs',
        description: 'Substitution scheduling made simple.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${repo}/`,
        scope: `/${repo}/`,
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: `/${repo}/index.html`,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
