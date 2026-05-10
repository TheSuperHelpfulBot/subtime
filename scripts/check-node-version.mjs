/**
 * Enforces package.json "engines.node" before install scripts run.
 * Pair with .npmrc engine-strict=true for npm's own guardrail.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const range = pkg.engines?.node ?? '>=20.0.0'

const m = String(range).match(/>=?\s*(\d+)/)
const minMajor = m ? Number(m[1]) : 20

const major = Number(process.versions.node.split('.')[0])

if (major < minMajor || Number.isNaN(major)) {
  console.error('')
  console.error(`This project requires Node.js ${minMajor} or newer (see package.json "engines").`)
  console.error(`Current: ${process.version}`)
  console.error('')
  console.error('Switch version, then retry:')
  console.error('  nvm install && nvm use     # uses .nvmrc')
  console.error('  fnm use                    # uses .node-version (optional)')
  console.error('')
  process.exit(1)
}
