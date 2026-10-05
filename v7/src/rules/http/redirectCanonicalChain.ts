import { journeyRows, ledgerTrace, redirectSummary } from './navigationJourneyRows'
import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, httpUrlField, navigationStepEvidence } from './navigationStepEvidence'

import type { Page, Rule } from '@/core/types'
import { differingComponent } from '@/shared/presentation/comparison'
import { recordCounts } from '@/shared/presentation/counts'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'

const SELECTOR = 'link[rel~="canonical" i]'
const withoutHash = (url: string): string => { const parsed = new URL(url); parsed.hash = ''; return parsed.href }
const resolve = (href: string, base: string): string | null => {
  try {
    const url = new URL(href, base).href
    return /^https?:\/\//i.test(url) ? url : null
  } catch { return null }
}
// The raw href is shown only when it is not already the absolute URL shown as Canonical URL (F11).
const hrefRow = (href: string, resolved: string | null): DisplayField[] => href === resolved ? [] : [textField('Canonical href', href)]
const comparisonOf = (canonical: string, target: string, targetName: string): string => {
  if (withoutHash(canonical) === withoutHash(target)) return `Equals ${targetName}`
  return `Differs from ${targetName} (${differingComponent(canonical, target) ?? 'URL'})`
}

/** Canonical rows in doctrine order: href (when relative or invalid), Canonical URL, target URL, Comparison. */
const canonicalRows = (page: Page, element: Element | null, target: DisplayField, targetName: string): { rows: DisplayField[]; invalid: boolean } => {
  if (!element) return { rows: [target, textField('Canonical link', 'Not found')], invalid: false }
  const href = (element.getAttribute('href') || '').trim()
  if (!href) return { rows: [target, textField('Canonical href', 'Not declared')], invalid: false }
  const canonical = resolve(href, page.url)
  if (!canonical) return { rows: [textField('Canonical href', href), textField('Canonical URL', 'Invalid URL'), target], invalid: true }
  // A comparison needs both sides as URLs (F2); a non-HTTP page URL leaves only the canonical fact.
  const comparison = target.kind === 'url' ? [textField('Comparison', comparisonOf(canonical, target.value, targetName))] : []
  return { rows: [...hrefRow(href, canonical), urlField('Canonical URL', canonical), target, ...comparison], invalid: false }
}

export const redirectCanonicalChainRule: Rule = {
  id: 'http:redirect-canonical-chain', name: 'Redirects and preferred URL', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'general',
    references: ['https://developers.google.com/search/docs/crawling-indexing/301-redirects', 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Shows one named navigation timeline followed by the HTML canonical declaration, without duplicate trace and header dumps.',
    userGuide: {
      check: 'Shows the observed journey and the preferred URL declared by the landing page’s HTML canonical tag. History updates are separate from HTTP redirects. A canonical is a search preference, not a navigation instruction.',
      action: 'Correct the invalid canonical href in the page template or SEO plugin, using the intended preferred page URL.',
    },
  },
  async run(page, ctx) {
    const trace = ledgerTrace(ctx.globals)
    const steps = navigationPathSteps(page, trace ?? [])
    const server = steps.filter((step) => step.type === 'http_redirect').length
    const client = steps.filter((step) => step.type === 'client_redirect').length
    // The canonical is compared with where the navigation ended; without a journey, with the page URL itself.
    const finalRow = journeyRows(steps).at(-1)
    const target = finalRow ?? httpUrlField('Current page URL', page.url)
    const targetName = finalRow ? 'final URL' : 'current page URL'

    const element = page.doc.querySelector(SELECTOR)
    const { rows, invalid } = canonicalRows(page, element, target, targetName)
    const elements = element ? [element] : []
    const records = elementRecords(elements, elements.length, (link) => {
      const href = (link.getAttribute('href') || '').trim()
      const canonical = resolve(href, page.url)
      return [canonical ? urlField('href', canonical) : textField('href', href || 'Not declared')]
    })
    const hops = navigationStepEvidence(steps, page.headerChain)
    const evidence = [...hops, ...records.evidence]

    return presentResult(redirectCanonicalChainRule, page, {
      input: combineInputs(!!trace && 'Navigation events', (page.headerChain?.length ?? 0) > 0 && 'Main-document HTTP response', 'Static DOM'),
      type: invalid ? 'warn' : 'info', priority: invalid ? 250 : 600,
      values: [...(steps.length ? [textField('Redirects', redirectSummary(server, client))] : []), ...rows, ...records.markup],
      // Records are the navigation hops plus the canonical link; only the link carries markup.
      detailValues: recordCounts({ found: steps.length + (element ? 1 : 0), markup: records.markup.length, evidence: evidence.length }),
      checked: [
        textField('Selector', SELECTOR),
        textField('Selection', 'First matching element'),
        textField('Navigation source', 'Recorded navigation ledger and main-document response events'),
        textField('Criterion', 'A declared canonical href resolves to an HTTP(S) URL'),
        textField('Comparison basis', 'Canonical URL vs final navigated URL, fragment ignored; reported, not graded'),
        textField('Records', 'One per navigation hop (HTTP responses, no markup) plus the canonical link element'),
      ],
      evidence,
      markup: records.markup,
      noMarkup: element ? 'Not retained: complete original canonical link markup not captured' : 'Not retained: no canonical link element found; navigation hops carry no markup',
    })
  },
}
