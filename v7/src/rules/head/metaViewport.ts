import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SELECTOR = 'meta[name="viewport"]'
const LABEL = 'HEAD'
const NAME = 'Meta Viewport'
const SPEC = 'https://developer.mozilla.org/docs/Web/HTML/Viewport_meta_tag'
const TESTED = 'Detected <meta name="viewport"> presence.'

export const metaViewportRule: Rule = {
  id: 'head:meta-viewport',
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
      .concat(Array.from(page.domIdleDoc?.querySelectorAll(SELECTOR) || []))
      .filter((el, idx, arr) => arr.findIndex((n) => n.getAttribute('content') === el.getAttribute('content')) === idx)
    if (elements.length === 0) {
      return { name: NAME, label: LABEL, message: 'No meta viewport tag found.', type: 'info', priority: 900, details: { tested: TESTED, reference: SPEC } }
    }
    const first = elements[0]!
    const sourceHtml = extractHtml(first)
    return {
      name: NAME,
      label: LABEL,
      message: `Responsive meta viewport tag (${elements.length}) discovered.`,
      type: 'info',
      priority: 600,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(first),
        count: elements.length,
        content: first.getAttribute('content') || '',
        tested: TESTED,
        reference: SPEC,
      },
    }
  },
}
