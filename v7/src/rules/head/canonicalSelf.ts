import { normalizeUrl } from '@/shared/url-utils'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'
import type { Rule } from '@/core/types'

const LABEL = 'HEAD'
const NAME = 'Canonical Self-Referential'
const RULE_ID = 'head:canonical-self'
const SELECTOR = 'head > link[rel~="canonical" i]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalSelfRule: Rule = {
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
        message: 'No canonical link found (self-reference check skipped).',
        type: 'info',
        priority: 950,
        details: { reference: SPEC },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    const pageUrlNormalized = normalizeUrl(page.url)
    const canonicalUrlNormalized = normalizeUrl(new URL(href, page.url).toString())
    const isSelfReferential = pageUrlNormalized === canonicalUrlNormalized
    const message = isSelfReferential
      ? `Canonical is self-referential: ${canonicalUrlNormalized}`
      : `Canonical differs from page URL: ${canonicalUrlNormalized} (page: ${pageUrlNormalized})`
    return {
      name: NAME,
      label: LABEL,
      message,
      type: isSelfReferential ? 'info' : 'warn',
      priority: isSelfReferential ? 850 : 400,
      details: {
        sourceHtml,
        snippet: extractSnippet(href),
        domPath: getDomPath(linkEl),
        href,
        pageUrl: page.url,
        pageUrlNormalized,
        canonicalUrlNormalized,
        isSelfReferential,
        reference: SPEC,
      },
    }
  },
}
