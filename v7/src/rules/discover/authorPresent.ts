import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const findAuthor = (d: Document) => {
  const metaEl = d.querySelector('meta[name="author"]')
  const metaContent = (metaEl?.getAttribute('content') || '').trim()

  if (metaContent) {
    return { name: metaContent, element: metaEl }
  }

  const scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        const a = it && it['author']
        const n = typeof a === 'string' ? a : a && typeof a['name'] === 'string' ? a['name'] : ''
        if (n) return { name: String(n), element: s }
      }
    } catch {
      /* ignore */
    }
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
          name: 'authorPresent',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(result.element),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'No author (meta or LD+JSON)',
          type: 'warn',
          name: 'authorPresent',
        }
  },
}

