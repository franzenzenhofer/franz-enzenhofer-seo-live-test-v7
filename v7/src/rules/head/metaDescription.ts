import type { Rule } from '@/core/types'
import { extractHtml } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const LABEL = 'HEAD'
const NAME = 'Meta Description'
const RULE_ID = 'head-meta-description'
const SELECTOR = 'meta[name="description"]'

const cleanContent = (value: string | null | undefined) => (value || '').trim()

export const metaDescriptionRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/special-tags',
      'https://developers.google.com/search/docs/appearance/snippet',
    ],
    description: 'Checks that exactly one non-empty meta[name=description] exists (warn on missing or empty, error on multiple).',
  },
  run: async (page) => {
    const nodes = sampleElements(page.doc.querySelectorAll<HTMLMetaElement>(SELECTOR))
    const count = nodes.total
    if (!count) {
      return { label: LABEL, message: 'No meta description found.', type: 'warn', priority: 0, name: NAME, details: {} }
    }
    if (count > 1) {
      const combined = nodes.sample.map((node) => extractHtml(node)).join('\n')
      return {
        label: LABEL,
        message: 'Multiple meta description tags found.',
        type: 'error',
        priority: 100,
        name: NAME,
        details: { domPaths: getDomPaths(nodes.sample), snippet: combined, sourceHtml: combined, count, shown: nodes.shown, truncated: nodes.truncated },
      }
    }
    const node = nodes.sample[0]!
    const description = cleanContent(node.getAttribute('content'))
    const empty = description.length === 0
    return {
      label: LABEL,
      message: empty
        ? 'Meta description is empty.'
        : `Meta description present (${description.length} characters).`,
      type: empty ? 'warn' : 'ok',
      priority: empty ? 100 : 760,
      name: NAME,
      details: {
        snippet: description || '(empty)',
        sourceHtml: extractHtml(node),
        domPath: getDomPath(node),
        description,
        length: description.length,
      },
    }
  },
}
