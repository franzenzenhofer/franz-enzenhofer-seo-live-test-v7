import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

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
  what: 'static',
  async run(page) {
    const result = checkNoindex(page.doc, page.headers)
    const sourceHtml = extractHtml(result.element)

    return result.hasNoindex
      ? {
          label: 'DISCOVER',
          message: 'Noindex detected',
          type: 'warn',
          priority: 150,
          name: 'Indexable',
          details: {
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
            reference: SPEC,
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Indexable (no noindex in robots meta or X-Robots-Tag)',
          type: 'ok',
          priority: 850,
          name: 'Indexable',
          details: {
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
            reference: SPEC,
          },
        }
  },
}
