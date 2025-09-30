import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const hreflangMultipageRule: Rule = {
  id: 'head:hreflang-multipage',
  name: 'Hreflang multipage sanity',
  enabled: true,
  async run(page) {
    const links = Array.from(page.doc.querySelectorAll('link[rel="alternate"][hreflang]'))
    if (!links.length)
      return { name: 'Hreflang multipage sanity', label: 'HEAD', message: 'No hreflang links', type: 'info' }
    const sourceHtml = extractHtmlFromList(links)
    const langs = links.map((l) => (l.getAttribute('hreflang') || '').toLowerCase())
    const dupl = langs.length !== new Set(langs).size
    const hasXDefault = langs.includes('x-default')
    if (dupl) {
      return {
        name: 'Hreflang multipage sanity',
        label: 'HEAD',
        message: 'Duplicate hreflang entries',
        type: 'warn',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }
    return {
      name: 'Hreflang multipage sanity',
      label: 'HEAD',
      message: hasXDefault ? 'hreflang set with x-default' : 'Consider adding x-default',
      type: hasXDefault ? 'ok' : 'info',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
      },
    }
  },
}

