#!/usr/bin/env tsx
/**
 * Post-build verification script
 * Ensures critical OAuth configuration is correct in built manifest
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { OAUTH_CLIENT_ID, DEV_EXTENSION_KEY } from '../config.js'

const EXPECTED_EXTENSION_ID = 'jbnaibigcohjfefpfocphcjeliohhold'
const EXPECTED_CLIENT_ID = '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'
const EXPECTED_KEY_PREFIX = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsWxGAo'

interface Manifest {
  oauth2?: {
    client_id?: string
    scopes?: string[]
  }
  key?: string
}

const errors: string[] = []
const warnings: string[] = []

console.log('🔍 Verifying build configuration...\n')

// 1. Check manifest.json exists
const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
let manifest: Manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  console.log('✅ dist/manifest.json exists')
} catch (error) {
  errors.push('❌ CRITICAL: dist/manifest.json not found or invalid')
  console.error('❌ CRITICAL: dist/manifest.json not found or invalid')
  process.exit(1)
}

// 2. Check OAuth client ID
if (!manifest.oauth2?.client_id) {
  errors.push('❌ CRITICAL: oauth2.client_id missing from manifest')
} else if (manifest.oauth2.client_id !== EXPECTED_CLIENT_ID) {
  errors.push(
    `❌ CRITICAL: Wrong OAuth client ID\n` +
      `   Expected: ${EXPECTED_CLIENT_ID}\n` +
      `   Got:      ${manifest.oauth2.client_id}`
  )
} else {
  console.log('✅ OAuth client ID correct:', manifest.oauth2.client_id)
}

// 3. Check OAuth scopes
const expectedScopes = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
]
if (!manifest.oauth2?.scopes || manifest.oauth2.scopes.length === 0) {
  errors.push('❌ CRITICAL: oauth2.scopes missing from manifest')
} else {
  const missingScopes = expectedScopes.filter((s) => !manifest.oauth2!.scopes!.includes(s))
  if (missingScopes.length > 0) {
    warnings.push(`⚠️  Missing OAuth scopes: ${missingScopes.join(', ')}`)
  } else {
    console.log('✅ OAuth scopes correct:', manifest.oauth2.scopes.length, 'scopes')
  }
}

// 4. Check key field (CRITICAL!)
if (!manifest.key) {
  errors.push(
    '❌ CRITICAL: "key" field missing from manifest!\n' +
      '   This will cause Chrome to generate a RANDOM extension ID!\n' +
      `   Expected extension ID: ${EXPECTED_EXTENSION_ID}\n` +
      '   Without key, OAuth will NOT work!'
  )
} else if (!manifest.key.startsWith(EXPECTED_KEY_PREFIX)) {
  errors.push(
    `❌ CRITICAL: Wrong public key in manifest\n` +
      `   Expected to start with: ${EXPECTED_KEY_PREFIX}...\n` +
      `   Got:                    ${manifest.key.substring(0, 50)}...`
  )
} else {
  console.log('✅ Public key present and correct')
  console.log(`   Will generate extension ID: ${EXPECTED_EXTENSION_ID}`)
}

// 5. Verify config.js values match
if (OAUTH_CLIENT_ID !== EXPECTED_CLIENT_ID) {
  errors.push(
    `❌ CRITICAL: config.js has wrong OAUTH_CLIENT_ID\n` +
      `   Expected: ${EXPECTED_CLIENT_ID}\n` +
      `   Got:      ${OAUTH_CLIENT_ID}`
  )
} else {
  console.log('✅ config.js OAUTH_CLIENT_ID matches expected value')
}

if (!DEV_EXTENSION_KEY.startsWith(EXPECTED_KEY_PREFIX)) {
  errors.push(
    `❌ CRITICAL: config.js has wrong DEV_EXTENSION_KEY\n` +
      `   Expected to start with: ${EXPECTED_KEY_PREFIX}...\n` +
      `   Got:                    ${DEV_EXTENSION_KEY.substring(0, 50)}...`
  )
} else {
  console.log('✅ config.js DEV_EXTENSION_KEY matches expected value')
}

// Print summary
console.log('\n' + '='.repeat(70))
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL CHECKS PASSED - Build configuration is correct!')
  console.log('='.repeat(70))
  console.log('\n📋 Expected values:')
  console.log(`   Extension ID: ${EXPECTED_EXTENSION_ID}`)
  console.log(`   OAuth Client: ${EXPECTED_CLIENT_ID}`)
  console.log('\n🚀 Extension is ready to load in Chrome!')
  process.exit(0)
} else {
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach((w) => console.log(w))
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:')
    errors.forEach((e) => console.log(e))
    console.log('\n' + '='.repeat(70))
    console.log('🚨 BUILD VERIFICATION FAILED!')
    console.log('='.repeat(70))
    console.log('\nDO NOT LOAD THIS EXTENSION - OAuth will not work!')
    process.exit(1)
  }

  if (warnings.length > 0 && errors.length === 0) {
    console.log('='.repeat(70))
    console.log('⚠️  BUILD HAS WARNINGS - Please review')
    console.log('='.repeat(70))
    process.exit(0)
  }
}
