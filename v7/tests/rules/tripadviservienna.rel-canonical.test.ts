import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { canonicalRule } from '@/rules/head/canonical'
import { hreflangRule } from '@/rules/head/hreflang'
import { relAlternateMediaRule } from '@/rules/head/relAlternateMedia'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.join(__dirname, '../fixtures/tripadviservienna.html')

const loadPage = () => {
  const html = readFileSync(fixturePath, 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const url = 'https://www.tripadvisor.at/Tourism-g190454-Vienna-Vacations.html'
  return { html, doc, url }
}

describe('Tripadvisor Vienna saved page', () => {
  it('detects canonical link', async () => {
    const page = loadPage()
    const res = await canonicalRule.run(page as any, { globals: {} })
    expect(res.type).toBe('info')
    expect((res.details as any)?.canonicalUrl).toBe(page.url)
  })

  it('detects hreflang alternates', async () => {
    const page = loadPage()
    const res = await hreflangRule.run(page as any, { globals: {} })
    expect((res.details as any)?.count).toBeGreaterThan(10)
    expect((res.details as any)?.languages).toContain('de-AT')
    expect(res.message.toLowerCase()).toContain('hreflang')
  })

  it('reports absence of rel=alternate media', async () => {
    const page = loadPage()
    const res = await relAlternateMediaRule.run(page as any, { globals: {} })
    expect(res.type).toBe('info')
    expect(res.message).toMatch(/No rel=alternate media/i)
  })
})
