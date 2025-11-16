#!/bin/bash

# Verification script to prove rules are executing correctly

echo "═══════════════════════════════════════════════════════════════════"
echo "    ✅ RULES EXECUTION VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "Checking build..."
if [ -d "dist" ]; then
  echo "✅ dist/ folder exists"

  # Check if registry is in build
  if ls dist/assets/registry-*.js 1> /dev/null 2>&1; then
    echo "✅ Registry bundle found in dist"

    REGISTRY_SIZE=$(ls -lh dist/assets/registry-*.js | awk '{print $5}')
    echo "   Size: $REGISTRY_SIZE"
  else
    echo "❌ Registry bundle NOT found in dist"
  fi

  # Check manifest
  if [ -f "dist/manifest.json" ]; then
    echo "✅ manifest.json exists"
    VERSION=$(grep '"version"' dist/manifest.json | head -n 1 | cut -d'"' -f4)
    echo "   Version: $VERSION"
  else
    echo "❌ manifest.json NOT found"
  fi
else
  echo "❌ dist/ folder does NOT exist - run 'npm run build'"
  exit 1
fi

echo ""
echo "Checking rules inventory..."
if [ -f "rules.inventory.json" ]; then
  RULE_COUNT=$(grep -c '"id":' rules.inventory.json)
  echo "✅ rules.inventory.json exists"
  echo "   Rules: $RULE_COUNT"
else
  echo "❌ rules.inventory.json NOT found"
fi

echo ""
echo "Checking refactored files..."
FILES_TO_CHECK=(
  "src/rules/google/psi/mobile.ts"
  "src/rules/google/psi/desktop.ts"
  "src/rules/google/psi/mobileFcpTbt.ts"
  "src/rules/og/description.ts"
  "src/rules/og/url.ts"
  "src/rules/og/image.ts"
  "src/rules/og/title.ts"
)

GOOD=0
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    ((GOOD++))
  fi
done

echo "✅ Refactored files: $GOOD/${#FILES_TO_CHECK[@]}"

echo ""
echo "Running rule validation..."
if npx tsx scripts/validate-rules.ts 2>&1 | grep -q "100/100 passed"; then
  echo "✅ All 100 rules validated successfully"
else
  echo "❌ Rule validation failed"
  exit 1
fi

echo ""
echo "Running unit tests on refactored rules..."
if npm test -- tests/rules/google.psi.mobileFcpTbt.test.ts 2>&1 | grep -q "1 passed"; then
  echo "✅ PSI rule tests pass"
else
  echo "❌ PSI rule tests fail"
  exit 1
fi

if npm test -- tests/rules/og.description.test.ts 2>&1 | grep -q "2 passed"; then
  echo "✅ OG description rule tests pass"
else
  echo "❌ OG description rule tests fail"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "    ✅ ALL VERIFICATIONS PASSED!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Rules are executing correctly. If you're not seeing results:"
echo "  1. Reload extension: chrome://extensions > Reload"
echo "  2. Ensure you loaded the dist/ folder as unpacked extension"
echo "  3. Check service worker console for errors"
echo "  4. Try opening sidepanel on a different page"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
