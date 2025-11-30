import { HTTP_STATUS } from '@/shared/http-constants'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const LABEL = 'HEAD'
const NAME = 'Canonical Redirects'
const RULE_ID = 'head:canonical-redirects'
const SELECTOR = 'head > link[rel~="canonical" i]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalRedirectsRule: Rule = {
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
        message: 'Skipped canonical redirect check: no canonical link found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    try {
      const r = await fetch(href, { method: 'HEAD', redirect: 'manual' })
      const status = r.status
      const location = r.headers.get('location')?.trim() || ''
      const isRedirect = status >= HTTP_STATUS.REDIRECT_MIN && status < HTTP_STATUS.REDIRECT_MAX
      const message = isRedirect
        ? `Canonical returns HTTP ${status} redirecting to: ${location || '(no location header)'}`
        : `Canonical returns HTTP ${status}, no redirect.`
      return {
        name: NAME,
        label: LABEL,
        message,
        type: isRedirect ? 'warn' : 'ok',
        priority: isRedirect ? 150 : 800,
        details: {
          sourceHtml,
          snippet: extractSnippet(href),
          domPath: getDomPath(linkEl),
          href,
          status,
          location,
          isRedirect,
          reference: SPEC,
        },
      }
    } catch (e) {
      return {
        name: NAME,
        label: LABEL,
        message: `Canonical URL fetch failed: ${String(e)}`,
        type: 'warn',
        priority: 200,
        details: {
          sourceHtml,
          snippet: extractSnippet(href),
          domPath: getDomPath(linkEl),
          href,
          error: String(e),
          reference: SPEC,
        },
      }
    }
  },
}
