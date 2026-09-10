import { navigationPathSteps } from './navigationPathSteps'

import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule } from '@/core/types'
import { navigationOutcome } from '@/shared/navigationSteps'
import { extractHtml } from '@/shared/html-utils'

const withoutHash = (url: string): string => { const parsed = new URL(url); parsed.hash = ''; return parsed.href }
export const redirectCanonicalChainRule: Rule = {
  id: 'http:redirect-canonical-chain', name: 'Redirects and preferred URL', enabled: true, what: 'http',
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
    let canonicalUrl = '', canonicalMeaning = 'No HTML canonical URL was declared.'
    let invalid = false
    if (href) {
      try {
        canonicalUrl = new URL(href, page.url).href
        if (!/^https?:\/\//i.test(canonicalUrl)) throw new Error('Unsupported canonical scheme')
        canonicalMeaning = withoutHash(canonicalUrl) === withoutHash(finalUrl)
          ? 'The canonical matches the final page URL.' : 'The canonical points to another preferred URL. Confirm that this is the intended duplicate-content relationship.'
      } catch { invalid = true; canonicalMeaning = 'The canonical URL is invalid or uses an unsupported scheme.' }
    }
    return {
      label: 'HTTP', name: 'Redirects and preferred URL', type: invalid ? 'warn' : 'info', priority: invalid ? 250 : 600,
      message: steps.length ? `${redirectCount} server redirect(s), ${clientRedirectCount} page-code redirect(s). ${canonicalMeaning}` : 'No navigation journey was captured.',
      details: {
        ...(steps.length ? { navigationSteps: steps, redirectCount, clientRedirectCount, finalUrl } : {}),
        interpretation: [navigationOutcome(steps), canonicalMeaning].filter(Boolean).join(' '),
        ...(element ? { canonicalDeclaration: { declaredUrl: href || '(empty)', ...(canonicalUrl ? { resolvedUrl: canonicalUrl } : {}), sourceHtml: extractHtml(element) } } : {}),
      },
    }
  },
}
