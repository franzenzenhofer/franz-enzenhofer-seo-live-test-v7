// Visual verification: opens the built extension in a HEADED Chrome (so
// chrome-extension:// URLs work), navigates to a real news site so the
// content script can capture DOM + the rules engine runs end-to-end, then
// screenshots the side panel that lists the results.
//
// Run with EXT_AUDIT_VISUAL_URL=<url> to override target.

import path from 'node:path'
import fs from 'node:fs'

import { launchExtension, findExtensionId } from './launchExtension'

const TARGET_URL = process.env['EXT_AUDIT_VISUAL_URL'] || 'https://orf.at/stories/3430670/'

const main = async (): Promise<void> => {
  const outDir = path.resolve(new URL('../../test-results/audit', import.meta.url).pathname)
  fs.mkdirSync(outDir, { recursive: true })
  const { context, userDataDir, close } = await launchExtension({ headless: false })
  try {
    const warmup = await context.newPage()
    await warmup.goto(TARGET_URL, { waitUntil: 'load', timeout: 25_000 })
    await warmup.waitForTimeout(5_000) // let the content script + rules engine settle
    const id = await findExtensionId(context, userDataDir)
    const panelUrl = `chrome-extension://${id}/src/sidepanel.html`
    const panel = await context.newPage()
    await panel.setViewportSize({ width: 480, height: 900 })
    let panelLoaded = false
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await panel.goto(panelUrl, { waitUntil: 'load', timeout: 8_000 })
        panelLoaded = true
        break
      } catch { await panel.waitForTimeout(1000) }
    }
    if (!panelLoaded) {
      const out = path.join(outDir, 'visual-fallback.png')
      await warmup.screenshot({ path: out, fullPage: false })
      console.warn(`[visual] panel did not load at ${panelUrl}; saved fallback to ${out}`)
      return
    }
    await panel.waitForTimeout(4_000)
    const safeHost = new URL(TARGET_URL).host.replace(/[^a-z0-9]/gi, '_')
    const out = path.join(outDir, `sidepanel-${safeHost}.png`)
    await panel.screenshot({ path: out, fullPage: false })
    console.info(`[visual] wrote ${out} for ${TARGET_URL} (extension ${id})`)
  } finally { await close() }
}

main().catch((err) => { console.error('[visual] fatal:', err); process.exit(1) })
