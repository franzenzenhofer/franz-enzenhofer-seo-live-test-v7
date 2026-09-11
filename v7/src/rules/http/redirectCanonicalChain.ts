import { navigationPathSteps } from './navigationPathSteps'
import { combineInputs, httpUrlField, navigationStepEvidence } from './navigationStepEvidence'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const withoutHash = (url: string): string => { const parsed = new URL(url); parsed.hash = ''; return parsed.href }

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
    const ledger = NavigationLedgerSchema.safeParse(ctx.globals['navigationLedger'])
    const steps = navigationPathSteps(page, ledger.success ? ledger.data.trace : [])
    const finalUrl = steps.at(-1)?.url || page.url
    const redirectCount = steps.filter((step) => step.type === 'http_redirect').length
    const clientRedirectCount = steps.filter((step) => step.type === 'client_redirect').length

    const element = page.doc.querySelector('link[rel~="canonical" i]')
    const href = (element?.getAttribute('href') || '').trim()
    const captured = markupEvidence(element ? [element] : [], 'Canonical link markup')
    let canonicalUrl = '', invalid = false, state = 'Not declared'
    if (href) {
      try {
        canonicalUrl = new URL(href, page.url).href
        if (!/^https?:\/\//i.test(canonicalUrl)) throw new Error('Unsupported canonical scheme')
        state = withoutHash(canonicalUrl) === withoutHash(finalUrl) ? 'Matches final URL' : 'Points to another preferred URL'
      } catch { invalid = true; state = 'Invalid or unsupported scheme' }
    }

    return presentResult(redirectCanonicalChainRule, page, {
      input: combineInputs(ledger.success && 'Navigation events', (page.headerChain?.length ?? 0) > 0 && 'Main-document HTTP response', 'Static DOM'),
      type: invalid ? 'warn' : 'info', priority: invalid ? 250 : 600,
      values: [
        ...(steps.length ? [textField('Server redirects', redirectCount), textField('Client-side redirects', clientRedirectCount)] : [textField('Navigation journey', 'Not captured')]),
        textField('Canonical URL', state),
      ],
      detailValues: [
        httpUrlField(steps.length ? 'Final URL' : 'Compared URL (page URL)', finalUrl),
        textField('Declared canonical href', href || 'Not declared'),
        ...(canonicalUrl ? [httpUrlField('Resolved canonical URL', canonicalUrl)] : []),
      ],
      checked: [
        textField('Selector', 'link[rel~="canonical" i]'),
        textField('Selection', 'First matching element'),
        textField('Navigation source', 'Recorded navigation ledger and main-document response events'),
        textField('Criterion', 'A declared canonical href resolves to an HTTP(S) URL'),
        textField('Comparison', 'Resolved canonical URL vs final navigated URL, fragment ignored (reported, not graded)'),
      ],
      evidence: [
        ...navigationStepEvidence(steps, page.headerChain),
        ...(captured.fields.length ? [{ name: 'Canonical element location', fields: captured.fields }] : []),
      ],
      markup: captured.markup,
      noMarkup: element ? 'Complete original canonical link markup not retained' : 'No canonical link element found',
    })
  },
}
