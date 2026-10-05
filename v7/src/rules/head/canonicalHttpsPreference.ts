import { canonicalRows, hrefField, markupReason, webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'

const NAME = 'Canonical HTTPS preference'
const RULE_ID = 'head:canonical-https-preference'
const SELECTOR = 'link[rel~="canonical" i]'
const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'First matching canonical link'),
  textField('Resolution', 'Canonical href resolved against a declared <base> element, else the page URL'),
  textField('Criterion', 'An HTTPS page must not declare an HTTP canonical'),
]
const schemeOf = (url: string) => { try { return new URL(url).protocol } catch { return null } }

export const canonicalHttpsPreferenceRule: Rule = {
  id: RULE_ID, name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    userGuide: {
      check: "Checks whether the declared preferred URL sends an HTTPS page back to HTTP. A canonical URL is a preference for search engines, not a browser redirect. The destination is not fetched here.",
      action: "Correct an invalid or HTTP canonical to the intended HTTPS page in the template or CMS. Verify that the preferred HTTPS page works and represents the same content before changing the declaration.",
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Errors when an HTTPS page declares an HTTP canonical (HTTPS-to-HTTP downgrade); ok otherwise.',
  },
  async run(page) {
    const link = page.doc.querySelector<HTMLLinkElement>(SELECTOR)
    const hasHrefAttribute = !!link?.hasAttribute('href')
    const href = (link?.getAttribute('href') || '').trim()

    // An absent element, a missing href attribute and a present-but-empty href
    // are three different observations; only the last is a genuinely empty value.
    if (!href) {
      const records = elementRecords(link ? [link] : [], link ? 1 : 0, (element) => [hrefField(element, page.url)])
      const status = !link ? 'Not found' : !hasHrefAttribute ? 'Present, href attribute missing' : 'Present, href empty'
      return presentResult(canonicalHttpsPreferenceRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', status), ...records.markup], detailValues: link ? records.counts : [], checked,
        evidence: records.evidence, markup: records.markup,
        noMarkup: markupReason(records, 'Complete original canonical markup not retained', 'No canonical link element found'),
      })
    }

    // resolvePageWebUrl reads a declared <base href> before falling back to the page
    // URL; retain that element whenever present so its contribution is visible.
    const baseEl = page.doc.querySelector('base[href]')
    const elements = baseEl ? [link!, baseEl] : [link!]
    const records = elementRecords(elements, elements.length, (element) => [hrefField(element, page.url)])
    const input = 'Static DOM + Page URL'
    const resolved = resolvePageWebUrl(href, page)
    const base = { detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup, noMarkup: markupReason(records, 'Complete original canonical markup not retained', 'No canonical link element found') }

    if (!resolved) {
      return presentResult(canonicalHttpsPreferenceRule, page, {
        ...base, input, type: 'warn', priority: 120,
        values: [...canonicalRows(href, null, 'Invalid HTTP(S) URL'), ...records.markup],
      })
    }

    const downgrade = page.url.startsWith('https://') && resolved.startsWith('http://')
    const sameScheme = schemeOf(resolved) === schemeOf(page.url)
    return presentResult(canonicalHttpsPreferenceRule, page, {
      ...base, input, type: downgrade ? 'error' : 'ok', priority: downgrade ? 120 : 800,
      values: [...canonicalRows(href, resolved), webUrlField('Current page URL', page.url),
        textField('Comparison', sameScheme ? 'Equals current page URL scheme' : 'Differs from current page URL scheme'), ...records.markup],
    })
  },
}
