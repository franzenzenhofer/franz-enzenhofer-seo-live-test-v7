// Visual verification: opens the built extension in headless Chrome, loads
// example.com to wake the SW + content script, opens the side-panel page,
// screenshots it to test-results/audit/sidepanel.png. Used as proof-of-life
// for the ErrorBoundary / crashNet / multiplex changes after a Phase B run.

import path from 'node:path'
import fs from 'node:fs'

import { launchExtension, findExtensionId } from './launchExtension'

const main = async (): Promise<void> => {
  const outDir = path.resolve(new URL('../../test-results/audit', import.meta.url).pathname)
  fs.mkdirSync(outDir, { recursive: true })
  const { context, userDataDir, close } = await launchExtension({ headless: false })
  try {
    const warmup = await context.newPage()
    await warmup.goto('https://example.com', { waitUntil: 'load', timeout: 15_000 })
    await warmup.waitForTimeout(2_000)
    const id = await findExtensionId(context, userDataDir)
    const panelUrl = `chrome-extension://${id}/src/sidepanel.html`
    const panel = await context.newPage()
    await panel.setViewportSize({ width: 480, height: 720 })
    let panelLoaded = false
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await panel.goto(panelUrl, { waitUntil: 'load', timeout: 8_000 })
        panelLoaded = true
        break
      } catch { await panel.waitForTimeout(1000) }
    }
    if (!panelLoaded) {
      console.warn(`[visual] panel did not load at ${panelUrl}; screenshotting example.com instead`)
      const out = path.join(outDir, 'visual-fallback.png')
      await warmup.screenshot({ path: out, fullPage: false })
      console.info(`[visual] wrote ${out}`)
      return
    }
    await panel.waitForTimeout(2_500)
    const out = path.join(outDir, 'sidepanel.png')
    await panel.screenshot({ path: out, fullPage: false })
    console.info(`[visual] wrote ${out} (extension ${id})`)
  } finally { await close() }
}

main().catch((err) => { console.error('[visual] fatal:', err); process.exit(1) })
