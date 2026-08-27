import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { parseLd } from '@/shared/structured'

const SPEC = 'https://developers.google.com/search/docs/appearance/structured-data/article#author'

const findAuthor = (d: Document) => {
  const metaEl = d.querySelector('meta[name="author"]')
  const metaContent = (metaEl?.getAttribute('content') || '').trim()

  if (metaContent) {
    return { name: metaContent, element: metaEl }
  }

  const script = d.querySelector('script[type="application/ld+json"]')
  for (const node of parseLd(d)) {
    const author = node['author']
    const first = Array.isArray(author) ? author[0] : author
    const name = typeof first === 'string'
      ? first
      : first && typeof first === 'object' && typeof (first as Record<string, unknown>)['name'] === 'string'
        ? String((first as Record<string, unknown>)['name'])
        : ''
    if (name) return { name, element: script }
  }
  return { name: '', element: null }
}

export const discoverAuthorPresentRule: Rule = {
  id: 'discover:author',
  name: 'Author present',
  enabled: true,
  what: 'static',
  async run(page) {
    const result = findAuthor(page.doc)
    const sourceHtml = extractHtml(result.element)

    return result.name
      ? {
          label: 'DISCOVER',
          message: `Author: ${result.name}`,
          type: 'info',
          name: 'Author present',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(result.element),
            reference: SPEC,
          },
        }
      : {
          label: 'DISCOVER',
          message: 'No author (meta or LD+JSON)',
          type: 'warn',
          name: 'Author present',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(result.element),
            reference: SPEC,
          },
        }
  },
}
