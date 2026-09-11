import { expect, test } from '@playwright/test'

import { extensionWorker, findExtensionId, readRunSnapshot, withExtension } from './extensionHarness'
import { httpResultsFixture } from './httpResultsFixture'

test('HTTP findings render readable offenders and a named navigation journey with working copy actions', async () => {
  const server = await httpResultsFixture()
  const START = `${server.origin}/old`
  const FINAL = `${server.origin}/trips`
  const { context, userDataDir, cleanup } = await withExtension({ ignoreHTTPSErrors: true })
  try {
    const worker = await extensionWorker(context)
    expect(worker).toBeTruthy()
    await expect.poll(() => worker!.evaluate(() => Boolean(chrome.runtime?.id))).toBe(true)
    const page = await context.newPage()
    await page.goto(START)
    await expect.poll(async () => (await readRunSnapshot(context, FINAL))?.status, { timeout: 60_000 }).toBe('completed')
    const snapshot = await readRunSnapshot(context, FINAL)
    expect(snapshot?.results.find((result) => result.ruleId === 'http:mixed-content')?.type).toBe('error')
    const id = await findExtensionId(context, userDataDir)
    const report = await context.newPage()
    await report.setViewportSize({ width: 420, height: 1000 })
    await report.goto(`chrome-extension://${id}/src/report.html?runid=${snapshot!.runId}`)
    const mixed = report.getByTestId('result-card').filter({ has: report.getByRole('heading', { name: 'Mixed content', exact: true }) })
    // The full report renders every card expanded: the icon toggle is already named "Hide details".
    await expect(mixed.getByRole('button', { name: 'Hide details', exact: true })).toHaveAttribute('aria-expanded', 'true')
    const evidence = mixed.getByRole('region', { name: 'Evidence' })
    await expect(evidence.getByRole('heading', { name: /^Mixed-content resource \d+$/ })).toHaveCount(2)
    await expect(evidence).toContainText('Alpe-Adria 8 Tage')
    await expect(evidence.locator('a[href="http://images.http-results.test/alpe-adria.jpg?v=1"]')).toHaveCount(1)
    await mixed.getByRole('button', { name: 'Copy result', exact: true }).click()
    await expect(mixed).toContainText('Result copied')
    await context.grantPermissions(['clipboard-read'])
    expect(await report.evaluate(() => navigator.clipboard.readText())).toContain('HTTP URL: http://images.http-results.test/alpe-adria.jpg?v=1')
    const navigation = report.getByTestId('result-card').filter({ hasText: 'Navigation Path Analysis' })
    await expect(navigation).toContainText('HTTP 308 Permanent Redirect')
    await expect(navigation).toContainText('HTTP 200 OK')
    await expect(navigation).toContainText('Browser history updated')
    await navigation.getByRole('button', { name: 'Copy result', exact: true }).click()
    expect(await report.evaluate(() => navigator.clipboard.readText())).toContain('Status: HTTP 308 Permanent Redirect')
    await mixed.screenshot({ path: 'test-results/mixed-content-card.png' })
    await navigation.screenshot({ path: 'test-results/navigation-journey-card.png' })
    expect(await report.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    // No value is squeezed beside a long label: each is at least 10rem wide or spans its whole row
    // (a 160-character excerpt once wrapped one word per line in a 65px column).
    const squeezed = await report.evaluate(() => [...document.querySelectorAll('[data-field-row] > dd')].filter((dd) => {
      const width = dd.getBoundingClientRect().width
      return width > 0 && width < Math.min(160, (dd.parentElement as HTMLElement).clientWidth) - 1
    }).map((dd) => `${dd.previousElementSibling?.textContent} ${Math.round(dd.getBoundingClientRect().width)}px`))
    expect(squeezed).toEqual([])
    const panel = await context.newPage()
    await panel.goto(`chrome-extension://${id}/src/sidepanel.html`)
    await page.bringToFront()
    await expect(panel.getByTestId('result-card').filter({ has: panel.getByRole('heading', { name: 'Mixed content', exact: true }) })).toBeVisible()
  } finally {
    await context.close()
    cleanup()
    await server.close()
  }
})
