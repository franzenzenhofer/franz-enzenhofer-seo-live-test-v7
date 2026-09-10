import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Canonical HTTPS preference'
const RULE_ID = 'head:canonical-https-preference'

export const canonicalHttpsPreferenceRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Checks whether the declared preferred URL sends an HTTPS page back to HTTP. A canonical URL is a preference for search engines, not a browser redirect. The destination is not fetched here.",
      action: "Correct an invalid or HTTP canonical to the intended HTTPS page in the template or CMS. Verify that the preferred HTTPS page works and represents the same content before changing the declaration.",
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Errors when an HTTPS page declares an HTTP canonical (HTTPS-to-HTTP downgrade); ok otherwise.',
  },
  async run(page) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (linkEl?.getAttribute('href') || '').trim()
    if (!href) {
      return { label: LABEL, name: NAME, message: 'No canonical to check for HTTPS preference.', type: 'info', priority: 900 }
    }
    const resolved = resolvePageWebUrl(href, page)
    if (!resolved) return { label: LABEL, name: NAME, type: 'warn', priority: 120,
      message: 'Canonical href is not a valid HTTP or HTTPS URL.',
      details: { canonicalUrl: href, pageUrl: page.url, sourceHtml: linkEl?.outerHTML } }
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
        },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: 'The declared canonical does not create an HTTPS-to-HTTP downgrade.',
      type: 'ok',
      priority: 800,
      details: { canonicalUrl: resolved, pageUrl: page.url, domPath: linkEl ? getDomPath(linkEl) : undefined },
    }
  },
}
