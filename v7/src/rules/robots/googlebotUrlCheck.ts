import { matchingRuleEvidence } from './googlebotUrlCheck.evidence'

import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { robotsPolicyState } from '@/shared/robotsPolicy'

const NAME = 'Googlebot URL allowed'
const RULE_ID = 'robots:googlebot-url-check'
const TIMEOUT_MS = 1500
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'
const USER_AGENT = 'Googlebot'
const OTHER_AGENTS = ['Googlebot-News', 'Googlebot-Image']

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Crawler', USER_AGENT),
  textField('Criterion', criterion),
]

export const googlebotUrlCheckRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1',
    ],
    description: 'Parses robots.txt and reports whether Googlebot may crawl the current URL (ok when allowed, error when disallowed).',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      origin = new URL(page.url).origin
    } catch {
      return presentResult(googlebotUrlCheckRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('Googlebot crawl permission', 'Not checked'), textField('Reason', 'Invalid page URL')],
        checked: checkedFacts('robots.txt permits this URL for Googlebot'), noMarkup: NO_MARKUP,
      })
    }
    const response = await fetchStatusTextOnce(`${origin}/robots.txt`, TIMEOUT_MS, ctx.signal)
    const state = robotsPolicyState(response)
    const robotsTxtUrl = `${origin}/robots.txt`
    if (state === 'unknown') {
      return presentResult(googlebotUrlCheckRule, page, {
        input: response ? 'robots.txt response' : 'Not captured', type: 'info', priority: 850,
        values: [textField('Googlebot crawl permission', 'Not checked'),
          textField('HTTP status', response ? httpStatusLabel(response.status) : 'No response received')],
        detailValues: [/^https?:/i.test(origin) ? urlField('robots.txt URL', robotsTxtUrl) : textField('robots.txt URL', robotsTxtUrl)],
        checked: checkedFacts('robots.txt permits this URL for Googlebot'), noMarkup: NO_MARKUP,
      })
    }
    const txt = state === 'allow' ? '' : response?.text || ''
    const allowed = Boolean((parse(txt, page.url, USER_AGENT) as Record<string, unknown>)['allowed'])
    // Same path @/vendor/robots' parse() matches against: pathname + search, not the full URL.
    const path = (() => { try { const u = new URL(page.url); return u.pathname + u.search } catch { return '/' } })()
    const { groupLabel, matches } = matchingRuleEvidence(txt, path, USER_AGENT)
    const comparison = OTHER_AGENTS.map((agent) => textField(agent, (parse(txt, page.url, agent) as Record<string, unknown>)['allowed'] ? 'Allowed' : 'Disallowed'))
    return presentResult(googlebotUrlCheckRule, page, {
      input: 'robots.txt response', type: allowed ? 'ok' : 'error', priority: allowed ? 800 : 60,
      values: [textField('Googlebot crawl permission', allowed ? 'Allowed' : 'Disallowed'), textField('HTTP status', httpStatusLabel(response!.status))],
      detailValues: [urlField('robots.txt URL', robotsTxtUrl), urlField('Checked URL', page.url)],
      checked: checkedFacts('robots.txt permits this URL for Googlebot'),
      evidence: [
        { name: 'Applicable user-agent group', fields: [textField('Group', groupLabel),
          ...(matches.length ? [] : [textField('Matching rule', 'None - default allow applies')])] },
        ...matches.map((m) => ({ name: `Line ${m.line}`, fields: [textField('Line', m.line), textField('Directive', m.key === 'allow' ? 'Allow' : 'Disallow'), textField('Value', m.val)] })),
        { name: 'Other crawlers', fields: comparison },
      ],
      noMarkup: NO_MARKUP,
    })
  },
}
