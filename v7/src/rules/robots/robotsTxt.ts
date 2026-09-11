import type { Rule } from '@/core/types'
import { fetchStatusTextOnce, type FetchOnceResult } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { robotsPolicyState } from '@/shared/robotsPolicy'

const NAME = 'robots.txt Exists'
const RULE_ID = 'robots-exists'
const TIMEOUT_MS = 1500
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'

const getRobotsTxtUrl = (pageUrl: string): string => {
  try {
    const parsed = new URL(pageUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.error(`[robotsTxt] Invalid protocol blocked: ${parsed.protocol} from ${pageUrl}`)
      return ''
    }
    return `${parsed.origin}/robots.txt`
  } catch (e) {
    console.error(`[robotsTxt] Invalid URL: ${pageUrl}`, e)
    return ''
  }
}

// Google treats all 4xx errors except 429 as if no robots.txt exists (allow-all);
// 429 and 5xx count as unreachable: crawling pauses and complete disallow may be assumed.
// One shared reading of robots.txt fetch status across every robots rule.
const isNoRobotsStatus = (status: number, response: FetchOnceResult) =>
  robotsPolicyState({ ...response, status, ok: false }) === 'allow'

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Criterion', criterion),
]

export const robotsTxtRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.3.1',
    ],
    description: 'Fetches origin/robots.txt and branches on status class: 2xx exists (info), 4xx except 429 counts as no robots.txt - all crawling allowed (info), 429/5xx/network failure counts as unreachable - Googlebot pauses crawling and may assume complete disallow (warn).',
  },
  run: async (page, ctx) => {
    const robotsTxtUrl = getRobotsTxtUrl(page.url)
    if (!robotsTxtUrl) {
      return presentResult(robotsTxtRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('robots.txt', 'Not checked'), textField('Reason', 'Invalid or unsupported page URL')],
        checked: checkedFacts('Page URL uses the http or https scheme'),
        noMarkup: NO_MARKUP,
      })
    }
    // Six robots rules run concurrently against the same robots.txt; the shared
    // single-flight fetch collapses them onto one request per run.
    const response = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    if (response === null) {
      return presentResult(robotsTxtRule, page, {
        input: 'Not captured', type: 'warn', priority: 350,
        values: [textField('robots.txt', 'Unreachable'), textField('Reason', 'Network error or timeout')],
        detailValues: [urlField('robots.txt URL', robotsTxtUrl)],
        checked: checkedFacts('robots.txt responds within the timeout'),
        evidence: [{ name: 'robots.txt fetch', fields: [urlField('robots.txt URL', robotsTxtUrl), textField('Outcome', 'No response received')] }],
        noMarkup: NO_MARKUP,
      })
    }
    const status = response.status
    const common = {
      input: 'robots.txt response',
      detailValues: [urlField('robots.txt URL', robotsTxtUrl)],
      evidence: [{ name: 'robots.txt fetch', fields: [urlField('robots.txt URL', robotsTxtUrl), textField('HTTP status', httpStatusLabel(status))] }],
      noMarkup: NO_MARKUP,
    }
    if (!response.ok) {
      if (isNoRobotsStatus(status, response)) {
        return presentResult(robotsTxtRule, page, { ...common, type: 'info', priority: 800,
          values: [textField('robots.txt', 'Not found'), textField('HTTP status', httpStatusLabel(status))],
          checked: checkedFacts('A 4xx status other than 429 is treated as allow-all') })
      }
      return presentResult(robotsTxtRule, page, { ...common, type: 'warn', priority: 300,
        values: [textField('robots.txt', 'Unreachable'), textField('HTTP status', httpStatusLabel(status))],
        checked: checkedFacts('A 429 or 5xx status is treated as unreachable') })
    }
    return presentResult(robotsTxtRule, page, { ...common, type: 'info', priority: 800,
      values: [textField('robots.txt', 'Found'), textField('HTTP status', httpStatusLabel(status))],
      detailValues: [...common.detailValues, textField('Response body', `${response.bytes} bytes${response.truncated ? ' (truncated at 500 KiB)' : ''}`)],
      checked: checkedFacts('A 2xx status') })
  },
}
