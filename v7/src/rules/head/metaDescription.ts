import type { Rule } from '@/core/types'
import { extractHtml } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Meta Description'
const RULE_ID = 'head-meta-description'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/supported-tags#meta-descriptions'
const SELECTOR = 'meta[name="description"]'

const selectorAt = (index: number) => (index === 0 ? SELECTOR : `${SELECTOR}:nth-of-type(${index + 1})`)

const cleanContent = (value: string | null | undefined) => (value || '').trim()

export const metaDescriptionRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  bestPractice: true,
  run: async (page) => {
    const nodes = Array.from(page.doc.querySelectorAll(SELECTOR)) as HTMLMetaElement[]
    const count = nodes.length
    if (!count) {
      return { label: LABEL, message: 'No meta description found.', type: 'error', priority: 0, name: NAME, details: { reference: SPEC } }
    }
    if (count > 1) {
      const combined = nodes.map((node) => extractHtml(node)).join('\n')
      return {
        label: LABEL,
        message: `${count} meta descriptions found.`,
        type: 'warn',
        priority: 200,
        name: NAME,
        details: { domPaths: nodes.map((_, i) => selectorAt(i)), snippet: combined, sourceHtml: combined, reference: SPEC },
      }
    }
    const node = nodes[0]!
    const description = cleanContent(node.getAttribute('content'))
    const empty = description.length === 0
    return {
      label: LABEL,
      message: empty ? 'Meta description empty.' : `Meta description present (${description.length} chars)`,
      type: empty ? 'warn' : 'info',
      priority: empty ? 100 : 760,
      name: NAME,
      details: {
        snippet: description || '(empty)',
        sourceHtml: extractHtml(node),
        domPath: SELECTOR,
        description,
        reference: SPEC,
      },
    }
  },
}
