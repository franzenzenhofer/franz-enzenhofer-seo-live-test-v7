#!/bin/bash

# HARDCORE VALIDATION SCRIPT
# Runs all quality gates and tests with zero tolerance for failures

set -e  # Exit on any error

echo "═══════════════════════════════════════════════════════════════════"
echo "    🔥 HARDCORE VALIDATION - ZERO TOLERANCE MODE 🔥"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

run_check() {
  local name="$1"
  local cmd="$2"

  echo -e "${YELLOW}▶ Running: $name${NC}"

  if eval "$cmd"; then
    echo -e "${GREEN}✓ PASSED: $name${NC}\n"
    ((pass_count++))
  else
    echo -e "${RED}✗ FAILED: $name${NC}\n"
    ((fail_count++))
    exit 1  # Exit immediately on failure
  fi
}

echo "Phase 1: Code Quality Gates"
echo "────────────────────────────────────────────────────────────────────"
run_check "TypeScript Type Check" "npm run typecheck"
run_check "ESLint Validation" "npm run lint"
run_check "Rule Format Validation" "npx tsx scripts/validate-rules.ts"

echo ""
echo "Phase 2: Build Verification"
echo "────────────────────────────────────────────────────────────────────"
run_check "Production Build" "npm run build"

echo ""
echo "Phase 3: Unit Tests"
echo "────────────────────────────────────────────────────────────────────"
run_check "All Unit Tests" "npm test"

echo ""
echo "Phase 4: End-to-End Tests"
echo "────────────────────────────────────────────────────────────────────"
run_check "E2E Extension Test" "npx playwright test tests/e2e/extension.spec.ts"
run_check "E2E Log Validation Test" "npx playwright test tests/e2e/log-validation.spec.ts"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "    ✅ HARDCORE VALIDATION COMPLETE - ALL CHECKS PASSED!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  Checks Passed: $pass_count"
echo "  Checks Failed: $fail_count"
echo "  Total Checks:  $((pass_count + fail_count))"
echo ""
echo "🎉 Extension is production-ready!"
echo "═══════════════════════════════════════════════════════════════════"
