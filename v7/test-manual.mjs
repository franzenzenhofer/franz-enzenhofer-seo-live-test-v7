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
console.log('\n📍 Navigating to https://example.com...')
await page.goto('https://example.com')
await page.waitForTimeout(2000)

// Open side panel programmatically
console.log('🔧 Opening side panel...')
const sidePanelPage = await context.newPage()
await sidePanelPage.goto(`chrome-extension://${extensionId}/src/sidepanel.html`)
await sidePanelPage.waitForTimeout(1000)

// Get runId and URL from sidebar
const runInfo1 = await sidePanelPage.evaluate(() => {
  const urlElement = document.querySelector('[data-testid="url"], .text-sm.text-gray-600')
  const runIdElement = document.querySelector('[data-testid="run-id"]')
  return {
    url: urlElement?.textContent || document.body.textContent.match(/https?:\/\/[^\s]+/)?.[0],
    runId: runIdElement?.textContent || document.body.textContent.match(/#run-[\d]+-[a-z0-9]+/)?.[0],
    bodyText: document.body.textContent.slice(0, 500)
  }
})

console.log('📊 First page state:')
console.log('   URL:', runInfo1.url)
console.log('   RunID:', runInfo1.runId)
console.log('   Body preview:', runInfo1.bodyText.slice(0, 100) + '...')

// Navigate to second page in main tab
console.log('\n📍 Navigating to https://www.wikipedia.org...')
await page.goto('https://www.wikipedia.org')
await page.waitForTimeout(3000)

// Check if sidebar auto-updated
const runInfo2 = await sidePanelPage.evaluate(() => {
  const urlElement = document.querySelector('[data-testid="url"], .text-sm.text-gray-600')
  const runIdElement = document.querySelector('[data-testid="run-id"]')
  return {
    url: urlElement?.textContent || document.body.textContent.match(/https?:\/\/[^\s]+/)?.[0],
    runId: runIdElement?.textContent || document.body.textContent.match(/#run-[\d]+-[a-z0-9]+/)?.[0],
    bodyText: document.body.textContent.slice(0, 500)
  }
})

console.log('📊 Second page state:')
console.log('   URL:', runInfo2.url)
console.log('   RunID:', runInfo2.runId)
console.log('   Body preview:', runInfo2.bodyText.slice(0, 100) + '...')

// Verify URL changed
const urlChanged = runInfo1.url !== runInfo2.url
console.log('\n' + '='.repeat(60))
if (urlChanged) {
  console.log('✅ SUCCESS: URL auto-updated from')
  console.log('   ', runInfo1.url)
  console.log('   to')
  console.log('   ', runInfo2.url)
} else {
  console.log('❌ FAILED: URL did not change!')
  console.log('   Still showing:', runInfo1.url)
}

// Verify runId changed (new run should have new ID)
const runIdChanged = runInfo1.runId !== runInfo2.runId
if (runIdChanged) {
  console.log('✅ SUCCESS: New runId generated for new page')
  console.log('   Old:', runInfo1.runId)
  console.log('   New:', runInfo2.runId)
} else {
  console.log('⚠️  WARNING: RunId did not change (might be using cached results)')
}
console.log('='.repeat(60))

console.log('\n🎉 Test complete! Keeping browser open for 30 seconds for manual inspection...')
await page.waitForTimeout(30000)

await context.close()
