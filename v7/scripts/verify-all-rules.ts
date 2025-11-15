#!/usr/bin/env tsx
/**
 * Verification script to ensure all 100 rules are properly loaded and configured
 */

import { registry } from '../src/rules/registry'
import { rulesInventory } from '../src/rules/inventory'

console.log('=== RULE SYSTEM VERIFICATION ===\n')

// 1. Check registry count
console.log(`1. Registry: ${registry.length} rules`)
if (registry.length !== 100) {
  console.error(`   ❌ ERROR: Expected 100 rules, got ${registry.length}`)
  process.exit(1)
}
console.log('   ✓ All 100 rules loaded in registry\n')

// 2. Check inventory count
console.log(`2. Inventory: ${rulesInventory.length} rules`)
if (rulesInventory.length !== 100) {
  console.error(`   ❌ ERROR: Expected 100 rules, got ${rulesInventory.length}`)
  process.exit(1)
}
console.log('   ✓ All 100 rules in inventory\n')

// 3. Verify all rules have required fields
console.log('3. Checking required fields...')
const missingFields = registry.filter(r => !r.id || !r.name || typeof r.enabled !== 'boolean' || !r.run)
if (missingFields.length > 0) {
  console.error(`   ❌ ERROR: ${missingFields.length} rules missing required fields:`)
  missingFields.forEach(r => console.error(`      - ${r.id || 'NO_ID'}: ${r.name || 'NO_NAME'}`))
  process.exit(1)
}
console.log('   ✓ All rules have id, name, enabled, run\n')

// 4. Verify all rules have 'what' field
console.log('4. Checking "what" field...')
const missingWhat = registry.filter(r => !r.what)
if (missingWhat.length > 0) {
  console.error(`   ❌ ERROR: ${missingWhat.length} rules missing "what" field:`)
  missingWhat.forEach(r => console.error(`      - ${r.id}: ${r.name}`))
  process.exit(1)
}
console.log('   ✓ All rules have "what" field\n')

// 5. Count by 'what' type
console.log('5. Rules by type:')
const byType = registry.reduce((acc, r) => {
  const type = r.what || 'unknown'
  acc[type] = (acc[type] || 0) + 1
  return acc
}, {} as Record<string, number>)

Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0])).forEach(([type, count]) => {
  console.log(`   ${type.padEnd(10)}: ${count} rules`)
})
console.log()

// 6. Verify PSI rules (should be 3)
console.log('6. PSI rules (PageSpeed Insights):')
const psiRules = registry.filter(r => r.what === 'psi')
if (psiRules.length !== 3) {
  console.error(`   ❌ ERROR: Expected 3 PSI rules, got ${psiRules.length}`)
  process.exit(1)
}
psiRules.forEach(r => console.log(`   ✓ ${r.id.padEnd(25)} ${r.name}`))
console.log()

// 7. Verify GSC rules (should be 5)
console.log('7. GSC rules (Google Search Console):')
const gscRules = registry.filter(r => r.what === 'gsc')
if (gscRules.length !== 5) {
  console.error(`   ❌ ERROR: Expected 5 GSC rules, got ${gscRules.length}`)
  process.exit(1)
}
gscRules.forEach(r => console.log(`   ✓ ${r.id.padEnd(25)} ${r.name} (enabled: ${r.enabled})`))
console.log()

// 8. Verify all GSC rules are disabled by default
console.log('8. GSC rules default state:')
const enabledGscRules = gscRules.filter(r => r.enabled)
if (enabledGscRules.length > 0) {
  console.error(`   ❌ ERROR: ${enabledGscRules.length} GSC rules enabled by default (should be disabled):`)
  enabledGscRules.forEach(r => console.error(`      - ${r.id}`))
  process.exit(1)
}
console.log('   ✓ All GSC rules disabled by default (auto-enabled when authenticated)\n')

// 9. Check for duplicate IDs
console.log('9. Checking for duplicate rule IDs...')
const ids = registry.map(r => r.id)
const uniqueIds = new Set(ids)
if (ids.length !== uniqueIds.size) {
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  console.error(`   ❌ ERROR: Duplicate rule IDs found:`)
  duplicates.forEach(id => console.error(`      - ${id}`))
  process.exit(1)
}
console.log('   ✓ All rule IDs are unique\n')

// 10. Verify inventory matches registry
console.log('10. Verifying inventory matches registry...')
const registryIds = new Set(registry.map(r => r.id))
const inventoryIds = new Set(rulesInventory.map(r => r.id))

const missingInInventory = [...registryIds].filter(id => !inventoryIds.has(id))
const missingInRegistry = [...inventoryIds].filter(id => !registryIds.has(id))

if (missingInInventory.length > 0) {
  console.error(`   ❌ ERROR: Rules in registry but missing from inventory:`)
  missingInInventory.forEach(id => console.error(`      - ${id}`))
  process.exit(1)
}

if (missingInRegistry.length > 0) {
  console.error(`   ❌ ERROR: Rules in inventory but missing from registry:`)
  missingInRegistry.forEach(id => console.error(`      - ${id}`))
  process.exit(1)
}
console.log('   ✓ Inventory matches registry perfectly\n')

console.log('=== ✅ ALL VERIFICATIONS PASSED ===')
console.log(`\n100 rules properly registered and ready to execute!\n`)
