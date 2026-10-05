import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { JSDOM } from 'jsdom'

import { runAll } from '@/core/run'
import type { Page, Result } from '@/core/types'
import { registry } from '@/rules/registry'
import { boundResult } from '@/shared/boundResult'
import { collectDomFacts } from '@/shared/domFacts'
import { pageFromEvents } from '@/shared/page'
import type { EventRec } from '@/background/pipeline/types'

// Realistic pages, run the way the extension runs them: static/idle rules in the content script
// against the live document, every other rule offscreen against the page rebuilt from events.
export const FIXTURES = [
  { name: 'rich', file: 'rich.html', url: 'https://chefs.example.test/@alex-3ms?hl=en' },
  { name: 'self-canonical', file: 'self-canonical.html', url: 'https://bistro.example.test/' },
  { name: 'bare', file: 'bare.html', url: 'https://bare.example.test/start' },
  { name: 'edge', file: 'edge.html', url: 'https://edge.example.test/a/index.html' },
  { name: 'relative', file: 'relative.html', url: 'https://shop.example.test/products?category=shoes' },
] as const
export type FixtureName = (typeof FIXTURES)[number]['name']
export type RuleRun = { ruleId: string; fixture: FixtureName; result: Result }

const HEADERS = { Status: '200', 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'max-age=60', 'Content-Encoding': 'br' }
const parse = (html: string, url: string) => new JSDOM(html, { url }).window.document
const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

const offscreenPage = async (doc: Document, url: string): Promise<Page> => {
  const events = [
    { t: 'nav:before', u: url }, { t: 'nav:commit', u: url },
    { t: 'req:mainHeaders', u: url, h: HEADERS, s: 200 }, { t: 'req:mainDone', u: url, s: 200 },
    { t: 'dom:document_end', d: { facts: collectDomFacts(doc, 'static'), baseUri: doc.baseURI } },
    { t: 'dom:document_idle', d: { facts: collectDomFacts(doc, 'idle'), baseUri: doc.baseURI } },
  ] as unknown as EventRec[]
  return pageFromEvents(events, makeDoc, () => url, async () => ({}))
}

export const runFixtures = async (only?: string[]): Promise<RuleRun[]> => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('Network disabled in formatting fixtures') }
  const runs: RuleRun[] = []
  try {
    for (const fixture of FIXTURES) {
      const html = readFileSync(resolve(__dirname, '../fixtures/formatting', fixture.file), 'utf8')
      const doc = parse(html, fixture.url)
      const offscreen = await offscreenPage(doc, fixture.url)
      for (const rule of registry.filter((candidate) => !only || only.includes(candidate.id))) {
        const inPage = rule.input === 'static' || rule.input === 'idle'
        const page: Page = inPage
          ? { html: '', url: fixture.url, doc, ...(rule.input === 'static' ? { staticFacts: collectDomFacts(doc, 'static') } : { idleFacts: collectDomFacts(doc, 'idle') }) }
          : offscreen
        const [result] = await runAll(0, [{ ...rule, enabled: true }], page, { globals: {} })
        if (result) runs.push({ ruleId: rule.id, fixture: fixture.name, result: boundResult(result) })
      }
    }
  } finally {
    globalThis.fetch = realFetch
  }
  return runs
}
