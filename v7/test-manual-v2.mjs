#!/usr/bin/env node
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, 'dist')

console.log('🚀 Starting manual test of extension fixes...\n')

const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
})

const page = await context.newPage()

// Get extension ID
const serviceWorkers = context.serviceWorkers()
const extensionId = serviceWorkers[0]?.url()?.match(/chrome-extension:\/\/([^\/]+)/)?.[1]

console.log('✅ Extension loaded with ID:', extensionId)

// Navigate to first page
console.log('\n📍 TEST 1: Navigating to https://example.com...')
await page.goto('https://example.com')
await page.waitForTimeout(3000) // Wait for tests to run

// Open side panel in same page (Chrome API way)
console.log('🔧 Opening side panel...')
await page.evaluate(async (extId) => {
  await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id })
}, extensionId)
await page.waitForTimeout(2000)

// Get the sidebar iframe or panel
const frames = page.frames()
console.log('📄 Frames found:', frames.length)

// Take screenshot 1
await page.screenshot({ path: 'test-screenshot-1.png', fullPage: true })
console.log('📸 Screenshot 1 saved: test-screenshot-1.png')

// Get current URL from storage
const storage1 = await page.evaluate(async () => {
  const results = await chrome.storage.local.get(null)
  const metaKeys = Object.keys(results).filter(k => k.startsWith('results-meta:'))
  const lastRun = results['ui:lastRun']
  return {
    allKeys: Object.keys(results).slice(0, 10),
    metaKeys,
    lastRun,
    resultKeys: Object.keys(results).filter(k => k.startsWith('results:'))
  }
})

console.log('\n📊 Storage after first page (example.com):')
console.log('   Last run:', storage1.lastRun)
console.log('   Meta keys:', storage1.metaKeys)
console.log('   Result keys:', storage1.resultKeys)

// Navigate to second page
console.log('\n📍 TEST 2: Navigating to https://www.wikipedia.org...')
await page.goto('https://www.wikipedia.org')
await page.waitForTimeout(4000) // Wait for tests to run

// Take screenshot 2
await page.screenshot({ path: 'test-screenshot-2.png', fullPage: true })
console.log('📸 Screenshot 2 saved: test-screenshot-2.png')

// Get updated storage
const storage2 = await page.evaluate(async () => {
  const results = await chrome.storage.local.get(null)
  const lastRun = results['ui:lastRun']
  return { lastRun }
})

console.log('\n📊 Storage after second page (wikipedia.org):')
console.log('   Last run:', storage2.lastRun)

// Compare
console.log('\n' + '='.repeat(60))
if (storage1.lastRun && storage2.lastRun) {
  const urlChanged = storage1.lastRun.url !== storage2.lastRun.url
  const runIdChanged = storage1.lastRun.runId !== storage2.lastRun.runId

  if (urlChanged) {
    console.log('✅ SUCCESS: URL auto-updated!')
    console.log('   Old URL:', storage1.lastRun.url)
    console.log('   New URL:', storage2.lastRun.url)
  } else {
    console.log('❌ FAILED: URL did not change')
  }

  if (runIdChanged) {
    console.log('✅ SUCCESS: New runId generated!')
    console.log('   Old runId:', storage1.lastRun.runId)
    console.log('   New runId:', storage2.lastRun.runId)
  } else {
    console.log('❌ FAILED: runId did not change')
  }

  // Check runId format matches tracking system
  const runIdPattern = /^run-\d+-[a-z0-9]{6}$/
  const runIdValid = runIdPattern.test(storage2.lastRun.runId)
  if (runIdValid) {
    console.log('✅ SUCCESS: runId format matches tracking system:', storage2.lastRun.runId)
  } else {
    console.log('❌ FAILED: runId format incorrect:', storage2.lastRun.runId)
  }
} else {
  console.log('❌ No run data found in storage')
}
console.log('='.repeat(60))

console.log('\n🎉 Test complete! Check screenshots:')
console.log('   - test-screenshot-1.png (example.com)')
console.log('   - test-screenshot-2.png (wikipedia.org)')
console.log('\nKeeping browser open for 20 seconds for manual inspection...')
await page.waitForTimeout(20000)

await context.close()
