import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Canonical HTTPS preference'
const RULE_ID = 'head:canonical-https-preference'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalHttpsPreferenceRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (linkEl?.getAttribute('href') || '').trim()
    if (!href) {
      return { label: LABEL, name: NAME, message: 'No canonical to check for HTTPS preference.', type: 'info', priority: 900, details: { reference: SPEC } }
    }
    const resolved = new URL(href, page.url).toString()
    const pageIsHttps = page.url.startsWith('https://')
    const canonicalIsHttp = resolved.startsWith('http://')
    if (pageIsHttps && canonicalIsHttp) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Canonical downgrades HTTPS to HTTP. Prefer HTTPS canonical.',
        type: 'error',
        priority: 120,
        details: {
          canonicalUrl: resolved,
          pageUrl: page.url,
          snippet: linkEl ? extractSnippet(linkEl.outerHTML) : extractSnippet(resolved),
          domPath: linkEl ? getDomPath(linkEl) : undefined,
          reference: SPEC,
        },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: 'Canonical scheme is acceptable.',
      type: 'ok',
      priority: 800,
      details: { canonicalUrl: resolved, pageUrl: page.url, reference: SPEC, domPath: linkEl ? getDomPath(linkEl) : undefined },
    }
  },
}
