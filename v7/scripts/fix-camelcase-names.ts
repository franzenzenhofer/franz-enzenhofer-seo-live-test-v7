#!/usr/bin/env tsx
/**
 * Batch fix camelCase Result.name violations
 * Replaces name: 'camelCase' with name: 'Proper Case' from Rule.name
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob} from 'glob'

const files = glob.sync('src/rules/**/*.ts', { ignore: ['**/node_modules/**', '**/*.test.ts'] })

console.log(`Found ${files.length} rule files to process\n`)

let totalFixed = 0

for (const file of files) {
  const content = readFileSync(file, 'utf-8')

  // Extract Rule.name from the file
  const ruleNameMatch = content.match(/name:\s*['"]([^'"]+)['"]\s*,\s*\n\s*enabled:/)
  if (!ruleNameMatch) {
    // Skip utility files without Rule definitions
    continue
  }

  const ruleName = ruleNameMatch[1]

  // Find all Result.name values that are camelCase
  const camelCasePattern = /name:\s*'([a-z][a-zA-Z0-9]*)',/g
  const matches = [...content.matchAll(camelCasePattern)]

  if (matches.length === 0) {
    continue
  }

  // Replace all camelCase Result.name with the Rule.name
  let updatedContent = content
  let fileFixed = 0

  for (const match of matches) {
    const oldName = match[1]
    // Replace with proper Rule.name
    updatedContent = updatedContent.replace(
      `name: '${oldName}',`,
      `name: '${ruleName}',`
    )
    fileFixed++
  }

  if (fileFixed > 0) {
    writeFileSync(file, updatedContent, 'utf-8')
    console.log(`✓ Fixed ${fileFixed} violations in ${file}`)
    totalFixed += fileFixed
  }
}

console.log(`\n✅ Total: Fixed ${totalFixed} camelCase violations`)
