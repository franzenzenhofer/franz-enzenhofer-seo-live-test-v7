// @vitest-environment node
import { createServer, type IncomingMessage, type Server } from 'node:http'

import { JSDOM } from 'jsdom'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { gscPropertyAvailableRule } from '@/rules/google/gsc/propertyAvailable'
import { gscPageWorldwideRule } from '@/rules/google/gsc/pageWorldwideSearchAnalytics'
import { gscDirectoryWorldwideRule } from '@/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics'
import { gscTopQueriesOfPageRule } from '@/rules/google/gsc/topQueriesOfPage'
import { gscIsIndexedRule } from '@/rules/google/gsc/isIndexed'
import { gscUrlInspectionRule } from '@/rules/google/gsc/urlInspection'
import { resultPreview } from '@/shared/resultPreview'

import type { Ctx, Page, Rule } from '@/core/types'

const PAGE_URL = 'https://example.test/blog/post'
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

const pageRows = [{ keys: [PAGE_URL], clicks: 571, impressions: 10664 }]
const queryRows = [
  { keys: ['franz enzenhofer', PAGE_URL], clicks: 60, impressions: 961 },
  { keys: ['full stack optimization', PAGE_URL], clicks: 90, impressions: 1080 },
]
const directoryRows = [{ clicks: 900, impressions: 20000 }]
const inspection = {
  inspectionResult: {
    inspectionResultLink: 'https://search.google.com/search-console/inspect',
    indexStatusResult: {
      verdict: 'PASS', coverageState: 'Submitted and indexed', lastCrawlTime: THREE_DAYS_AGO,
      referringUrls: ['https://example.test/'], googleCanonical: PAGE_URL, userCanonical: PAGE_URL,
    },
  },
}

type Body = { startDate?: string; rowLimit?: number; dimensions?: string[] }

/** Answers like the Search Console API does: a property probe, three query shapes, one inspection. */
const answer = (path: string, body: Body): { status: number; json: unknown } => {
  if (path.includes('urlInspection')) return { status: 200, json: inspection }
  if (body.rowLimit === 1 && body.startDate === '2024-01-01') {
    return { status: path.includes('sc-domain') ? 200 : 404, json: {} }
  }
  if (!body.dimensions) return { status: 200, json: { rows: directoryRows } }
  return { status: 200, json: { rows: body.dimensions.includes('query') ? queryRows : pageRows } }
}

const readBody = async (req: IncomingMessage): Promise<Body> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}') as Body
}

const page: Page = { html: '', url: PAGE_URL, doc: new JSDOM('<html></html>').window.document }
const ctx: Ctx = { globals: { googleApiAccessToken: 'test-token' } }
const runRule = async (rule: Rule): Promise<{ value: unknown; preview: string }> => {
  const result = await rule.run(page, ctx)
  return { value: result.details?.['value'], preview: resultPreview(result.details) }
}

describe('GSC rules put the judged value into details.value', () => {
  let server: Server
  const realFetch = globalThis.fetch

  beforeAll(async () => {
    server = createServer((req, res) => {
      void readBody(req).then((body) => {
        const { status, json } = answer(req.url || '', body)
        res.writeHead(status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(json))
      })
    })
    await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    const base = `http://127.0.0.1:${port}`
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const target = new URL(String(input))
      return realFetch(`${base}${target.pathname}${target.search}`, init)
    }) as typeof fetch
  })

  afterAll(async () => {
    globalThis.fetch = realFetch
    await new Promise<void>((resolve) => { server.close(() => resolve()) })
  })

  it('property rule: the property that was found', async () => {
    const { value, preview } = await runRule(gscPropertyAvailableRule)
    expect(value).toBe('sc-domain:example.test')
    expect(preview).toBe('sc-domain:example.test')
  })

  it('page analytics: the impressions and clicks', async () => {
    const { value, preview } = await runRule(gscPageWorldwideRule)
    expect(value).toBe('10664 impressions, 571 clicks')
    expect(preview).toBe('10664 impressions, 571 clicks')
  })

  it('directory analytics: the impressions and clicks of the directory', async () => {
    const { value, preview } = await runRule(gscDirectoryWorldwideRule)
    expect(value).toBe('20000 impressions, 900 clicks')
    expect(preview).toBe('20000 impressions, 900 clicks')
  })

  it('top queries: the queries with their impressions', async () => {
    const { value, preview } = await runRule(gscTopQueriesOfPageRule)
    expect(value).toBe('franz enzenhofer (961), full stack optimization (1080)')
    expect(preview).toBe('franz enzenhofer (961), full stack optimization (1080)')
  })

  it('historical impressions: the impressions figure', async () => {
    const { value, preview } = await runRule(gscIsIndexedRule)
    expect(value).toBe('10664 impressions')
    expect(preview).toBe('10664 impressions')
  })

  it('URL inspection: the coverage verdict and the last crawl', async () => {
    const { value, preview } = await runRule(gscUrlInspectionRule)
    expect(value).toBe('Submitted and indexed (PASS), last crawled 3 days ago')
    expect(preview).toBe('Submitted and indexed (PASS), last crawled 3 days ago')
  })

  it('shows no property name in any preview but the property rule', async () => {
    const previews = await Promise.all(
      [gscPageWorldwideRule, gscDirectoryWorldwideRule, gscTopQueriesOfPageRule, gscIsIndexedRule, gscUrlInspectionRule]
        .map(async (rule) => (await runRule(rule)).preview),
    )
    expect(previews.some((preview) => preview.includes('sc-domain'))).toBe(false)
  })
})
