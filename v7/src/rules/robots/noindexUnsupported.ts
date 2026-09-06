import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'

export const robotsNoindexUnsupportedRule: Rule = {
  id: 'robots:noindex-unsupported', name: 'Unsupported robots.txt noindex', enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec#syntax'],
    description: 'Reports unsupported noindex records in robots.txt; these records never affect crawl permission.',
  },
  async run(page, ctx) {
    const robotsTxtUrl = new URL('/robots.txt', page.url).href
    const response = await fetchStatusTextOnce(robotsTxtUrl, 1500, ctx.signal)
    const base = { label: 'ROBOTS', name: 'Unsupported robots.txt noindex' }
    if (!response?.ok) return { ...base, type: 'info', priority: 900,
      message: 'No readable robots.txt body available to check unsupported directives.', details: { robotsTxtUrl, status: response?.status } }
    const occurrences: Array<{ line: number; value: string }> = []
    let count = 0
    response.text.split(/\r\n|\r|\n/).forEach((line, index) => {
      const match = /^\s*noindex\s*:\s*(.*)$/i.exec(line.split('#')[0] || '')
      if (!match) return
      count++
      if (occurrences.length < 20) occurrences.push({ line: index + 1, value: (match[1] || '').trim().slice(0, 512) })
    })
    return { ...base, type: count ? 'warn' : 'info', priority: count ? 200 : 850,
      message: count ? `${count} unsupported noindex record${count > 1 ? 's' : ''} in robots.txt. Google ignores these; use robots meta or X-Robots-Tag for indexing directives.`
        : 'No unsupported noindex records found in robots.txt.',
      details: { robotsTxtUrl, count, occurrences, shown: occurrences.length, truncated: count > occurrences.length } }
  },
}
