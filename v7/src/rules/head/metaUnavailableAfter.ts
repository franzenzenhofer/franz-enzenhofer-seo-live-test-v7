import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Meta Unavailable After'
const RULE_ID = 'head:unavailable-after'
const SELECTOR = 'meta[content^="unavailable_after"]'
const SPEC = 'https://developers.google.com/search/blog/2007/04/using-meta-tags-to-block-indexing'

const isUnavailable = (directive: string) => {
  const [prefix, ...rest] = directive.split(':')
  if (!prefix || prefix.toLowerCase() !== 'unavailable_after') return false
  const date = Date.parse(rest.join(':'))
  return !Number.isNaN(date) && date < Date.now()
}

export const metaUnavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const nodes: HTMLMetaElement[] = []
    const push = (doc?: Document) => doc && nodes.push(...Array.from(doc.querySelectorAll(SELECTOR)) as HTMLMetaElement[])
    push(page.doc)
    push(page.domIdleDoc)

    if (!nodes.length) {
      return { label: LABEL, name: NAME, message: 'No unavailable_after meta tag found.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const unique = nodes.filter((node, idx, arr) => arr.findIndex((n) => n.getAttribute('content') === node.getAttribute('content')) === idx)
    const first = unique[0]!
    const content = (first.getAttribute('content') || '').trim()
    const past = isUnavailable(content)
    const sourceHtml = extractHtmlFromList(unique)

    return {
      label: LABEL,
      name: NAME,
      message: `${unique.length} unavailable_after meta information found: ${content}${past ? ' (date already in the past)' : ''}`,
      type: past ? 'error' : 'warn',
      priority: past ? 80 : 300,
      details: {
        sourceHtml,
        snippet: extractSnippet(content || sourceHtml),
        domPath: getDomPath(first),
        count: unique.length,
        past,
        reference: SPEC,
      },
    }
  },
}
