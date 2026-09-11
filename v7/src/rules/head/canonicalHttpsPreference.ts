import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Canonical HTTPS preference'
const RULE_ID = 'head:canonical-https-preference'
const SELECTOR = 'link[rel~="canonical" i]'
const checked = [
  textField('Selector', SELECTOR),
  textField('Selection', 'First matching canonical link'),
  textField('Resolution', 'Canonical href resolved against a declared <base> element, else the page URL'),
  textField('Criterion', 'An HTTPS page must not declare an HTTP canonical'),
]
// Only a value that survives an actual URL parse (with the right scheme) becomes a link.
const safeUrlField = (key: string, value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return urlField(key, value)
  } catch { /* not an absolute, parseable URL */ }
  return textField(key, value)
}

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
    const captured = markupEvidence(link ? [link] : [], 'Canonical link')
    const evidence = captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : []

    // An absent element, a missing href attribute and a present-but-empty href
    // are three different observations; only the last is a genuinely empty value.
    if (!href) {
      const status = !link ? 'Not found' : !hasHrefAttribute ? 'Present, href attribute missing' : 'Present, href empty'
      return presentResult(canonicalHttpsPreferenceRule, page, {
        input: 'Static DOM', type: 'info', priority: 900,
        values: [textField('Canonical link', status)], checked, evidence,
        markup: captured.markup, noMarkup: link ? 'Complete original canonical markup not retained' : 'No canonical link element found',
      })
    }

    // resolvePageWebUrl reads a declared <base href> before falling back to the page
    // URL; retain that element whenever present so its contribution is visible.
    const baseEl = page.doc.querySelector('base[href]')
    const baseCaptured = markupEvidence(baseEl ? [baseEl] : [], 'Base element')
    const evidenceWithBase = [...evidence, ...(baseCaptured.fields.length ? [{ name: 'Base element', fields: baseCaptured.fields }] : [])]
    const markupWithBase = [...captured.markup, ...baseCaptured.markup]
    const input = 'Static DOM + Page URL'
    const resolved = resolvePageWebUrl(href, page)

    if (!resolved) {
      return presentResult(canonicalHttpsPreferenceRule, page, {
        input, type: 'warn', priority: 120,
        values: [textField('Canonical href (observed)', href), textField('URL status', 'Invalid HTTP(S) URL')],
        detailValues: [safeUrlField('Page URL', page.url)], checked,
        evidence: evidenceWithBase, markup: markupWithBase,
        noMarkup: 'Complete original canonical markup not retained',
      })
    }

    const downgrade = page.url.startsWith('https://') && resolved.startsWith('http://')
    return presentResult(canonicalHttpsPreferenceRule, page, {
      input, type: downgrade ? 'error' : 'ok', priority: downgrade ? 120 : 800,
      values: [urlField('Canonical URL', resolved), textField('HTTPS downgrade', downgrade ? 'Detected' : 'Not detected')],
      detailValues: [textField('Canonical href (observed)', href), safeUrlField('Page URL', page.url)], checked,
      evidence: evidenceWithBase, markup: markupWithBase,
      noMarkup: 'Complete original canonical markup not retained',
    })
  },
}
