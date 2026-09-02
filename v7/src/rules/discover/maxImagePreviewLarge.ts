import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const hasDirective = (s: string, dir: string) => new RegExp(`\\b${dir.replace(/[-]/g, '[-]')}\\b`, 'i').test(s)

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
    const meta = (metaEl?.getAttribute('content') || '').toLowerCase()
    const xr = (page.headers?.['x-robots-tag'] || '').toLowerCase()
    const ok = hasDirective(meta, 'max-image-preview:large') || hasDirective(xr, 'max-image-preview:large')
    const sourceHtml = extractHtml(metaEl)
    const robotsContent = (metaEl?.getAttribute('content') || '').trim()

    return ok
      ? {
          label: 'DISCOVER',
          message: 'max-image-preview:large present',
          type: 'ok',
          priority: 800,
          name: 'max-image-preview:large',
          details: {
            ...(robotsContent ? { robotsContent } : {}),
            ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(metaEl) } : {}),
            ...(xr ? { xRobotsTag: xr } : {}),
          },
        }
      : {
          label: 'DISCOVER',
          message: 'max-image-preview:large not present (recommended for Google Discover)',
          type: 'warn',
          priority: 400,
          name: 'max-image-preview:large',
          details: { ...(robotsContent ? { robotsContent } : {}), ...(sourceHtml ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(metaEl) } : {}) },
        }
  },
}
