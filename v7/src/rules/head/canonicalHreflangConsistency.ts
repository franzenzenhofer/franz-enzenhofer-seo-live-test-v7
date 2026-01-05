import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl, isHttps } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical hreflang consistency'
const RULE_ID = 'head:canonical-hreflang-consistency'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'

const SELECTOR = 'link[rel~="alternate" i][hreflang]'

export const canonicalHreflangConsistencyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const canonicalEl = page.doc.querySelector('link[rel~="canonical" i]')
    const canonicalHref = (canonicalEl?.getAttribute('href') || '').trim()
    if (!canonicalHref) {
      return { label: LABEL, name: NAME, message: 'No canonical link; hreflang consistency not evaluated.', type: 'info', priority: 900, details: { reference: SPEC } }
    }
    const hreflangEls = Array.from(page.doc.querySelectorAll(SELECTOR)) as HTMLLinkElement[]
    if (!hreflangEls.length) {
      return { label: LABEL, name: NAME, message: 'No hreflang cluster present.', type: 'info', priority: 850, details: { reference: SPEC } }
    }

    let canonicalUrl = ''
    try {
      canonicalUrl = new URL(canonicalHref, page.url).toString()
    } catch {
      return { label: LABEL, name: NAME, message: 'Canonical URL invalid; cannot compare to hreflang.', type: 'warn', priority: 200, details: { canonicalUrl: canonicalHref, reference: SPEC } }
    }

    const canonicalHost = (() => { try { return new URL(canonicalUrl).host } catch { return '' } })()
    const canonicalHttps = isHttps(canonicalUrl)
    const normalizedCanonical = normalizeUrl(canonicalUrl)

    const hreflangTargets = hreflangEls
      .map((el) => {
        const href = (el.getAttribute('href') || '').trim()
        try {
          const resolved = new URL(href, page.url).toString()
          return { resolved, domPath: getDomPath(el) }
        } catch {
          return null
        }
      })
      .filter((v): v is { resolved: string; domPath: string } => !!v)

    const normalizedTargets = hreflangTargets.map((t) => ({ ...t, normalized: normalizeUrl(t.resolved) }))
    const hasCanonicalInCluster = normalizedTargets.some((t) => t.normalized === normalizedCanonical)
    const protocolHostMismatches = normalizedTargets.filter((t) => {
      try {
        const u = new URL(t.resolved)
        return u.host !== canonicalHost || (canonicalHttps && u.protocol !== 'https:')
      } catch {
        return false
      }
    })

    if (!hasCanonicalInCluster || protocolHostMismatches.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Hreflang cluster is misaligned with canonical URL.',
        type: 'warn',
        priority: 180,
        details: {
          canonicalUrl,
          canonicalInCluster: hasCanonicalInCluster,
          mismatchingHreflang: protocolHostMismatches.map((m) => m.resolved),
          domPaths: protocolHostMismatches.map((m) => m.domPath),
          reference: SPEC,
          fix: 'Ensure hreflang URLs share the canonical host/protocol and include the canonical URL in the cluster.',
        },
      }
    }

    return { label: LABEL, name: NAME, message: 'Hreflang cluster aligns with canonical URL.', type: 'ok', priority: 820, details: { canonicalUrl, reference: SPEC } }
  },
}
