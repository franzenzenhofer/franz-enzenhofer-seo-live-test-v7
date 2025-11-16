#!/usr/bin/env tsx
/**
 * Rule Validation Script
 * Validates that all rules follow the correct format and structure
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rulesDir = path.join(__dirname, '../src/rules')

interface ValidationResult {
  file: string
  passed: boolean
  errors: string[]
}

const results: ValidationResult[] = []

function validateFile(filePath: string): ValidationResult | null {
  const relativePath = path.relative(rulesDir, filePath)
  const fileName = path.basename(filePath)

  // Skip utility files, constants, and non-rule files
  const skipPatterns = ['-utils.ts', '-constants.ts', '-labels.ts', 'inventory.ts', 'autoEnable.ts', 'registry.ts']
  if (skipPatterns.some((pattern) => fileName.endsWith(pattern))) {
    return null
  }

  const errors: string[] = []

  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Check 1: Must have export statement with Rule
    if (!content.includes('export') || !content.includes('Rule')) {
      errors.push('Missing export or Rule type')
    }

    // Check 2: Must import Rule type from core/types
    if (!content.includes("from '@/core/types'")) {
      errors.push('Missing Rule import from @/core/types')
    }

    // Check 3: Must have run function (either async run( or run: async)
    const hasAsyncRun = content.includes('async run(') || content.includes('run: async') || content.includes('run:async')
    if (!hasAsyncRun) {
      errors.push('Missing async run function')
    }

    // Check 4: Must have required properties: id, name, enabled, what
    const requiredProps = ['id:', 'name:', 'enabled:', 'what:']
    for (const prop of requiredProps) {
      if (!content.includes(prop)) {
        errors.push(`Missing required property: ${prop}`)
      }
    }

    // Check 5: Return statement should include label, message, type
    if (content.includes('return {') || content.includes('return{')) {
      const hasLabel = content.includes('label:')
      const hasMessage = content.includes('message:')
      const hasType = content.includes('type:')

      if (!hasLabel) errors.push('Result missing label property')
      if (!hasMessage) errors.push('Result missing message property')
      if (!hasType) errors.push('Result missing type property')
    }

    return {
      file: relativePath,
      passed: errors.length === 0,
      errors,
    }
  } catch (error) {
    return {
      file: relativePath,
      passed: false,
      errors: [`Failed to read file: ${String(error)}`],
    }
  }
}

function findRuleFiles(dir: string): string[] {
  const files: string[] = []

  function traverse(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.test.')) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

function main(): void {
  console.log('🔍 Validating rule files...\n')

  const ruleFiles = findRuleFiles(rulesDir)
  console.log(`Found ${ruleFiles.length} files total\n`)

  for (const file of ruleFiles) {
    const result = validateFile(file)
    if (!result) continue // Skip utility files

    results.push(result)

    if (!result.passed) {
      console.log(`❌ ${result.file}`)
      for (const error of result.errors) {
        console.log(`   - ${error}`)
      }
    } else {
      console.log(`✅ ${result.file}`)
    }
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => r.passed === false).length

  console.log(`\n📊 Results: ${passedCount}/${results.length} passed, ${failedCount} failed`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

main()
