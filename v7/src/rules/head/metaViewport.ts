import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

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
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return { name: NAME, label: LABEL, message: 'No meta viewport tag found.', type: 'info', priority: 900, details: { tested: TESTED, reference: SPEC } }
    }
    const first = elements.sample[0]!
    const sourceHtml = extractHtml(first)
    return {
      name: NAME,
      label: LABEL,
      message: `Responsive meta viewport tag (${elements.total}) discovered.`,
      type: 'info',
      priority: 600,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(first),
        count: elements.total,
        shown: elements.shown,
        truncated: elements.truncated,
        content: first.getAttribute('content') || '',
        tested: TESTED,
        reference: SPEC,
      },
    }
  },
}
