import type { Rule } from '@/core/types'
import { parseDirectiveDate } from '@/shared/robotsDate'
import { extractSnippet } from '@/shared/html-utils'
import { isRobotsMetaDirective } from '@/shared/robotsVocabulary'
import type { DomPhaseFacts } from '@/shared/domFacts'

const LABEL = 'HEAD'
const NAME = 'Meta Unavailable After'
const RULE_ID = 'head:unavailable-after'
// The directive may be combined with other rules ("noindex, unavailable_after: ...");
// the date value itself may contain commas (RFC 822/850), so capture to the end.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i

const directiveValues = (facts?: DomPhaseFacts): string[] => (facts?.elements || []).flatMap((element) => {
  if (element.tag !== 'meta') return []
  const attr = (key: string) => element.attrs.find(([name]) => name.toLowerCase() === key)?.[1] || ''
  const name = attr('name')
  const content = attr('content')
  if (!name || !content || !isRobotsMetaDirective(name, content)) return []
  const match = DIRECTIVE.exec(content)
  return match?.[1] ? [match[1].trim()] : []
})

export const metaUnavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#unavailable_after'],
    description: 'Detects unavailable_after directives in robots meta tags and errors when the specified removal date is already in the past.',
  },
  async run(page) {
    // Only head meta facts are read below, and those are collected as critical,
    // so a capped anchor/resource sample must not block the comparison.
    if (!page.staticFacts || !page.idleFacts || page.staticFacts.criticalTruncated || page.idleFacts.criticalTruncated) {
      return {
        label: LABEL, name: NAME, type: 'runtime_error', priority: 900,
        message: 'Unavailable-after comparison requires complete bounded static and idle facts.',
        details: { staticAvailable: !!page.staticFacts, idleAvailable: !!page.idleFacts },
      }
    }
    const values = [...directiveValues(page.staticFacts), ...directiveValues(page.idleFacts)]
    const unique = [...new Set(values)]

    if (!unique.length) {
      return { label: LABEL, name: NAME, message: 'No unavailable_after directive found in robots meta tags.', type: 'info', priority: 900 }
    }

    const parsed = unique.map((value) => ({ value, ...parseDirectiveDate(value) }))
    const past = parsed.some((entry) => entry.timestamp !== null && entry.timestamp < Date.now())
    const allUnparseable = parsed.every((entry) => entry.timestamp === null)
    const first = parsed[0]!
    const suffix = past
      ? ' (date already in the past)'
      : allUnparseable
        ? ' (no valid date - Google ignores the rule)'
        : ''

    return {
      label: LABEL,
      name: NAME,
      message: `${unique.length} unavailable_after directive${unique.length > 1 ? 's' : ''} found: ${first.date}${suffix}`,
      type: past ? 'error' : 'warn',
      priority: past ? 80 : 300,
      details: {
        snippet: extractSnippet(first.value),
        values: unique,
        parsed,
        count: unique.length,
        past,
      },
    }
  },
}
