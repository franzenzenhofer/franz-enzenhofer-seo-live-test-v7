import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { expect, test } from '@playwright/test'

import { readRunSnapshot, withExtension } from './extensionHarness'
import type { RunSnapshot } from './extensionHarness'

const terminalTypes = new Set(['info', 'ok', 'warn', 'error', 'runtime_error', 'disabled'])

const generatedPage = () => {
  const nodes: string[] = []
  for (let index = 0; index < 100_000; index++) {
    nodes.push(index < 20_000 ? `<a href="/item?id=${index}"></a>` : '<div></div>')
  }
  const ld = JSON.stringify({ '@context': 'https://schema.org', value: 'x'.repeat(1_000_000) })
  return `<!doctype html><html><head><title>Stress fixture</title><script type="application/ld+json">${ld}</script></head><body><h1>Stress</h1>${nodes.join('')}</body></html>`
}

test('generated 100,000-node audit remains bounded and terminal', async () => {
  test.setTimeout(180_000)
  const html = generatedPage()
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(request.method === 'HEAD' ? undefined : html)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo
  const url = `http://127.0.0.1:${address.port}/stress`
  const { context, cleanup } = await withExtension()
  const unhandled: string[] = []
  const watch = (page: import('@playwright/test').Page) => page.on('pageerror', (error) => unhandled.push(error.message))
  context.pages().forEach(watch)
  context.on('page', watch)

  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load', timeout: 90_000 })
    expect(await page.evaluate(() => document.querySelectorAll('body *').length)).toBeGreaterThan(100_000)

    let snapshot: RunSnapshot | null = null
    await expect.poll(async () => {
      snapshot = await readRunSnapshot(context, url)
      return snapshot?.status
    }, { timeout: 120_000, intervals: [500, 1_000, 2_000] }).toBe('completed')

    expect(snapshot).not.toBeNull()
    expect(snapshot!.results.length).toBeGreaterThan(100)
    expect(snapshot!.results.every((result) => terminalTypes.has(result.type))).toBe(true)
    expect(snapshot!.results.some((result) => result.ruleId === 'schema:article:present' && result.type === 'runtime_error')).toBe(true)
    const serialized = JSON.stringify(snapshot!.results)
    expect(new TextEncoder().encode(serialized).length).toBeLessThan(2 * 1024 * 1024)
    const detailSizes = snapshot!.results.map((result) => new TextEncoder().encode(JSON.stringify((result as { details?: unknown }).details)).length)
    expect(Math.max(...detailSizes)).toBeLessThanOrEqual(8_192)
    expect(serialized).not.toContain('item?id=19999')
    expect(unhandled).toEqual([])
  } finally {
    await context.close()
    cleanup()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
