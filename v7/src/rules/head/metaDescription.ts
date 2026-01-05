import type { Rule } from '@/core/types'
import { extractHtml } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Meta Description'
const RULE_ID = 'head-meta-description'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/supported-tags#meta-descriptions'
const SELECTOR = 'meta[name="description"]'

const cleanContent = (value: string | null | undefined) => (value || '').trim()

export const metaDescriptionRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
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
        message: 'Multiple meta description tags found.',
        type: 'error',
        priority: 100,
        name: NAME,
        details: { domPaths: getDomPaths(nodes), snippet: combined, sourceHtml: combined, reference: SPEC },
      }
    }
    const node = nodes[0]!
    const description = cleanContent(node.getAttribute('content'))
    const empty = description.length === 0
    return {
      label: LABEL,
      message: empty ? 'Meta description is empty.' : 'Meta description set.',
      type: empty ? 'error' : 'info',
      priority: empty ? 100 : 760,
      name: NAME,
      details: {
        snippet: description || '(empty)',
        sourceHtml: extractHtml(node),
        domPath: getDomPath(node),
        description,
        reference: SPEC,
      },
    }
  },
}
