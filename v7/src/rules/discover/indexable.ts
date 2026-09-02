import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const checkNoindex = (doc: Document, headers?: Record<string, string>) => {
  const metaEl = doc.querySelector('meta[name="robots"]')
  const robotsContent = (metaEl?.getAttribute('content') || '').trim()
  const robots = robotsContent.toLowerCase()
  const xr = (headers?.['x-robots-tag'] || '').toLowerCase()
  // 'none' is equivalent to 'noindex, nofollow' per Google's robots-meta-tag doc
  const noindexRe = /\b(?:noindex|none)\b/
  const hasNoindex = noindexRe.test(robots) || noindexRe.test(xr)

  return { hasNoindex, element: metaEl, xRobots: xr, robotsContent }
}

export const discoverIndexableRule: Rule = {
  id: 'discover:indexable',
  name: 'Indexable',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Checks that the page carries no noindex in meta[name=robots] or the X-Robots-Tag header (ok if indexable, warn on noindex).',
  },
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
            ...(result.robotsContent ? { robotsContent: result.robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Indexable (no noindex in robots meta or X-Robots-Tag)',
          type: 'ok',
          priority: 850,
          name: 'Indexable',
          details: {
            ...(result.robotsContent ? { robotsContent: result.robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
          },
        }
  },
}
