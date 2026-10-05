import { canonicalRows, hrefField, hreflangOf, markupReason, overviewMarkup, resolveUrl } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { isHttps, normalizeUrl } from '@/shared/url-utils'
import { listRow } from '@/shared/presentation/listRow'

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
// Markup retention must show the offending (non-HTTPS) alternates first, not
// merely the first EVIDENCE_LIMIT elements in DOM order.
const retainedSample = (all: Element[], priority: Element[]) => {
  const prioritySet = new Set(priority)
  const rest = all.filter((element) => !prioritySet.has(element))
  return [...priority.slice(0, EVIDENCE_LIMIT), ...rest].slice(0, EVIDENCE_LIMIT)
}
const schemeOf = (url: string) => { try { return new URL(url).protocol } catch { return null } }

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
    const canonicalRecords = elementRecords(canonicalEl ? [canonicalEl] : [], canonicalEl ? 1 : 0, (element) => [hrefField(element, page.url)])
    const canonicalBase = { detailValues: canonicalEl ? canonicalRecords.counts : [], evidence: canonicalRecords.evidence, markup: canonicalRecords.markup,
      noMarkup: markupReason(canonicalRecords, 'Complete original canonical markup not retained', 'No canonical link element found') }
    if (!canonicalHref) {
      const status = !canonicalEl ? 'Not found' : canonicalEl.hasAttribute('href') ? 'Found with an empty href' : 'Found without an href attribute'
      return presentResult(canonicalHreflangConsistencyRule, page, {
        ...canonicalBase, input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', status), ...canonicalRecords.markup], checked,
      })
    }

    const hreflangEls = Array.from(page.doc.querySelectorAll<HTMLLinkElement>(HREFLANG_SELECTOR))
    const canonicalUrl = resolveUrl(canonicalHref, page.url)
    if (!hreflangEls.length) {
      return presentResult(canonicalHreflangConsistencyRule, page, {
        ...canonicalBase, input: 'Static DOM', type: 'info', priority: 850,
        values: [...canonicalRows(canonicalHref, canonicalUrl), textField('Hreflang links', 0), ...canonicalRecords.markup], checked,
        noMarkup: 'No hreflang links found',
      })
    }
    if (!canonicalUrl) {
      return presentResult(canonicalHreflangConsistencyRule, page, {
        ...canonicalBase, input: 'Static DOM + Page URL', type: 'warn', priority: 200,
        values: [...canonicalRows(canonicalHref, null), ...canonicalRecords.markup], checked,
      })
    }

    const canonicalHttps = isHttps(canonicalUrl)
    const normalizedCanonical = normalizeUrl(canonicalUrl)

    // Alternate URLs do NOT need to share the canonical's domain (Google:
    // "Alternate URLs do not need to be in the same domain"); the algorithm
    // flags every alternate whose scheme is not https under an https
    // canonical, not only http:// ones specifically.
    const inCluster: string[] = []
    const mismatches: HTMLLinkElement[] = []
    for (const element of hreflangEls) {
      try {
        const resolved = new URL((element.getAttribute('href') || '').trim(), page.url).toString()
        if (normalizeUrl(resolved) === normalizedCanonical) inCluster.push(hreflangOf(element) || 'Not declared')
        const url = new URL(resolved)
        if (!canonicalHttps || url.protocol === 'https:') continue
        mismatches.push(element)
      } catch { /* invalid hrefs are handled by their dedicated rule */ }
    }

    const mismatchSet = new Set<Element>(mismatches)
    const alternates = retainedSample(hreflangEls, mismatches)
    const records = elementRecords([canonicalEl!, ...alternates], 1 + hreflangEls.length, (element) => [
      ...(element === canonicalEl ? [] : [textField('hreflang', hreflangOf(element) || 'Not declared')]),
      hrefField(element, page.url),
      ...(mismatchSet.has(element) ? [textField('Scheme', schemeOf(new URL((element.getAttribute('href') || '').trim(), page.url).href) || 'Invalid URL')] : []),
    ])
    const misaligned = !inCluster.length || mismatches.length > 0

    return presentResult(canonicalHreflangConsistencyRule, page, {
      input: 'Static DOM + Page URL', type: misaligned ? 'warn' : 'ok', priority: misaligned ? 180 : 820,
      values: [...canonicalRows(canonicalHref, canonicalUrl), textField('Hreflang links', hreflangEls.length),
        textField('Canonical in cluster', inCluster.length ? listRow([...new Set(inCluster)]) : 'Not found'),
        textField('Non-HTTPS alternates', mismatches.length), ...overviewMarkup(records.markup)],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original canonical and hreflang markup not retained', 'No canonical link element found'),
    })
  },
}
