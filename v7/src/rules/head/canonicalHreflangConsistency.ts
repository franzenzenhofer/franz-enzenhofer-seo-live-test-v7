import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl, isHttps } from '@/shared/url-utils'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'

const LABEL = 'HEAD'
const NAME = 'Canonical hreflang consistency'
const RULE_ID = 'head:canonical-hreflang-consistency'

const SELECTOR = 'link[rel~="alternate" i][hreflang]'

export const canonicalHreflangConsistencyRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/specialty/international/localized-versions',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
    ],
    description: 'Warns when the hreflang cluster omits the canonical URL or when hreflang alternates use HTTP where the canonical is HTTPS.',
  },
  async run(page) {
    const canonicalEl = page.doc.querySelector('link[rel~="canonical" i]')
    const canonicalHref = (canonicalEl?.getAttribute('href') || '').trim()
    if (!canonicalHref) {
      return { label: LABEL, name: NAME, message: 'No canonical link; hreflang consistency not evaluated.', type: 'info', priority: 900 }
    }
    const hreflangEls = page.doc.querySelectorAll<HTMLLinkElement>(SELECTOR)
    if (!hreflangEls.length) {
      return { label: LABEL, name: NAME, message: 'No hreflang cluster present.', type: 'info', priority: 850 }
    }

    let canonicalUrl = ''
    try {
      canonicalUrl = new URL(canonicalHref, page.url).toString()
    } catch {
      return { label: LABEL, name: NAME, message: 'Canonical URL invalid; cannot compare to hreflang.', type: 'warn', priority: 200, details: { canonicalUrl: canonicalHref } }
    }

    const canonicalHttps = isHttps(canonicalUrl)
    const normalizedCanonical = normalizeUrl(canonicalUrl)

    // Alternate URLs do NOT need to share the canonical's domain (Google:
    // "Alternate URLs do not need to be in the same domain"); only HTTP
    // alternates on an HTTPS canonical are flagged.
    let hasCanonicalInCluster = false
    let mismatchCount = 0
    const httpMismatches: Array<{ resolved: string; domPath: string }> = []
    for (let index = 0; index < hreflangEls.length; index++) {
      const element = hreflangEls.item(index)
      if (!element) continue
      try {
        const resolved = new URL((element.getAttribute('href') || '').trim(), page.url).toString()
        if (normalizeUrl(resolved) === normalizedCanonical) hasCanonicalInCluster = true
        const url = new URL(resolved)
        if (!canonicalHttps || url.protocol === 'https:') continue
        mismatchCount++
        if (httpMismatches.length < EVIDENCE_LIMIT) {
          httpMismatches.push({ resolved, domPath: getDomPath(element) })
        }
      } catch {
        /* invalid hrefs are handled by their dedicated rule */
      }
    }

    if (!hasCanonicalInCluster || mismatchCount) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Hreflang cluster is misaligned with canonical URL.',
        type: 'warn',
        priority: 180,
        details: {
          canonicalUrl,
          canonicalInCluster: hasCanonicalInCluster,
          mismatchingHreflang: httpMismatches.map((m) => m.resolved),
          domPaths: httpMismatches.map((m) => m.domPath),
          mismatchCount,
          shown: httpMismatches.length,
          truncated: mismatchCount > httpMismatches.length,
          fix: 'Use HTTPS alternate URLs when the canonical is HTTPS and include the canonical URL in the cluster.',
        },
      }
    }

    return { label: LABEL, name: NAME, message: 'Hreflang cluster aligns with canonical URL.', type: 'ok', priority: 820, details: { canonicalUrl } }
  },
}
