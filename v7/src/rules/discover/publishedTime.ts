import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const findPublished = (d: Document) => {
  const el =
    d.querySelector('meta[property="article:published_time"]') ||
    d.querySelector('meta[name="pubdate"]') ||
    d.querySelector('time[datetime]')

  if (el) {
    const content =
      el.getAttribute('content') ||
      (el.tagName === 'TIME' ? el.getAttribute('datetime') : null) ||
      ''
    if (content) return { value: content, element: el }
  }

  const scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        if (it && typeof it['datePublished'] === 'string') {
          return { value: it['datePublished'] as string, element: s }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { value: '', element: null }
}

export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time',
  name: 'Discover: Published time',
  enabled: true,
  async run(page) {
    const result = findPublished(page.doc)
    const sourceHtml = extractHtml(result.element)

    return result.value
      ? {
          label: 'DISCOVER',
          message: `Published: ${result.value}`,
          type: 'info',
          name: 'publishedTime',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(result.element),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Add published time (meta or LD+JSON)',
          type: 'warn',
          name: 'publishedTime',
        }
  },
}

