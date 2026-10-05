import { canonicalRows, hrefField, markupReason, resolveUrl, webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { differingComponent } from '@/shared/presentation/comparison'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
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

type NavHop = { url?: string; type?: string }
type NavLedger = { trace: NavHop[] }
const getLedger = (ctx: { globals: Record<string, unknown> }): NavLedger | null => {
  const raw = ctx.globals['navigationLedger']
  if (!raw || typeof raw !== 'object') return null
  const trace = Array.isArray((raw as NavLedger).trace) ? (raw as NavLedger).trace : []
  return trace.length ? { trace } : null
}
// The main-document status chain as one fact ("301 > 200"), never a URL-bearing text blob.
const statusChain = (chain: ReturnType<typeof headerChainToRedirectChain>) =>
  chain ? [textField('Status chain', chain.hops.map((hop) => (hop.status > 0 ? String(hop.status) : 'none')).join(' > '))] : []

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
    const records = elementRecords(element ? [element] : [], element ? 1 : 0, (link) => [hrefField(link, page.url)])
    const base = { detailValues: element ? records.counts : [], evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original canonical markup not retained', 'No canonical link element found') }

    if (!href) {
      return presentResult(canonicalNavConsistencyRule, page, {
        ...base, input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', element ? 'Found without an href' : 'Not found'), ...records.markup], checked: checkedLink,
      })
    }
    const canonicalResolved = resolveUrl(href, page.url)
    if (!canonicalResolved) {
      return presentResult(canonicalNavConsistencyRule, page, {
        ...base, input: 'Static DOM + Page URL', type: 'warn', priority: 200,
        values: [...canonicalRows(href, null), ...records.markup],
        checked: [...checkedLink, textField('Resolution', 'Canonical href resolved against page URL')],
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

    // Both sides of the comparison: the first URL only when navigation moved away from it.
    const values = [...canonicalRows(href, canonicalResolved),
      ...(normFirst === normFinal ? [] : [webUrlField('First URL', firstUrl)]), webUrlField('Final URL', finalUrl)]
    const detailValues = [...base.detailValues, textField('Redirects', redirectCount), textField('Navigation hops', trace.length),
      textField('Redirect hops', chain?.hops.length ?? 0), ...statusChain(chain)]
    const finding = (type: 'ok' | 'warn' | 'info', priority: number, comparison: string) => presentResult(canonicalNavConsistencyRule, page, {
      ...base, input, type, priority, values: [...values, textField('Comparison', comparison), ...records.markup], detailValues, checked,
    })

    if (!redirectCount && normCanonical === normFinal) return finding('ok', 850, 'Equals final URL')
    if (redirectCount > 0 && normCanonical === normFirst && normFinal !== normCanonical) return finding('warn', 180, 'Equals first URL (redirected)')
    // A canonical pointing to a different preferred URL is the documented use
    // case of rel=canonical, not a conflicting signal - report it as info.
    if (normCanonical !== normFinal) return finding('info', 600, `Differs from final URL (${differingComponent(canonicalResolved, finalUrl) ?? 'normalized'})`)
    return finding('ok', 800, 'Equals final URL')
  },
}
