import { coverageDetails } from './blockedResources.evidence'

import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { robotsPolicyState } from '@/shared/robotsPolicy'

const NAME = 'robots.txt Blocked Resources'
const RULE_ID = 'robots:blocked-resources'
const TIMEOUT_MS = 1500
const MAX_SHOWN = 10
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'
const USER_AGENT = 'Googlebot'

// robots.txt is scoped by ORIGIN: scheme+host+port, so https://x.test and
// http://x.test answer to different files.
const sameOrigin = (a: string, b: string) => {
  try { return new URL(a).origin === new URL(b).origin } catch { return false }
}

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Crawler', USER_AGENT),
  textField('Same-origin matching', 'Resource URL and page URL share scheme, host and port'),
  textField('Criterion', criterion),
]
const CRITERION = 'Every retained same-origin resource is allowed by robots.txt for Googlebot'

export const robotsBlockedResourcesRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1',
      'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
    ],
    description: 'Checks every retained same-origin subresource the page loaded against robots.txt for Googlebot and warns when any is disallowed; discloses when the resource ledger was truncated.',
  },
  async run(page, ctx) {
    const list = page.resources || []
    const resourceCount = list.length
    if (!resourceCount) {
      return presentResult(robotsBlockedResourcesRule, page, {
        input: 'Not captured', type: 'info', priority: 900,
        values: [textField('Resource requests', 'Not captured'), textField('Resources checked', 'Not checked')],
        checked: checkedFacts(CRITERION), noMarkup: NO_MARKUP,
      })
    }
    const base = new URL(page.url)
    const robotsTxtUrl = `${base.origin}/robots.txt`
    const response = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    const policy = robotsPolicyState(response)
    const url = urlField('robots.txt URL', robotsTxtUrl)
    const ledger = [textField('Resource URLs', resourceCount), ...coverageDetails(page)]
    if (policy === 'unknown') {
      return presentResult(robotsBlockedResourcesRule, page, {
        input: response ? 'Resource requests + robots.txt response' : 'Resource requests', type: 'info', priority: 850,
        values: [textField('Resources checked', 'Not checked'),
          response ? textField('HTTP status', httpStatusLabel(response.status)) : textField('Response', 'Request failed'), url],
        detailValues: ledger, checked: checkedFacts(CRITERION), noMarkup: NO_MARKUP,
      })
    }
    const robotsTxt = policy === 'allow' ? '' : response?.text || ''
    const sameOriginUrls = list.filter((url) => sameOrigin(page.url, url))
    const blocked = sameOriginUrls.filter((url) => !((parse(robotsTxt, url, USER_AGENT) as Record<string, unknown>)['allowed']))
    const crossOriginCount = resourceCount - sameOriginUrls.length
    const common = {
      input: 'Resource requests + robots.txt response',
      detailValues: [textField('HTTP status', httpStatusLabel(response!.status)), ...ledger, textField('Cross-origin resources', crossOriginCount)],
      checked: checkedFacts(CRITERION),
      noMarkup: NO_MARKUP,
    }
    if (!sameOriginUrls.length) {
      return presentResult(robotsBlockedResourcesRule, page, { ...common, type: 'info', priority: 850,
        values: [textField('Resources checked', 0), textField('Cross-origin resources', crossOriginCount), url],
        detailValues: common.detailValues.filter((field) => field.key !== 'Cross-origin resources') })
    }
    if (blocked.length) {
      const shown = blocked.slice(0, MAX_SHOWN)
      return presentResult(robotsBlockedResourcesRule, page, { ...common, type: 'warn', priority: 200,
        values: [textField('Blocked resources', blocked.length), textField('Resources checked', sameOriginUrls.length), url],
        detailValues: [...common.detailValues, textField('Allowed resources', sameOriginUrls.length - blocked.length),
          ...(blocked.length > shown.length ? [textField('Blocked not listed', blocked.length - shown.length)] : [])],
        evidence: shown.map((resource, index) => ({ name: `Blocked resource ${index + 1}`, fields: [urlField('Resource URL', resource)] })) })
    }
    return presentResult(robotsBlockedResourcesRule, page, { ...common, type: 'ok', priority: 800,
      values: [textField('Blocked resources', 0), textField('Resources checked', sameOriginUrls.length), url] })
  },
}
