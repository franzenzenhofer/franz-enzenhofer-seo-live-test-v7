import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'

export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large',
  name: 'max-image-preview:large',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/google-discover',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
    ],
    description: 'Checks that max-image-preview:large is present in meta[name=robots] or X-Robots-Tag (ok if present, warn if not, framed as a Discover recommendation).',
  },
  async run(page) {
    const metaEl = page.doc.querySelector('meta[name="robots"]')
    const xr = (page.headers?.['x-robots-tag'] || '').toLowerCase()
    const effective = pageEffectiveRobots(page)
    const ok = effective.maxImagePreview === 'large' && !effective.noimageindex
    const sourceHtml = extractHtml(metaEl)
    const robotsContent = (metaEl?.getAttribute('content') || '').trim()

    return ok
      ? {
          label: 'DISCOVER',
          message: 'Effective Googlebot max-image-preview:large',
          type: 'ok',
          priority: 800,
          name: 'max-image-preview:large',
          details: { effective,
            ...(robotsContent ? { robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(metaEl) } : {}),
            ...(xr ? { xRobotsTag: xr } : {}),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Large image previews are not effectively enabled for Googlebot (recommended for Google Discover)',
          type: 'warn',
          priority: 400,
          name: 'max-image-preview:large',
          details: { effective, ...(robotsContent ? { robotsContent } : {}), ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(metaEl) } : {}) },
        }
  },
}
