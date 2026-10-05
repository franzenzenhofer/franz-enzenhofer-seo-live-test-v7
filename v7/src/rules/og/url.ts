import { OG_SELECTORS } from './og-constants'
import { ogElements } from './ogPresentation'

import type { Rule } from '@/core/types'
import { attrUrlField } from '@/rules/body/elementInventory'
import { differingComponent } from '@/shared/presentation/comparison'
import { recordCounts } from '@/shared/presentation/counts'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { isAbsoluteUrl } from '@/shared/url-utils'

const CANONICAL_SELECTOR = 'link[rel~="canonical" i]'
const OVERVIEW_MARKUP_LIMIT = 3
const resolveUrl = (value: string, base?: string): string | null => {
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}
// Both sides of the check that decided the verdict: the resolved canonical first, then the document URL (F2).
const differs = (og: string, target: string, name: string) => textField('Comparison', `Differs from ${name} (${differingComponent(og, target) ?? 'URL'})`)
const comparisonRows = (og: string, canonical: string, pageResolved: string, canonicalMismatch: boolean, pageMismatch: boolean): DisplayField[] => {
  if (!canonical && !pageResolved) return [textField('Current page URL', 'Invalid URL')]
  const canonicalRow = canonical ? [urlField('Canonical URL', canonical)] : []
  if (canonicalMismatch) return [...canonicalRow, differs(og, canonical, 'canonical URL')]
  if (pageMismatch) return [...canonicalRow, urlField('Current page URL', pageResolved), differs(og, pageResolved, 'current page URL')]
  if (canonical) return [...canonicalRow, textField('Comparison', 'Equals canonical URL')]
  return [urlField('Current page URL', pageResolved), textField('Comparison', 'Equals current page URL')]
}

export const ogUrlRule: Rule = {
  id: 'og:url',
  name: 'Open Graph URL',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks og:url presence, absoluteness, and consistency with rel=canonical and the document URL.',
  },
  async run(page) {
    const elements = ogElements(page.doc, OG_SELECTORS.URL, (element) => [attrUrlField('content', element.getAttribute('content'), page.url)])
    const m = elements.first
    const content = m?.getAttribute('content')?.trim() || ''
    const common = {
      input: 'Static DOM', label: 'HEAD', detailValues: elements.detailValues,
      checked: [textField('Selector', OG_SELECTORS.URL), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:url" or name="og:url"')],
      evidence: elements.evidence, markup: elements.markup,
      noMarkup: elements.total ? 'Complete original OG URL markup not retained' : 'No matching og:url meta element found',
    }
    if (!m) return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 500,
      values: [textField('og:url', 'Not found')], checked: [...common.checked, textField('Criterion', 'Element exists with a URL value')] })
    if (!content) {
      return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 400,
        values: [textField('og:url', 'Empty'), ...elements.overviewMarkup],
        checked: [...common.checked, textField('Criterion', 'Element exists with a non-empty URL value')] })
    }
    const ogResolved = isAbsoluteUrl(content) ? resolveUrl(content) : null
    if (!ogResolved) {
      return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 350,
        values: [textField('og:url', isAbsoluteUrl(content) ? 'Invalid URL' : content), ...(isAbsoluteUrl(content) ? [] : [textField('URL form', 'Relative')]), ...elements.overviewMarkup],
        checked: [...common.checked, textField('Criterion', 'Declared URL uses an absolute HTTP(S) URL')] })
    }

    const canonicalElement = page.doc.querySelector(CANONICAL_SELECTOR)
    const canonical = canonicalElement?.getAttribute('href')?.trim() || ''
    const canonicalRecords = elementRecords(canonicalElement ? [canonicalElement] : [], canonicalElement ? 1 : 0, (element) => [attrUrlField('href', element.getAttribute('href'), page.url)])
    const canonicalResolved = canonical ? resolveUrl(canonical, page.url) || '' : ''
    const pageResolved = page.url ? resolveUrl(page.url) || page.url : ''

    const canonicalMismatch = !!canonicalResolved && canonicalResolved !== ogResolved
    const pageMismatch = !canonicalMismatch && !!pageResolved && pageResolved !== ogResolved
    const type: 'info' | 'warn' = canonicalMismatch || pageMismatch ? 'warn' : 'info'

    const markup = [...elements.markup, ...canonicalRecords.markup]
    const overviewMarkup = markup.length <= OVERVIEW_MARKUP_LIMIT ? markup : []
    const found = elements.total + (canonicalElement ? 1 : 0)
    return presentResult(ogUrlRule, page, { ...common, type, priority: type === 'warn' ? 300 : 760,
      values: [urlField('og:url', ogResolved), ...comparisonRows(ogResolved, canonicalResolved, pageResolved, canonicalMismatch, pageMismatch), ...overviewMarkup],
      markup, evidence: [...elements.evidence, ...canonicalRecords.evidence],
      detailValues: [...(canonicalElement ? [] : [textField('Canonical link', 'Not found')]),
        ...recordCounts({ found, markup: markup.length, evidence: elements.evidence.length + canonicalRecords.evidence.length })],
      checked: [...common.checked, textField('Canonical selector', CANONICAL_SELECTOR),
        textField('Comparison order', 'Resolved og:url against resolved canonical, then document URL'),
        textField('Criterion', 'Absolute URL is consistent with the applicable comparison')],
    })
  },
}
