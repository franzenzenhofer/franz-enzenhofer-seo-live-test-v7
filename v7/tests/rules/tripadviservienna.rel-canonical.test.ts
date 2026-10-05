import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { canonicalRule } from '@/rules/head/canonical'
import { hreflangRule } from '@/rules/head/hreflang'
import { relAlternateMediaRule } from '@/rules/head/relAlternateMedia'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'

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
    expect(res.type).toBe('ok')
    expect(res.presentation?.values).toContainEqual({ key: 'Canonical URL', value: page.url, kind: 'url' })
    expect(res.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Equals current page URL', kind: 'text' })
  })

  it('detects hreflang alternates', async () => {
    const page = loadPage()
    const res = await hreflangRule.run(page as any, { globals: {} })
    const linkCount = res.presentation?.values.find((field) => field.key === 'Hreflang links')?.value as number
    expect(linkCount).toBeGreaterThan(10)
    // An inventory ships every link: one evidence record and one original markup field each, well past the 10-element sample.
    expect(res.presentation?.evidence.length).toBe(linkCount)
    expect(res.presentation?.markup.length).toBe(linkCount)
    expect(res.presentation?.markup.length).toBeGreaterThan(EVIDENCE_LIMIT)
    expect(res.presentation?.values.find((field) => field.key === 'Languages')?.value).toMatch(/ … \d+ more$/)
    expect(res.message.toLowerCase()).toContain('hreflang')
  })

  it('reports absence of rel=alternate media', async () => {
    const page = loadPage()
    const res = await relAlternateMediaRule.run(page as any, { globals: {} })
    expect(res.type).toBe('info')
    expect(res.presentation?.values).toContainEqual({ key: 'Alternate media link', value: 'Not found', kind: 'text' })
  })
})
