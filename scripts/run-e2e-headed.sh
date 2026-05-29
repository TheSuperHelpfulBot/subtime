#!/usr/bin/env bash
# Run each Playwright spec in headed mode, one file at a time (workers=1 per file).
# Usage: npm run test:e2e:headed
#        ./scripts/run-e2e-headed.sh

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "Building production bundle for vite preview…"
npm run build

shopt -s nullglob
specs=(e2e/*.spec.ts)
shopt -u nullglob

if ((${#specs[@]} == 0)); then
  echo "No specs found in e2e/" >&2
  exit 1
fi

IFS=$'\n' sorted=($(printf '%s\n' "${specs[@]}" | sort))
unset IFS

total=${#sorted[@]}
index=0

for spec in "${sorted[@]}"; do
  index=$((index + 1))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[$index/$total] $(basename "$spec")"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  npx playwright test "$spec" --headed --workers=1
done

echo ""
echo "All $total spec file(s) finished."
