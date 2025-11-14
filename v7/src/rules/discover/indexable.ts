import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const checkNoindex = (doc: Document, headers?: Record<string, string>) => {
  const metaEl = doc.querySelector('meta[name="robots"]')
  const robots = (metaEl?.getAttribute('content') || '').toLowerCase()
  const xr = (headers?.['x-robots-tag'] || '').toLowerCase()
  const hasNoindex = /\bnoindex\b/.test(robots) || /\bnoindex\b/.test(xr)

  return { hasNoindex, element: metaEl, xRobots: xr }
}

export const discoverIndexableRule: Rule = {
  id: 'discover:indexable',
  name: 'Indexable',
  enabled: true,
  async run(page) {
    const result = checkNoindex(page.doc, page.headers)
    const sourceHtml = extractHtml(result.element)

    return result.hasNoindex
      ? {
          label: 'DISCOVER',
          message: 'Noindex detected',
          type: 'warn',
          name: 'indexable',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(result.element),
            xRobotsTag: result.xRobots,
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Indexable',
          type: 'ok',
          name: 'indexable',
        }
  },
}

