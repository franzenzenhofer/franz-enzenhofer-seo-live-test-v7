import type { Rule } from '@/core/types'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import { httpStatusLabel } from '@/shared/httpStatusLabel'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { headerChainToRedirectChain } from '@/shared/redirectChainFromEvents'
import { normalizeUrl } from '@/shared/url-utils'

const NAME = 'Canonical vs navigation'
const RULE_ID = 'head:canonical-nav-consistency'
const SELECTOR = 'link[rel~="canonical" i]'
const checkedLink = [textField('Selector', SELECTOR), textField('Selection', 'First matching canonical link')]
const checked = [
  ...checkedLink,
  textField('Navigation sources', 'Navigation ledger and main-document redirect events'),
  textField('URL comparison', 'Normalized canonical, first, and final URLs'),
  textField('Criterion', 'Canonical should not equal a URL that redirected; a different preferred URL is informational'),
]
const safeUrlField = (key: string, value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return urlField(key, value)
  } catch { /* not an absolute, parseable URL */ }
  return textField(key, value)
}

type NavHop = { url?: string; type?: string }
type NavLedger = { trace: NavHop[] }
const getLedger = (ctx: { globals: Record<string, unknown> }): NavLedger | null => {
  const raw = ctx.globals['navigationLedger']
  if (!raw || typeof raw !== 'object') return null
  const trace = Array.isArray((raw as NavLedger).trace) ? (raw as NavLedger).trace : []
  return trace.length ? { trace } : null
}
// Bounded, individually named records - one per navigation/redirect hop -
// instead of one unbounded formatted text blob that the storage bound would drop whole.
const traceEvidence = (trace: NavHop[]) => {
  const shown = trace.slice(0, EVIDENCE_LIMIT)
  return shown.map((hop, index) => ({ name: `Navigation hop ${index + 1}`, fields: [
    textField('Type', hop.type || 'Not captured'), safeUrlField('URL', hop.url || 'Not captured'),
  ] }))
}
const redirectEvidence = (chain: ReturnType<typeof headerChainToRedirectChain>) => {
  if (!chain) return []
  const shown = chain.hops.slice(0, EVIDENCE_LIMIT)
  return shown.map((hop, index) => ({ name: `Redirect hop ${index + 1}`, fields: [
    safeUrlField('URL', hop.url), textField('Status', httpStatusLabel(hop.status || undefined)),
    ...(hop.location ? [safeUrlField('Location', hop.location)] : []),
  ] }))
}

export const canonicalNavConsistencyRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/http-network-errors',
    ],
    description: 'Compares the canonical URL to the observed navigation/redirect chain: warns when the canonical equals a URL that redirected, informs when the canonical points elsewhere.',
  },
  async run(page, ctx) {
    const element = page.doc.querySelector(SELECTOR)
    const href = (element?.getAttribute('href') || '').trim()
    const captured = markupEvidence(element ? [element] : [], 'Canonical link')
    const sourceEvidence = captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : []

    if (!href) {
      return presentResult(canonicalNavConsistencyRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', element ? 'Found without an href' : 'Not found')], checked: checkedLink,
        evidence: sourceEvidence, markup: captured.markup,
        noMarkup: element ? 'Complete original canonical markup not retained' : 'No canonical link element found',
      })
    }
    let canonicalResolved = ''
    try {
      canonicalResolved = new URL(href, page.url).toString()
    } catch {
      return presentResult(canonicalNavConsistencyRule, page, {
        input: 'Static DOM + Page URL', type: 'warn', priority: 200,
        values: [textField('Canonical href (observed)', href), textField('URL status', 'Invalid URL')],
        checked: [...checkedLink, textField('Resolution', 'Canonical href resolved against page URL')],
        evidence: sourceEvidence, markup: captured.markup, noMarkup: 'Complete original canonical markup not retained',
      })
    }

    const ledger = getLedger(ctx)
    const trace = ledger?.trace || []
    const firstUrl = trace[0]?.url || page.firstUrl || page.url
    const finalUrl = trace[trace.length - 1]?.url || page.lastUrl || page.url
    const redirectCount = trace.filter((hop) => hop.type === 'http_redirect' || hop.type === 'client_redirect').length
    const chain = headerChainToRedirectChain(page.headerChain, page.status)
    const navCaptured = trace.length > 0 || Boolean(page.firstUrl || page.lastUrl) || (page.headerChain?.length ?? 0) > 0
    const input = ['Static DOM', 'Page URL', ...(navCaptured ? ['Navigation events'] : [])].join(' + ')

    const normCanonical = normalizeUrl(canonicalResolved)
    const normFinal = normalizeUrl(finalUrl || '')
    const normFirst = normalizeUrl(firstUrl || '')

    const values = [safeUrlField('Canonical URL', canonicalResolved), safeUrlField('First navigation URL', firstUrl),
      safeUrlField('Final navigation URL', finalUrl), textField('Redirect count', redirectCount)]
    const redirectHops = chain?.hops.length ?? 0
    const detailValues = [safeUrlField('Normalized canonical URL', normCanonical), safeUrlField('Normalized final URL', normFinal),
      textField('Navigation hops', trace.length), textField('Navigation hops omitted', Math.max(trace.length - EVIDENCE_LIMIT, 0)),
      textField('Redirect hops', redirectHops), textField('Redirect hops omitted', Math.max(redirectHops - EVIDENCE_LIMIT, 0))]
    const evidence = [...sourceEvidence, ...traceEvidence(trace), ...redirectEvidence(chain)]
    const markup = captured.markup
    const noMarkup = 'Complete original canonical markup not retained'

    if (!redirectCount && normCanonical === normFinal) {
      return presentResult(canonicalNavConsistencyRule, page, {
        input, type: 'ok', priority: 850, values: [...values, textField('Navigation comparison', 'Aligns with final URL')],
        detailValues, checked, evidence, markup, noMarkup,
      })
    }
    if (redirectCount > 0 && normCanonical === normFirst && normFinal !== normCanonical) {
      return presentResult(canonicalNavConsistencyRule, page, {
        input, type: 'warn', priority: 180, values: [...values, textField('Navigation comparison', 'Equals a URL that redirected')],
        detailValues: [...detailValues, safeUrlField('Normalized first URL', normFirst)], checked, evidence, markup, noMarkup,
      })
    }
    // A canonical pointing to a different preferred URL is the documented use
    // case of rel=canonical, not a conflicting signal - report it as info.
    if (normCanonical !== normFinal) {
      return presentResult(canonicalNavConsistencyRule, page, {
        input, type: 'info', priority: 600, values: [...values, textField('Navigation comparison', 'Points to a different URL than the final URL')],
        detailValues, checked, evidence, markup, noMarkup,
      })
    }
    return presentResult(canonicalNavConsistencyRule, page, {
      input, type: 'ok', priority: 800, values: [...values, textField('Navigation comparison', 'Aligns with navigation')],
      detailValues, checked, evidence, markup, noMarkup,
    })
  },
}
