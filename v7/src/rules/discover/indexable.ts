import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'

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
    const effective = pageEffectiveRobots(page)
    const result = { hasNoindex: effective.noindex, element: page.doc.querySelector('meta[name="robots" i]'),
      robotsContent: effective.directives.filter((entry) => entry.source === 'meta').map((entry) => entry.value).join('; '),
      xRobots: effective.directives.filter((entry) => entry.source === 'header').map((entry) => entry.value).join('; ') }
    const sourceHtml = extractHtml(result.element)

    return result.hasNoindex
      ? {
          label: 'DISCOVER',
          message: 'Noindex detected',
          type: 'warn',
          priority: 150,
          name: 'Indexable',
          details: { effective,
            ...(result.robotsContent ? { robotsContent: result.robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'No effective noindex directive for Googlebot; this alone does not establish indexability',
          type: 'ok',
          priority: 850,
          name: 'Indexable',
          details: { effective,
            ...(result.robotsContent ? { robotsContent: result.robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(result.element) } : {}),
            ...(result.xRobots ? { xRobotsTag: result.xRobots } : {}),
          },
        }
  },
}
