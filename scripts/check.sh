#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
while IFS= read -r -d '' file; do node --check "$file"; done < <(find src tests -name '*.mjs' -print0)
node --test tests/*.test.mjs
