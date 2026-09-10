import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { extensionWorker, findExtensionId, readRunSnapshot, withExtension } from '../../../tests/e2e/extensionHarness'

const main = async () => {
  const target = process.env['UX_TARGET'] || 'https://www.example.com/g/286584'
  const out = resolve('out/results-ux', process.env['UX_STAGE'] || 'before')
  mkdirSync(out, { recursive: true })
  const { context, userDataDir, cleanup } = await withExtension()
  try {
    const worker = await extensionWorker(context)
    if (!worker) throw new Error('Extension worker unavailable')
    for (let i = 0; i < 50; i++) {
      if (await worker.evaluate(() => Boolean(chrome.runtime?.id))) break
      await new Promise((done) => setTimeout(done, 100))
    }
    const page = await context.newPage()
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 })
    let snapshot = await readRunSnapshot(context, page.url())
    for (let i = 0; i < 180 && snapshot?.status !== 'completed'; i++) {
      await new Promise((done) => setTimeout(done, 500))
      snapshot = await readRunSnapshot(context, page.url())
    }
    if (!snapshot) throw new Error('No run captured')
    writeFileSync(resolve(out, 'results.json'), JSON.stringify({ url: page.url(), ...snapshot }, null, 2))
    const id = await findExtensionId(context, userDataDir)
    const report = await context.newPage()
    await report.setViewportSize({ width: 420, height: 1000 })
    await report.goto(`chrome-extension://${id}/src/report.html?runid=${snapshot.runId}`)
    await report.getByTestId('result-card').first().waitFor()
    const cards = report.getByTestId('result-card')
    const record = []
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i)
      const expanded = await card.innerText()
      await card.getByRole('button', { name: 'Hide', exact: true }).click()
      const collapsed = await card.innerText()
      await card.getByRole('button', { name: 'Details', exact: true }).click()
      record.push({ index: i + 1, expanded, collapsed })
    }
    writeFileSync(resolve(out, 'cards.json'), JSON.stringify(record, null, 2))
    console.log(JSON.stringify({ url: page.url(), status: snapshot.status, results: snapshot.results.length, cards: record.length, out }))
  } finally { await context.close(); cleanup() }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
