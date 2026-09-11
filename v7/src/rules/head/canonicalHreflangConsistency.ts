import type { Rule } from '@/core/types'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { isHttps, normalizeUrl } from '@/shared/url-utils'

const NAME = 'Canonical hreflang consistency'
const RULE_ID = 'head:canonical-hreflang-consistency'
const CANONICAL_SELECTOR = 'link[rel~="canonical" i]'
const HREFLANG_SELECTOR = 'link[rel~="alternate" i][hreflang]'
const checked = [
  textField('Canonical selector', CANONICAL_SELECTOR), textField('Hreflang selector', HREFLANG_SELECTOR),
  textField('Selection', 'First canonical link and all matching hreflang links'),
  textField('URL comparison', 'Both URLs resolved against the page URL, then fragment removed, a trailing /index.html or /index.htm (any case) replaced by /, a trailing slash removed from non-root paths, hostname lowercased; scheme, non-default port and query kept'),
  textField('Criterion', 'Canonical URL occurs in the cluster and an HTTPS canonical has no non-HTTPS alternates'),
]
const safeUrlField = (key: string, value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return urlField(key, value)
  } catch { /* not an absolute, parseable URL */ }
  return textField(key, value)
}
// Markup retention must show the offending (non-HTTPS) alternates first, not
// merely the first EVIDENCE_LIMIT elements in DOM order.
const retainedSample = (all: Element[], priority: Element[]) => {
  const prioritySet = new Set(priority)
  const rest = all.filter((element) => !prioritySet.has(element))
  const sample = [...priority.slice(0, EVIDENCE_LIMIT), ...rest].slice(0, EVIDENCE_LIMIT)
  return { sample, total: all.length, shown: sample.length }
}

export const canonicalHreflangConsistencyRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/specialty/international/localized-versions',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
    ],
    description: 'Warns when the hreflang cluster omits the canonical URL or when hreflang alternates use HTTP where the canonical is HTTPS.',
  },
  async run(page) {
    const canonicalEl = page.doc.querySelector(CANONICAL_SELECTOR)
    const canonicalHref = (canonicalEl?.getAttribute('href') || '').trim()
    if (!canonicalHref) {
      const captured = markupEvidence(canonicalEl ? [canonicalEl] : [], 'Canonical link')
      const evidence = captured.fields.length ? [{ name: 'Capture', fields: captured.fields }] : []
      return presentResult(canonicalHreflangConsistencyRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', !canonicalEl ? 'Not found' : canonicalEl.hasAttribute('href') ? 'Found with an empty href' : 'Found without an href attribute')], checked,
        evidence, markup: captured.markup,
        noMarkup: canonicalEl ? 'Complete original canonical markup not retained' : 'No canonical link element found',
      })
    }

    const hreflangEls = Array.from(page.doc.querySelectorAll<HTMLLinkElement>(HREFLANG_SELECTOR))
    if (!hreflangEls.length) {
      const captured = markupEvidence(canonicalEl ? [canonicalEl] : [], 'Canonical link')
      return presentResult(canonicalHreflangConsistencyRule, page, {
        input: 'Static DOM', type: 'info', priority: 850,
        values: [textField('Canonical href (observed)', canonicalHref), textField('Hreflang links', 0)], checked,
        evidence: [{ name: 'Capture', fields: captured.fields }], markup: captured.markup,
        noMarkup: 'No hreflang links found',
      })
    }

    let canonicalUrl = ''
    try {
      canonicalUrl = new URL(canonicalHref, page.url).toString()
    } catch {
      const captured = markupEvidence(canonicalEl ? [canonicalEl] : [], 'Canonical link')
      return presentResult(canonicalHreflangConsistencyRule, page, {
        input: 'Static DOM + Page URL', type: 'warn', priority: 200,
        values: [textField('Canonical href (observed)', canonicalHref), textField('URL status', 'Invalid URL')], checked,
        evidence: [{ name: 'Capture', fields: captured.fields }], markup: captured.markup,
        noMarkup: 'Complete original canonical markup not retained',
      })
    }

    const canonicalHttps = isHttps(canonicalUrl)
    const normalizedCanonical = normalizeUrl(canonicalUrl)

    // Alternate URLs do NOT need to share the canonical's domain (Google:
    // "Alternate URLs do not need to be in the same domain"); the algorithm
    // flags every alternate whose scheme is not https under an https
    // canonical, not only http:// ones specifically.
    let hasCanonicalInCluster = false
    let mismatchCount = 0
    const mismatches: Array<{ resolved: string; element: HTMLLinkElement }> = []
    for (const element of hreflangEls) {
      try {
        const resolved = new URL((element.getAttribute('href') || '').trim(), page.url).toString()
        if (normalizeUrl(resolved) === normalizedCanonical) hasCanonicalInCluster = true
        const url = new URL(resolved)
        if (!canonicalHttps || url.protocol === 'https:') continue
        mismatchCount++
        if (mismatches.length < EVIDENCE_LIMIT) mismatches.push({ resolved, element })
      } catch { /* invalid hrefs are handled by their dedicated rule */ }
    }

    const alternates = retainedSample(hreflangEls, mismatches.map((m) => m.element))
    const captured = markupEvidence(canonicalEl ? [canonicalEl, ...alternates.sample] : alternates.sample, 'Canonical and hreflang')
    const mismatchEvidence = mismatches.map(({ resolved, element }, index) => ({ name: `Non-HTTPS alternate ${index + 1}`, fields: [
      textField('Language', element.getAttribute('hreflang') || 'Not declared'), safeUrlField('Resolved URL', resolved), textField('DOM path', captured.selectors[index + (canonicalEl ? 1 : 0)] || 'Not captured'),
    ] }))
    const misaligned = !hasCanonicalInCluster || mismatchCount > 0

    return presentResult(canonicalHreflangConsistencyRule, page, {
      input: 'Static DOM + Page URL', type: misaligned ? 'warn' : 'ok', priority: misaligned ? 180 : 820,
      values: [safeUrlField('Canonical URL', canonicalUrl), textField('Hreflang links', hreflangEls.length),
        textField('Canonical in cluster', hasCanonicalInCluster ? 'Found' : 'Not found'), textField('Non-HTTPS alternates', mismatchCount),
        textField('Cluster status', misaligned ? 'Misaligned' : 'Aligned')],
      detailValues: [textField('Hreflang elements retained', alternates.shown), textField('Hreflang elements omitted', alternates.total - alternates.shown),
        textField('Non-HTTPS alternates retained', mismatches.length), textField('Non-HTTPS alternates omitted', mismatchCount - mismatches.length)],
      checked, evidence: [{ name: 'Capture', fields: captured.fields }, ...mismatchEvidence], markup: captured.markup,
      noMarkup: 'Complete original canonical and hreflang markup not retained',
    })
  },
}
