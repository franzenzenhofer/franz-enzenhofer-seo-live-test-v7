import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical Link'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const elements = Array.from(page.doc.querySelectorAll('link[rel~="canonical" i]')) as HTMLLinkElement[]
    const count = elements.length
    if (count === 0) {
      return {
        label: LABEL,
        message: 'No canonical found within the static HTML.',
        type: 'warn',
        name: NAME,
        priority: 400,
        details: { reference: SPEC, canonicalUrl: null },
      }
    }
    if (count > 1) {
      const sourceHtml = extractHtmlFromList(elements)
      return {
        label: LABEL,
        message: 'Multiple canonical found within the static HTML.',
        type: 'error',
        priority: 200,
        name: NAME,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: elements.map((_, idx) => `link[rel~="canonical" i]:nth-of-type(${idx + 1})`),
          reference: SPEC,
        },
      }
    }
    const el = elements[0] as HTMLLinkElement
    const sourceHtml = extractHtml(el)
    const href = el.getAttribute('href')?.trim() || ''
    const resolved = href ? new URL(href, page.url).toString() : ''
    const isSelf = resolved === page.url
    const message = isSelf
      ? 'Canonical set (self-referencing).'
      : 'Canonical points to different URL.'
    return {
      label: LABEL,
      message,
      type: isSelf ? 'info' : 'warn',
      priority: isSelf ? 850 : 500,
      name: NAME,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(el),
        canonicalUrl: resolved,
        pageUrl: page.url,
        reference: SPEC,
      },
    }
  },
}
