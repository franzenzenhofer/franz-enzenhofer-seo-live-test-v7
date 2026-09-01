import { JSDOM } from 'jsdom'

import { pageFromEvents } from '@/shared/page'
import type { EventRec } from '@/background/pipeline/types'

// Measures whether building a Page from captured navigation events still pays a
// live HEAD probe of the page URL (it did: unconditionally, serialized before
// any rule could run). Usage: npx tsx scripts/perf/probeSkip.ts <url>

const url = process.argv[2] || 'https://orf.at/stories/3440788/'
const makeDoc = (h: string) => new JSDOM(h).window.document

const events: EventRec[] = [
  { t: 'nav:commit', u: url },
  { t: 'req:mainHeaders', u: url, h: { 'content-type': 'text/html; charset=utf-8', 'content-encoding': 'gzip' }, sc: 200 },
  { t: 'req:mainDone', u: url, s: 200 },
  { t: 'dom:document_end', d: { html: '<!doctype html><title>t</title>' } },
]

let fetches = 0
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  fetches++
  return realFetch(input as RequestInfo, init)
}) as typeof fetch

const main = async () => {
  const t0 = performance.now()
  const page = await pageFromEvents(events, makeDoc, () => url)
  const ms = Math.round(performance.now() - t0)
  console.log(`pageFromEvents (headers captured in events): probe fetches=${fetches}  wall=${ms}ms  status=${page.status}  headers=${page.headers ? 'events' : 'none'}`)
}
main()
