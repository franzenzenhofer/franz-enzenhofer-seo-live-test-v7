#!/usr/bin/env node
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.join(__dirname, 'dist')

console.log('🚀 Testing extension fixes: runId alignment & URL auto-update\n')

const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
})

// Get service worker to check extension loaded
const serviceWorker = context.serviceWorkers()[0]
const extensionId = serviceWorker?.url()?.match(/chrome-extension:\/\/([^\/]+)/)?.[1] || 'unknown'

console.log('✅ Extension loaded with ID:', extensionId)

// Open the side panel page directly
const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel.html`
const sidePanel = await context.newPage()
await sidePanel.goto(sidePanelUrl)
console.log('📱 Side panel opened:', sidePanelUrl)

// Open a main page
const page = await context.newPage()

// ========== TEST 1: First Page ==========
console.log('\n' + '='.repeat(60))
console.log('TEST 1: Loading https://example.com')
console.log('='.repeat(60))

await page.goto('https://example.com', { waitUntil: 'networkidle' })
await page.waitForTimeout(5000) // Wait for rules to execute

// Get storage after first page
const storage1 = await page.evaluate(async () => {
  const all = await chrome.storage.local.get(null)
  return {
    lastRun: all['ui:lastRun'],
    resultKeys: Object.keys(all).filter(k => k.startsWith('results:')),
    metaKeys: Object.keys(all).filter(k => k.startsWith('results-meta:'))
  }
})

// Get sidebar display
await sidePanel.bringToFront()
await sidePanel.waitForTimeout(1000)
const sidebarData1 = await sidePanel.evaluate(() => {
  // Find URL and runId in the page
  const bodyText = document.body.innerText
  const urlMatch = bodyText.match(/https?:\/\/[^\s]+/)
  const runIdMatch = bodyText.match(/#(run-\d+-[a-z0-9]+)/)

  return {
    bodyText: bodyText.slice(0, 300),
    url: urlMatch?.[0],
    runId: runIdMatch?.[1],
    hasResults: bodyText.includes('HEAD') || bodyText.includes('BODY') || bodyText.includes('HTTP')
  }
})

await sidePanel.screenshot({ path: 'screenshot-1-example.png' })

console.log('\n📊 After example.com:')
console.log('  Storage lastRun:', storage1.lastRun)
console.log('  Sidebar URL:', sidebarData1.url)
console.log('  Sidebar runId:', sidebarData1.runId)
console.log('  Has results:', sidebarData1.hasResults)
console.log('  Screenshot saved: screenshot-1-example.png')

// ========== TEST 2: Second Page ==========
console.log('\n' + '='.repeat(60))
console.log('TEST 2: Loading https://www.wikipedia.org')
console.log('='.repeat(60))

await page.bringToFront()
await page.goto('https://www.wikipedia.org', { waitUntil: 'networkidle' })
await page.waitForTimeout(5000) // Wait for rules to execute

// Get storage after second page
const storage2 = await page.evaluate(async () => {
  const all = await chrome.storage.local.get(null)
  return {
    lastRun: all['ui:lastRun']
  }
})

// Get updated sidebar display
await sidePanel.bringToFront()
await sidePanel.waitForTimeout(2000)
const sidebarData2 = await sidePanel.evaluate(() => {
  const bodyText = document.body.innerText
  const urlMatch = bodyText.match(/https?:\/\/[^\s]+/)
  const runIdMatch = bodyText.match(/#(run-\d+-[a-z0-9]+)/)

  return {
    bodyText: bodyText.slice(0, 300),
    url: urlMatch?.[0],
    runId: runIdMatch?.[1],
    hasResults: bodyText.includes('HEAD') || bodyText.includes('BODY') || bodyText.includes('HTTP')
  }
})

await sidePanel.screenshot({ path: 'screenshot-2-wikipedia.png' })

console.log('\n📊 After wikipedia.org:')
console.log('  Storage lastRun:', storage2.lastRun)
console.log('  Sidebar URL:', sidebarData2.url)
console.log('  Sidebar runId:', sidebarData2.runId)
console.log('  Has results:', sidebarData2.hasResults)
console.log('  Screenshot saved: screenshot-2-wikipedia.png')

// ========== VERIFICATION ==========
console.log('\n' + '='.repeat(60))
console.log('VERIFICATION RESULTS')
console.log('='.repeat(60))

if (storage1.lastRun && storage2.lastRun) {
  const urlChanged = storage1.lastRun.url !== storage2.lastRun.url
  const runIdChanged = storage1.lastRun.runId !== storage2.lastRun.runId
  const runIdFormat = /^run-\d+-[a-z0-9]{6}$/

  console.log('\n✓ Fix #1: runId Format (DRY & Aligned)')
  console.log('  Storage runId 1:', storage1.lastRun.runId)
  console.log('  Storage runId 2:', storage2.lastRun.runId)
  console.log('  Format valid:', runIdFormat.test(storage2.lastRun.runId) ? '✅ YES' : '❌ NO')

  console.log('\n✓ Fix #2: URL Auto-Update')
  console.log('  Old URL:', storage1.lastRun.url)
  console.log('  New URL:', storage2.lastRun.url)
  console.log('  URL changed:', urlChanged ? '✅ YES' : '❌ NO')

  console.log('\n✓ Fix #3: New runId per Navigation')
  console.log('  runId changed:', runIdChanged ? '✅ YES' : '❌ NO')

  console.log('\n' + '='.repeat(60))
  if (urlChanged && runIdChanged && runIdFormat.test(storage2.lastRun.runId)) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('   ✅ runId format matches tracking system')
    console.log('   ✅ URL auto-updates on navigation')
    console.log('   ✅ New runId generated for each page')
  } else {
    console.log('⚠️  SOME TESTS FAILED - see details above')
  }
  console.log('='.repeat(60))
} else {
  console.log('❌ ERROR: No run data in storage')
  console.log('  Storage 1:', storage1)
  console.log('  Storage 2:', storage2)
}

console.log('\n📷 Screenshots saved:')
console.log('  - screenshot-1-example.png')
console.log('  - screenshot-2-wikipedia.png')
console.log('\n⏳ Keeping browser open for 10 seconds...')

await page.waitForTimeout(10000)
await context.close()
console.log('\n✅ Test complete!')
