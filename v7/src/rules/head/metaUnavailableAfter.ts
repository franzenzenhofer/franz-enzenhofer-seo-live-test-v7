import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import type { DomPhaseFacts } from '@/shared/domFacts'

const LABEL = 'HEAD'
const NAME = 'Meta Unavailable After'
const RULE_ID = 'head:unavailable-after'
const SPEC = 'https://developers.google.com/search/blog/2007/04/using-meta-tags-to-block-indexing'

const isUnavailable = (directive: string) => {
  const [prefix, ...rest] = directive.split(':')
  if (!prefix || prefix.toLowerCase() !== 'unavailable_after') return false
  const date = Date.parse(rest.join(':'))
  return !Number.isNaN(date) && date < Date.now()
}

const contents = (facts?: DomPhaseFacts): string[] => (facts?.elements || []).flatMap((element) => {
  if (element.tag !== 'meta') return []
  const content = element.attrs.find(([name]) => name.toLowerCase() === 'content')?.[1] || ''
  return content.toLowerCase().startsWith('unavailable_after') ? [content] : []
})

export const metaUnavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // Only head meta facts are read below, and those are collected as critical,
    // so a capped anchor/resource sample must not block the comparison.
    if (!page.staticFacts || !page.idleFacts || page.staticFacts.criticalTruncated || page.idleFacts.criticalTruncated) {
      return {
        label: LABEL, name: NAME, type: 'runtime_error', priority: 900,
        message: 'Unavailable-after comparison requires complete bounded static and idle facts.',
        details: { staticAvailable: !!page.staticFacts, idleAvailable: !!page.idleFacts, reference: SPEC },
      }
    }
    const values = [...contents(page.staticFacts), ...contents(page.idleFacts)]
    const unique = [...new Set(values)]

    if (!unique.length) {
      return { label: LABEL, name: NAME, message: 'No unavailable_after meta tag found.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const content = unique[0]!.trim()
    const past = isUnavailable(content)
    const sourceHtml = unique.map((value) => `<meta content="${value}">`).join('\n')

    return {
      label: LABEL,
      name: NAME,
      message: `${unique.length} unavailable_after meta information found: ${content}${past ? ' (date already in the past)' : ''}`,
      type: past ? 'error' : 'warn',
      priority: past ? 80 : 300,
      details: {
        sourceHtml,
        snippet: extractSnippet(content || sourceHtml),
        count: unique.length,
        past,
        reference: SPEC,
      },
    }
  },
}
