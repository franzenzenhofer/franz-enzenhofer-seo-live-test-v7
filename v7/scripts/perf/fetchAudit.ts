import { JSDOM } from 'jsdom'

import { registry } from '@/rules/registry'
import { pageFromHtml } from '@/shared/page'

// Counts every network request made while running all offline-runnable rules
// against a URL, in parallel (mirroring the extension's rule lanes).
// Duplicate URLs = wasted network work. Usage:
//   npx tsx scripts/perf/fetchAudit.ts <url> [--include-psi]

const url = process.argv[2] || 'https://orf.at/stories/3440788/'
const includePsi = process.argv.includes('--include-psi')

type Row = { method: string; url: string; count: number; bytes: number }
const counts = new Map<string, Row>()
const responses: Array<{ key: string; res: Response; bytes: number; method: string }> = []
const realFetch = globalThis.fetch

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = (init?.method || 'GET').toUpperCase()
  const key = `${method} ${u}`
  const row = counts.get(key) || { method, url: u, count: 0, bytes: 0 }
  row.count++
  counts.set(key, row)
  const res = await realFetch(input as RequestInfo, init)
  const bytes = Number(res.headers.get('content-length') || 0)
  row.bytes += bytes
  responses.push({ key, res, bytes, method })
  return res
}) as typeof fetch

const main = async () => {
  const t0 = performance.now()
  const res = await realFetch(url)
  const html = await res.text()
  const page = await pageFromHtml(html, url, (h: string) => new JSDOM(h).window.document)
  // Mirror production: the collector always ships a resource ledger of subresource
  // URLs, which gates robots:blocked-resources. Derive it from the document.
  page.resources = Array.from(page.doc.querySelectorAll('script[src], img[src], link[href]'))
    .map((el) => el.getAttribute('src') || el.getAttribute('href') || '')
    .filter(Boolean)
    .map((u) => { try { return new URL(u, url).href } catch { return '' } })
    .filter(Boolean)
    .slice(0, 30)
  const runnable = registry.filter(
    (r) => r.enabled && (r.input === 'static' || r.input === 'context') && (includePsi || !r.id.startsWith('psi:')),
  )
  await Promise.all(
    runnable.map((rule) =>
      rule.run(page, { globals: { variables: {}, googleApiAccessToken: null } } as never).catch(() => null),
    ),
  )
  const wall = ((performance.now() - t0) / 1000).toFixed(1)
  const rows = Array.from(counts.values()).sort((a, b) => b.count - a.count)
  const total = rows.reduce((s, r) => s + r.count, 0)
  const dupes = rows.filter((r) => r.count > 1)
  console.log(`\nURL=${url}  rules=${runnable.length}  wall=${wall}s  fetches=${total}  uniqueUrls=${rows.length}\n`)
  console.log('ALL REQUESTS (count method url [bytes]):')
  rows.forEach((r) => console.log(`${String(r.count).padStart(3)}x ${r.method.padEnd(4)} ${r.url}  ${r.bytes ? `[${r.bytes}B]` : ''}`))
  console.log(`\nDUPLICATED URLS: ${dupes.length}  wasted requests: ${dupes.reduce((s, r) => s + r.count - 1, 0)}`)
  // A GET whose body is neither read nor cancelled still downloads in full.
  // bodyUsed stays false for those; .text()/.json() and body.cancel() both set it.
  const abandoned = responses.filter((r) => r.method === 'GET' && r.res.bodyUsed === false)
  const abandonedBytes = abandoned.reduce((s, r) => s + r.bytes, 0)
  console.log(`ABANDONED GET BODIES (downloaded, never read, never cancelled): ${abandoned.length}  ~${abandonedBytes}B`)
  abandoned.forEach((r) => console.log(`  ${r.key}  [${r.bytes}B]`))
}
main()
