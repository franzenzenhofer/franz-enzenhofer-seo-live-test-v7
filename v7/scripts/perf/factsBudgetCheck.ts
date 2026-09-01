import { JSDOM } from 'jsdom'

import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'
import { validatePhaseMessage, PHASE_MESSAGE_BYTES } from '@/shared/phaseContract'

const SITES = [
  'https://orf.at/stories/3440788/', 'https://www.orf.at/', 'https://techcrunch.com/',
  'https://news.ycombinator.com/', 'https://en.wikipedia.org/wiki/SEO',
  'https://www.nytimes.com/', 'https://www.amazon.com/', 'https://www.theguardian.com/international',
  // Multibyte shapes: UTF-8 bytes can be ~3x the UTF-16 char count.
  'https://www3.nhk.or.jp/news/', 'https://www.asahi.com/', 'https://news.sina.com.cn/',
  'https://www.naver.com/', 'https://lenta.ru/',
]

const main = async () => {
  console.log(`phase message cap = ${PHASE_MESSAGE_BYTES} bytes\n`)
  console.log('site'.padEnd(42), 'bytes'.padStart(7), 'msgOK'.padStart(6), 'critTrunc'.padStart(10), 'buckets'.padStart(20), 'canon'.padStart(6), 'robots'.padStart(7))
  for (const url of SITES) {
    try {
      const html = await (await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
      const doc = new JSDOM(html).window.document
      const facts = collectDomFacts(doc, 'static')
      const data = { facts, url, capturedAt: Date.now(), navTiming: null }
      const bytes = new TextEncoder().encode(JSON.stringify({ event: 'document_end', data })).length
      const check = validatePhaseMessage('document_end', data)
      const rebuilt = domFactsToDocument(facts, (h) => new JSDOM(h).window.document)
      const realCanon = !!doc.querySelector('link[rel~="canonical" i]')
      const gotCanon = !!rebuilt.querySelector('link[rel~="canonical" i]')
      const realRobots = doc.querySelectorAll('head > meta[name]').length
      const gotRobots = rebuilt.querySelectorAll('head > meta[name]').length
      console.log(
        url.slice(0, 41).padEnd(42), String(bytes).padStart(7), String(check.ok).padStart(6),
        String(facts.criticalTruncated).padStart(10), (facts.truncatedBuckets.join(',') || '-').padStart(20),
        `${gotCanon === realCanon ? 'OK' : 'LOST'}`.padStart(6), `${gotRobots}/${realRobots}`.padStart(7),
      )
    } catch (e) { console.log(url.slice(0, 41).padEnd(42), 'FAILED', e instanceof Error ? e.message.slice(0, 30) : '') }
  }
}
main()
