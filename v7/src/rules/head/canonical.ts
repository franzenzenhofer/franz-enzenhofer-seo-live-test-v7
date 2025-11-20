import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical Link'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
const TESTED = 'Checked for a <link rel="canonical"> tag in <head> and extracted its resolved href.'

export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const el = page.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement|null
    if (!el || !el.href) {
      return {
        label: LABEL,
        message: 'No canonical link found.',
        type: 'error',
        name: NAME,
        details: { tested: TESTED, reference: SPEC, canonicalUrl: null },
      }
    }
    const sourceHtml = extractHtml(el)
    return {
      label: LABEL,
      message: 'Canonical link present',
      type: 'info',
      name: NAME,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(el),
        canonicalUrl: el.href,
        tested: TESTED,
        reference: SPEC,
      },
    }
  },
}
