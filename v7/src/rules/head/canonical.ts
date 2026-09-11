import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { isAbsoluteUrl, normalizeUrl } from '@/shared/url-utils'

const NAME = 'Canonical Link'
const SELECTOR = 'link[rel~="canonical" i]'
const checked = [
  textField('Selector', SELECTOR), textField('Selection', 'All canonical links; first link when exactly one exists'),
  textField('Placement criterion', 'Canonical link is inside head'), textField('Href criterion', 'Non-empty absolute HTTP(S) URL without a fragment'),
  textField('Self-reference comparison', 'Normalized URL comparison retains query parameters'),
]
// A raw href is a URL only when it already carries an HTTP(S) scheme; relative
// or empty values stay plain text so we never render a broken link.
const hrefField = (key: string, value: string) => (/^https?:\/\//i.test(value) ? urlField(key, value) : textField(key, value))

// Self-reference comparison must keep the query string: parameters can change
// content (Google url-structure guidance), so /a?x=1 vs /a?x=2 is NOT a self
// reference even though the shared normalizeUrl equates them.
export const canonicalRule: Rule = {
  id: 'head-canonical', name: NAME, presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://www.rfc-editor.org/rfc/rfc6596',
      'https://developers.google.com/search/docs/crawling-indexing/url-structure',
    ],
    description: 'Checks the rel=canonical link element: presence, uniqueness, in-<head> placement, non-empty href, no fragment, absolute URL, and whether it self-references the page URL.',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll<HTMLLinkElement>(SELECTOR))
    const captured = markupEvidence(elements.sample, 'Canonical link')
    const evidence = captured.fields.length
      ? [{ name: 'Source locations', fields: [
        textField('Elements retained', elements.shown), textField('Elements omitted', elements.total - elements.shown), ...captured.fields,
      ] }]
      : []
    const noMarkup = elements.total ? 'Complete original canonical markup not retained' : 'No matching canonical link element found'

    if (elements.total === 0) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'warn', priority: 400,
        values: [textField('Canonical links', 0)], checked, noMarkup,
      })
    }

    const hrefs = elements.sample.map((element) => (element.getAttribute('href') || '').trim())
    if (elements.total > 1) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'error', priority: 200,
        values: [textField('Canonical links', elements.total), ...hrefs.map((href, index) => hrefField(`Canonical href ${index + 1}`, href || 'Empty'))],
        checked, evidence, markup: captured.markup, noMarkup,
      })
    }

    const element = elements.sample[0]!
    const href = hrefs[0] || ''
    const baseValues = [textField('Canonical links', 1), hrefField('Canonical href (observed)', href || 'Empty')]

    if (!element.closest('head')) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'warn', priority: 250, values: baseValues, checked,
        detailValues: [textField('Placement', 'Outside head')], evidence, markup: captured.markup, noMarkup,
      })
    }
    if (!href) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'warn', priority: 300, values: baseValues, checked,
        detailValues: [textField('Placement', 'Inside head')], evidence, markup: captured.markup, noMarkup,
      })
    }
    if (href.includes('#')) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'warn', priority: 250, values: baseValues, checked,
        detailValues: [textField('Fragment', 'Present')], evidence, markup: captured.markup, noMarkup,
      })
    }

    try {
      const resolvedUrl = new URL(href, page.url).toString()
      const isAbsolute = isAbsoluteUrl(href)
      const normalizedPageUrl = normalizeUrl(page.url)
      const normalizedCanonicalUrl = normalizeUrl(resolvedUrl)
      const matchesPageUrl = normalizedPageUrl === normalizedCanonicalUrl
      const type = isAbsolute && matchesPageUrl ? 'ok' : 'warn'
      const priority = isAbsolute && matchesPageUrl ? 850 : !isAbsolute ? 300 : 500
      const comparison = !isAbsolute
        ? 'Canonical is relative'
        : matchesPageUrl ? 'Canonical self-references the current URL' : 'Canonical points to a different URL'

      return presentResult(canonicalRule, page, {
        input: 'Static DOM + Page URL', type, priority,
        values: [...baseValues, urlField('Resolved canonical URL', resolvedUrl),
          textField('Absolute URL', isAbsolute ? 'Yes' : 'No'), textField('Self-reference', matchesPageUrl ? 'Yes' : 'No'),
          textField('Comparison', comparison)],
        detailValues: [textField('Normalized page URL', normalizedPageUrl), textField('Normalized canonical URL', normalizedCanonicalUrl)],
        checked, evidence, markup: captured.markup, noMarkup,
      })
    } catch {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM + Page URL', type: 'warn', priority: 150,
        values: [...baseValues, textField('URL status', 'Invalid URL')], checked, evidence, markup: captured.markup, noMarkup,
      })
    }
  },
}
