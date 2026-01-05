import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Canonical tracking params'
const RULE_ID = 'head:canonical-tracking-params'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

const BAD_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'pk_campaign',
  'pk_kwd',
  'oly_anon_id',
  'oly_enc_id',
  'mkt_tok',
  'icid',
]

export const canonicalTrackingParamsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page, ctx) {
    const linkEl = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (linkEl?.getAttribute('href') || '').trim()
    if (!href) {
      return { label: LABEL, name: NAME, message: 'No canonical link to inspect for tracking parameters.', type: 'info', priority: 850, details: { reference: SPEC } }
    }
    const extraParams = Array.isArray((ctx.globals as { variables?: { canonicalTrackingParamsExtra?: unknown } }).variables?.canonicalTrackingParamsExtra)
      ? ((ctx.globals as { variables?: { canonicalTrackingParamsExtra?: unknown } }).variables?.canonicalTrackingParamsExtra as string[])
      : []
    const paramList = Array.from(new Set([...BAD_PARAMS, ...extraParams.map((p) => String(p))]))
    try {
      const resolved = new URL(href, page.url)
      const protocol = resolved.protocol.toLowerCase()
      if (protocol !== 'http:' && protocol !== 'https:') {
        return { label: LABEL, name: NAME, message: 'Canonical URL uses a non-HTTP scheme; use an http(s) URL.', type: 'warn', priority: 200, details: { canonicalUrl: resolved.toString(), reference: SPEC } }
      }
      const params = resolved.searchParams
      const offenders = paramList.filter((p) => params.has(p))
      if (!offenders.length) {
        return { label: LABEL, name: NAME, message: 'Canonical URL has no tracking parameters.', type: 'ok', priority: 800, details: { reference: SPEC } }
      }
      return {
        label: LABEL,
        name: NAME,
        message: `Canonical URL contains tracking parameters: ${offenders.join(', ')}. Remove tracking from canonical.`,
        type: 'warn',
        priority: 180,
        details: {
          canonicalUrl: resolved.toString(),
          offendingParams: offenders,
          snippet: extractSnippet(resolved.toString()),
          domPath: linkEl ? getDomPath(linkEl) : undefined,
          reference: SPEC,
        },
      }
    } catch {
      return { label: LABEL, name: NAME, message: 'Canonical URL invalid; cannot inspect tracking parameters.', type: 'warn', priority: 200, details: { canonicalUrl: href, reference: SPEC } }
    }
  },
}
