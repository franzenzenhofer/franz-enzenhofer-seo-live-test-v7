import type { Page, Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { differingComponent } from '@/shared/presentation/comparison'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { isAbsoluteUrl, normalizeUrl } from '@/shared/url-utils'

const SELECTOR = 'link[rel~="canonical" i]'
const OVERVIEW_MARKUP_LIMIT = 3
const checked = [
  textField('Selector', SELECTOR), textField('Selection', 'All canonical links'),
  textField('Placement criterion', 'Canonical link is inside head'), textField('Href criterion', 'Non-empty absolute HTTP(S) URL without a fragment'),
  textField('Normalization', 'Fragment and index.html removed, trailing slash and host case ignored, query kept'),
]
const hrefOf = (element: Element) => (element.getAttribute('href') || '').trim()
const resolve = (href: string, base: string) => { try { return new URL(href, base).href } catch { return null } }
// The raw href is shown only when it is not already the absolute URL shown as Canonical URL (F11).
const hrefRow = (href: string, resolved: string | null): DisplayField[] => href === resolved ? [] : [textField('Canonical href', href || 'Empty')]
const urlRow = (key: string, resolved: string | null) => resolved ? urlField(key, resolved) : textField(key, 'Invalid URL')

// Self-reference keeps the query string: parameters can change content (Google url-structure
// guidance), so /a?x=1 vs /a?x=2 is NOT a self-reference even after normalization.
const comparisonOf = (href: string, resolved: string, pageUrl: string) => {
  const same = normalizeUrl(resolved) === normalizeUrl(pageUrl)
  const verdict = same ? 'equals current page URL' : `differs from current page URL (${differingComponent(resolved, pageUrl) ?? 'normalized'})`
  return { same, value: isAbsoluteUrl(href) ? verdict.charAt(0).toUpperCase() + verdict.slice(1) : `Relative href, ${verdict}` }
}

const present = (page: Page, elements: Element[], found: number) => {
  const records = elementRecords(elements, found, (element) => {
    const resolved = resolve(hrefOf(element), page.url)
    return [resolved && isAbsoluteUrl(hrefOf(element)) ? urlField('href', resolved) : textField('href', hrefOf(element) || 'Empty')]
  })
  const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
  return { records, overviewMarkup }
}

export const canonicalRule: Rule = {
  id: 'head-canonical', name: 'Canonical Link', presentation: 1, enabled: true, what: 'static',
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
    if (elements.total === 0) {
      return presentResult(canonicalRule, page, {
        input: 'Static DOM', type: 'warn', priority: 400,
        values: [textField('Canonical link', 'Not found')], checked, noMarkup: 'No matching canonical link element found',
      })
    }
    const { records, overviewMarkup } = present(page, elements.sample, elements.total)
    const base = { checked, evidence: records.evidence, markup: records.markup, detailValues: records.counts, noMarkup: 'Complete original canonical markup not retained' }
    const current = urlRow('Current page URL', resolve(page.url, page.url))

    if (elements.total > 1) {
      return presentResult(canonicalRule, page, {
        ...base, input: 'Static DOM + Page URL', type: 'error', priority: 200,
        values: [textField('Canonical links', elements.total),
          ...elements.sample.map((element, index) => urlRow(`Canonical URL ${index + 1}`, resolve(hrefOf(element), page.url))),
          current, textField('Comparison', `Conflicting, ${elements.total} canonical links declared`), ...overviewMarkup],
      })
    }

    const href = hrefOf(elements.sample[0]!)
    const resolved = href ? resolve(href, page.url) : null
    const observed = [...hrefRow(href, resolved), ...(href ? [urlRow('Canonical URL', resolved)] : [])]
    const finding = (type: 'warn', priority: number, row: DisplayField) => presentResult(canonicalRule, page, {
      ...base, input: 'Static DOM', type, priority, values: [...observed, row, ...overviewMarkup],
    })
    if (!elements.sample[0]!.closest('head')) return finding('warn', 250, textField('Placement', 'Outside head'))
    if (!href) return finding('warn', 300, textField('Placement', 'Inside head'))
    if (href.includes('#')) return finding('warn', 250, textField('Fragment', href.slice(href.indexOf('#'))))
    if (!resolved) return finding('warn', 150, textField('Comparison', 'Not comparable, invalid URL'))

    const comparison = comparisonOf(href, resolved, page.url)
    const passed = comparison.same && isAbsoluteUrl(href)
    return presentResult(canonicalRule, page, {
      ...base, input: 'Static DOM + Page URL', type: passed ? 'ok' : 'warn', priority: passed ? 850 : !isAbsoluteUrl(href) ? 300 : 500,
      values: [...observed, current, textField('Comparison', comparison.value), ...overviewMarkup],
    })
  },
}
