import { OG_SELECTORS } from './og-constants'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { isAbsoluteUrl } from '@/shared/url-utils'

const resolveUrl = (value: string, base?: string): string | null => {
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
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
    const elements = Array.from(page.doc.querySelectorAll(OG_SELECTORS.URL))
    const m = page.doc.querySelector(OG_SELECTORS.URL)
    const content = m?.getAttribute('content')?.trim() || ''
    const { sample, total } = sampleElements(elements)
    const captured = markupEvidence(sample, 'OG URL markup')
    const common = {
      input: 'Static DOM', label: 'HEAD',
      detailValues: [textField('Matching elements', total), textField('Elements retained', sample.length),
        textField('Elements omitted', total - sample.length)],
      checked: [textField('Selector', OG_SELECTORS.URL), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:url" or name="og:url"')],
      evidence: captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [],
      markup: captured.markup,
      noMarkup: total ? 'Complete original OG URL markup not retained' : 'No matching og:url meta element found',
    }
    if (!m) return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 500,
      values: [textField('og:url', 'Absent')], checked: [...common.checked, textField('Criterion', 'Element exists with a URL value')] })
    if (!content) {
      return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 400,
        values: [textField('og:url', 'Empty')],
        checked: [...common.checked, textField('Criterion', 'Element exists with a non-empty URL value')] })
    }
    const ogResolved = isAbsoluteUrl(content) ? resolveUrl(content) : null
    if (!ogResolved) {
      return presentResult(ogUrlRule, page, { ...common, type: 'warn', priority: 350,
        values: [textField('og:url', 'Not absolute'), urlField('Declared URL (trimmed)', content)],
        checked: [...common.checked, textField('Criterion', 'Declared URL uses an absolute HTTP(S) URL')] })
    }

    const canonicalElement = page.doc.querySelector('link[rel~="canonical" i]')
    const canonical = canonicalElement?.getAttribute('href')?.trim() || ''
    const canonicalCapture = markupEvidence(canonicalElement ? [canonicalElement] : [], 'Canonical markup')
    const canonicalResolved = canonical ? resolveUrl(canonical, page.url) || '' : ''
    const pageResolved = page.url ? resolveUrl(page.url) || page.url : ''

    let type: 'info' | 'warn' = 'info'
    let state = 'Consistent'

    if (canonicalResolved && canonicalResolved !== ogResolved) {
      state = 'Canonical mismatch'
      type = 'warn'
    } else if (pageResolved && pageResolved !== ogResolved) {
      state = 'Document location mismatch'
      type = 'warn'
    }

    return presentResult(ogUrlRule, page, { ...common, type, priority: type === 'warn' ? 300 : 760,
      values: [textField('og:url', state), urlField('Declared URL (trimmed)', content)],
      markup: [...common.markup, ...canonicalCapture.markup],
      evidence: [...common.evidence, ...(canonicalCapture.fields.length ? [{ name: 'Canonical source', fields: canonicalCapture.fields }] : [])],
      detailValues: [...common.detailValues, urlField('Resolved og:url', ogResolved),
        ...(canonicalResolved ? [urlField('Canonical URL', canonicalResolved)] : [textField('Canonical URL', canonical ? 'Not resolved' : 'Not declared or empty')]),
        ...(pageResolved ? [urlField('Document URL', pageResolved)] : [textField('Document URL', 'Not resolved')])],
      checked: [...common.checked, textField('Canonical selector', 'link[rel~="canonical" i]'),
        textField('Comparison', 'Resolved og:url against resolved canonical, then document URL'),
        textField('Criterion', 'Absolute URL is consistent with the applicable comparison')],
    })
  },
}
