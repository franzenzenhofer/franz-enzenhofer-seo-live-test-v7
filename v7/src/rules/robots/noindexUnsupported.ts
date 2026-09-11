import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Unsupported robots.txt noindex'
const RULE_ID = 'robots:noindex-unsupported'
const TIMEOUT_MS = 1500
const MAX_SHOWN = 20
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'

const checkedFacts = (criterion: string) => [
  textField('Fetch target', '/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Pattern', 'Line matches /^\\s*noindex\\s*:\\s*(.*)$/i after stripping a trailing # comment'),
  textField('Criterion', criterion),
]

// Same resolution as the original `new URL('/robots.txt', page.url)`: when it throws the check
// cannot run (the runner recorded runtime_error/-1000); a resolved non-http(s) target was
// refused by fetchStatusTextOnce (info/900), so it is not fetched here either.
const robotsTxtTargetFor = (pageUrl: string): URL | null => {
  try {
    return new URL('/robots.txt', pageUrl)
  } catch {
    return null
  }
}

const occurrencesOf = (text: string) => {
  const occurrences: Array<{ line: number; value: string }> = []
  let count = 0
  text.split(/\r\n|\r|\n/).forEach((line, index) => {
    const match = /^\s*noindex\s*:\s*(.*)$/i.exec(line.split('#')[0] || '')
    if (!match) return
    count++
    if (occurrences.length < MAX_SHOWN) occurrences.push({ line: index + 1, value: (match[1] || '').trim().slice(0, 512) })
  })
  return { occurrences, count }
}

export const robotsNoindexUnsupportedRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec#syntax'],
    description: 'Reports unsupported noindex records in robots.txt; these records never affect crawl permission.',
  },
  async run(page, ctx) {
    const target = robotsTxtTargetFor(page.url)
    if (!target) {
      return presentResult(robotsNoindexUnsupportedRule, page, {
        input: 'Page URL', type: 'runtime_error', priority: -1000,
        values: [textField('Unsupported noindex records', 'Not checked'), textField('Page URL validity', 'Not a valid URL')],
        checked: checkedFacts('No unsupported noindex record present in robots.txt'), noMarkup: NO_MARKUP,
      })
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return presentResult(robotsNoindexUnsupportedRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('Unsupported noindex records', 'Not checked'), textField('Page URL scheme', target.protocol)],
        checked: checkedFacts('Page URL uses the http or https scheme'), noMarkup: NO_MARKUP,
      })
    }
    const robotsTxtUrl = target.href
    const response = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    if (!response?.ok) {
      return presentResult(robotsNoindexUnsupportedRule, page, {
        input: response ? 'robots.txt response' : 'Not captured', type: 'info', priority: 900,
        values: [textField('Unsupported noindex records', 'Not checked'),
          textField('HTTP status', response ? httpStatusLabel(response.status) : 'No response received')],
        detailValues: [urlField('robots.txt URL', robotsTxtUrl)],
        checked: checkedFacts('No unsupported noindex record present in robots.txt'),
        noMarkup: NO_MARKUP,
      })
    }
    const { occurrences, count } = occurrencesOf(response.text)
    return presentResult(robotsNoindexUnsupportedRule, page, {
      input: 'robots.txt response', type: count ? 'warn' : 'info', priority: count ? 200 : 850,
      values: [textField('Unsupported noindex records', count), textField('HTTP status', httpStatusLabel(response.status))],
      detailValues: [urlField('robots.txt URL', robotsTxtUrl), textField('Records shown', occurrences.length),
        textField('Records omitted', count - occurrences.length)],
      checked: checkedFacts('No unsupported noindex record present in robots.txt'),
      evidence: occurrences.map((occurrence) => ({ name: `Line ${occurrence.line}`, fields: [
        textField('Line', occurrence.line), textField('Directive', `noindex: ${occurrence.value}`)] })),
      noMarkup: NO_MARKUP,
    })
  },
}
