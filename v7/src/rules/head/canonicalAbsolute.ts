import { isAbsoluteUrl } from '@/shared/url-utils'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const LABEL = 'HEAD'
const NAME = 'Canonical Absolute URL'
const RULE_ID = 'head:canonical-absolute'
const SELECTOR = 'head > link[rel~="canonical" i]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalAbsoluteRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector(SELECTOR)
    const href = linkEl?.getAttribute('href')?.trim() || ''
    const hasCanonical = Boolean(linkEl)
    const hasHref = Boolean(href)
    if (!hasCanonical || !hasHref) {
      return {
        name: NAME,
        label: LABEL,
        message: 'No canonical to check for absolute URL.',
        type: 'info',
        priority: 950,
        details: { reference: SPEC },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    try {
      new URL(href, page.url)
      const isAbsolute = isAbsoluteUrl(href)
      const message = isAbsolute ? `Canonical URL is absolute: ${href}` : `Canonical URL is relative: ${href}`
      return {
        name: NAME,
        label: LABEL,
        message,
        type: isAbsolute ? 'ok' : 'warn',
        priority: isAbsolute ? 800 : 200,
        details: {
          sourceHtml,
          snippet: extractSnippet(href),
          domPath: getDomPath(linkEl),
          href,
          isAbsolute,
          reference: SPEC,
        },
      }
    } catch {
      return {
        name: NAME,
        label: LABEL,
        message: `Invalid canonical URL: ${href}`,
        type: 'warn',
        priority: 100,
        details: {
          sourceHtml,
          snippet: extractSnippet(href),
          domPath: getDomPath(linkEl),
          href,
          isAbsolute: false,
          reference: SPEC,
        },
      }
    }
  },
}
