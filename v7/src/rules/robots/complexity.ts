import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'robots.txt Complexity'
const RULE_ID = 'robots:complexity'
const TIMEOUT_MS = 1500
const MAX_SHOWN = 20
const NO_MARKUP = 'None - this rule checks robots.txt, not document markup'
const KINDS = ['disallow', 'allow', 'sitemap'] as const

const checkedFacts = (criterion: string) => [
  textField('Fetch target', 'origin/robots.txt'),
  textField('Timeout', `${TIMEOUT_MS} ms`),
  textField('Pattern', 'Lines matching /^\\s*(disallow|allow|sitemap)\\s*:/i'),
  textField('Criterion', criterion),
]

// Same per-category regexes and split as the original counters; also records
// each matched line's number and kind for bounded, labelled evidence.
const directiveLines = (text: string) => {
  const lines = text.split(/\r?\n/)
  const counts = { disallow: 0, allow: 0, sitemap: 0 }
  const matches: Array<{ line: number; kind: string; raw: string }> = []
  lines.forEach((raw, index) => {
    for (const kind of KINDS) {
      if (new RegExp(`^\\s*${kind}\\s*:`, 'i').test(raw)) {
        counts[kind]++
        matches.push({ line: index + 1, kind: kind.charAt(0).toUpperCase() + kind.slice(1), raw: raw.trim() })
      }
    }
  })
  return { counts, matches }
}

export const robotsComplexityRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'franz',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt'],
    description: 'Informational count of Disallow, Allow, and Sitemap lines in robots.txt as a complexity indicator.',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      origin = new URL(page.url).origin
    } catch {
      return presentResult(robotsComplexityRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('robots.txt complexity', 'Not checked'), textField('Reason', 'Invalid page URL')],
        checked: checkedFacts('Informational count only; no pass/fail threshold'), noMarkup: NO_MARKUP,
      })
    }
    const robotsTxtUrl = `${origin}/robots.txt`
    const fetched = await fetchStatusTextOnce(robotsTxtUrl, TIMEOUT_MS, ctx.signal)
    if (!fetched?.ok) {
      return presentResult(robotsComplexityRule, page, {
        input: fetched ? 'robots.txt response' : 'Not captured', type: 'info', priority: 850,
        values: [textField('robots.txt complexity', 'Not checked'), textField('HTTP status', fetched ? httpStatusLabel(fetched.status) : 'No response received')],
        detailValues: [/^https?:/i.test(origin) ? urlField('robots.txt URL', robotsTxtUrl) : textField('robots.txt URL', robotsTxtUrl)],
        checked: checkedFacts('Informational count only; no pass/fail threshold'), noMarkup: NO_MARKUP,
      })
    }
    const { counts, matches } = directiveLines(fetched.text)
    const totalRules = counts.disallow + counts.allow
    const shown = matches.slice(0, MAX_SHOWN)
    return presentResult(robotsComplexityRule, page, {
      input: 'robots.txt response', type: 'info', priority: 800,
      values: [textField('Disallow lines', counts.disallow), textField('Allow lines', counts.allow), textField('Sitemap lines', counts.sitemap)],
      detailValues: [urlField('robots.txt URL', robotsTxtUrl), textField('HTTP status', httpStatusLabel(fetched.status)),
        textField('Total Disallow/Allow rules', totalRules),
        ...(matches.length > MAX_SHOWN ? [textField('Directive lines omitted from evidence', matches.length - MAX_SHOWN)] : [])],
      checked: checkedFacts('Informational count only; no pass/fail threshold'),
      evidence: shown.map((m) => ({ name: `Line ${m.line}`, fields: [textField('Line', m.line), textField('Directive', m.kind), textField('Content', m.raw)] })),
      noMarkup: NO_MARKUP,
    })
  },
}
