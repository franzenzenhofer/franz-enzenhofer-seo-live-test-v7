import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'Rel Alternate Media'
const RULE_ID = 'head:rel-alternate-media'
const SELECTOR = 'head > link[rel~="alternate" i][media][href]'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel#alternate'

export const relAlternateMediaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
      .concat(Array.from(page.domIdleDoc?.querySelectorAll(SELECTOR) || []))
      .filter((el, idx, arr) => arr.findIndex((n) => n.getAttribute('href') === el.getAttribute('href') && n.getAttribute('media') === el.getAttribute('media')) === idx)
    const count = elements.length
    if (!count) {
      return { label: LABEL, name: NAME, message: 'No rel=alternate media links found.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const mediaData = elements.map((link) => ({
      media: link.getAttribute('media')?.trim() || '',
      href: link.getAttribute('href')?.trim() || '',
    }))

    const message =
      count === 1 && mediaData[0]?.href
        ? `Separate mobile/alternate URL discovered: ${mediaData[0].href}`
        : `Separate media alternates discovered (${count}).`

    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = getDomPaths(elements)

    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'warn',
      priority: 600,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml, 200),
        domPaths,
        count,
        mediaData,
        reference: SPEC,
      },
    }
  },
}
