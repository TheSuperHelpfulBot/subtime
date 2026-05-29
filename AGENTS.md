---

## description: 
alwaysApply: true

---

## description: 
alwaysApply: true

## Tests are Sacred

### Do not change existing test files without approval

**Protected paths:** any existing file matching:

- `src/**/*.{test,spec}.{ts,tsx}`
- `e2e/**/*.spec.ts`

**Before editing a protected file**, stop explain the need, the proposed change and wait for explicit approval in chat. In that message, include:

1. **Why a change is needed**
2. **Which file(s)** you want to change
3. **What assertions or behaviors** change (short bullet list)
4. **Why** product behavior or expectations changed (link to the milestone or requirement)

**Keep tests clean,** for unrelated suites, preference adding new tests in **new files** (e.g. `src/timer/feature.test.ts`, `e2e/feature.spec.ts`).

Improving coverage within an existing suite is OK, adding is acceptable, editing (or changing the original intent by adding) is not allowed prior to discussion and agreement.  

---

## Test-driven workflow for **new** functionality

“Tests first” means **the first code touching the repo for that feature is test code**, not implementation.

Required sequence:

1. **Tests only (new files):** add failing unit/integration/E2E tests that describe the desired behavior. Do not implement the actual functionality in the same step unless the maintainer asked to combine steps.
2. **Review gate:** show the test changes and summarize what they assert; wait for maintainer approval before moving onto functionality.
3. **Implementation:** once tests are approved, add or change functionality code until `npm test` and (when UI behavior is involved) `npm run test:e2e` pass.

## Commands


| Command            | Purpose                           |
| ------------------ | --------------------------------- |
| `npm test`         | Vitest (`src/**/*.{test,spec}.`*) |
| `npm run test:e2e` | Playwright (`e2e/*.spec.ts`)      |


---

