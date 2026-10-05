import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'

const NAME = 'robots.txt Sitemap reference'
const RULE_ID = 'robots:sitemap-reference'
const TIMEOUT_MS = 1500
const MAX_SHOWN = 20
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'
const SITEMAP_LINE = /^\s*sitemap\s*:\s*\S+.*$/i

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Same selection as the original global/multiline regex, applied per line so
// each declared Sitemap value keeps its 1-based source line number.
const sitemapOccurrences = (txt: string) => txt.split(/\r\n|\r|\n/).reduce<Array<{ line: number; value: string }>>((acc, line, index) => {
  if (SITEMAP_LINE.test(line)) acc.push({ line: index + 1, value: line.replace(/^\s*sitemap\s*:\s*/i, '').trim() })
  return acc
}, [])

const sitemapField = (value: string): DisplayField => isAbsoluteHttpUrl(value) ? urlField('Sitemap URL', value) : textField('Sitemap value', value)

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Pattern', 'Line matches /^\\s*sitemap\\s*:\\s*\\S+.*$/i'),
  textField('Criterion', criterion),
]

export const robotsSitemapReferenceRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
    ],
    description: 'Lists Sitemap: URLs declared in robots.txt; ok when fully qualified URLs are declared, warn on relative or malformed values, info when none are declared (other submission methods exist).',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return presentResult(robotsSitemapReferenceRule, page, {
          input: 'Page URL', type: 'info', priority: 900,
          values: [textField('Sitemap references', 'Not checked'), textField('Reason', `Skipped - ${url.protocol} URL`)],
          checked: checkedFacts('Page URL uses the http or https scheme'), noMarkup: NO_MARKUP,
        })
      }
      origin = url.origin
    } catch {
      return presentResult(robotsSitemapReferenceRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('Sitemap references', 'Not checked'), textField('Reason', 'Invalid page URL')],
        checked: checkedFacts('Page URL uses the http or https scheme'), noMarkup: NO_MARKUP,
      })
    }
    const robotsTxtUrl = `${origin}/robots.txt`
    const fetched = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    const url = urlField('robots.txt URL', robotsTxtUrl)
    if (!fetched?.ok) {
      return presentResult(robotsSitemapReferenceRule, page, {
        input: fetched ? 'robots.txt response' : 'Not captured', type: 'info', priority: 850,
        values: [textField('Sitemap references', 'Not checked'),
          fetched ? textField('HTTP status', httpStatusLabel(fetched.status)) : textField('Response', 'Not captured'), url],
        checked: checkedFacts('robots.txt is reachable to read Sitemap declarations'), noMarkup: NO_MARKUP,
      })
    }
    const occurrences = sitemapOccurrences(fetched.text)
    const invalidOccurrences = occurrences.filter((o) => !isAbsoluteHttpUrl(o.value))
    const shown = occurrences.slice(0, MAX_SHOWN)
    const status = textField('HTTP status', httpStatusLabel(fetched.status))
    const evidence = shown.map((o) => ({ name: `Line ${o.line}`, fields: [textField('Line', o.line), sitemapField(o.value),
      textField('Syntax', isAbsoluteHttpUrl(o.value) ? 'Absolute URL' : 'Relative or malformed')] }))
    const detailValues = occurrences.length > MAX_SHOWN ? [textField('Lines not listed', occurrences.length - MAX_SHOWN)] : []
    const common = { input: 'robots.txt response', detailValues, checked: checkedFacts('Every declared Sitemap value is an absolute HTTP(S) URL'), evidence, noMarkup: NO_MARKUP }
    if (!occurrences.length) {
      return presentResult(robotsSitemapReferenceRule, page, { ...common, type: 'info', priority: 820,
        values: [textField('Sitemap references', 0), status, url],
        checked: checkedFacts('No Sitemap line required; other submission methods exist') })
    }
    const values = [textField('Sitemap references', occurrences.length),
      ...(occurrences.length === 1 ? [sitemapField(occurrences[0]!.value)] : []),
      ...(invalidOccurrences.length ? [textField('Invalid values', invalidOccurrences.length)] : []), status, url]
    return presentResult(robotsSitemapReferenceRule, page, { ...common,
      type: invalidOccurrences.length ? 'warn' : 'ok', priority: invalidOccurrences.length ? 400 : 820, values })
  },
}
