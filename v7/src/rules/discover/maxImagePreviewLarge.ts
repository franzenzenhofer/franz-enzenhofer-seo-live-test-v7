import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const hasDirective = (s: string, dir: string) => new RegExp(`\\b${dir.replace(/[-]/g, '[-]')}\\b`, 'i').test(s)

export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large',
  name: 'max-image-preview:large',
  enabled: true,
  async run(page) {
    const metaEl = page.doc.querySelector('meta[name="robots"]')
    const meta = (metaEl?.getAttribute('content') || '').toLowerCase()
    const xr = (page.headers?.['x-robots-tag'] || '').toLowerCase()
    const ok = hasDirective(meta, 'max-image-preview:large') || hasDirective(xr, 'max-image-preview:large')
    const sourceHtml = extractHtml(metaEl)

    return ok
      ? {
          label: 'DISCOVER',
          message: 'max-image-preview:large present',
          type: 'ok',
          name: 'maxImagePreviewLarge',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(metaEl),
            xRobotsTag: xr,
          },
        }
      : {
          label: 'DISCOVER',
          message: 'Consider max-image-preview:large',
          type: 'warn',
          name: 'maxImagePreviewLarge',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(metaEl) },
        }
  },
}

