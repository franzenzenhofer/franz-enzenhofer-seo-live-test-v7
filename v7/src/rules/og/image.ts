import { OG_SELECTORS } from './og-constants'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { isAbsoluteUrl } from '@/shared/url-utils'

export const ogImageRule: Rule = {
  id: 'og:image',
  name: 'Open Graph Image',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks <meta property="og:image"> presence and that its URL is absolute http(s); warn otherwise.',
  },
  async run(page) {
    const elements = Array.from(page.doc.querySelectorAll(OG_SELECTORS.IMAGE))
    const m = page.doc.querySelector(OG_SELECTORS.IMAGE)
    const c = (m?.getAttribute('content') || '').trim()
    const abs = isAbsoluteUrl(c)
    const { sample, total } = sampleElements(elements)
    const captured = markupEvidence(sample, 'OG image markup')
    const common = {
      input: 'Static DOM', label: 'HEAD',
      detailValues: [textField('Matching elements', total), textField('Elements retained', sample.length),
        textField('Elements omitted', total - sample.length)],
      checked: [textField('Selector', OG_SELECTORS.IMAGE), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:image" or name="og:image"')],
      evidence: captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [],
      markup: captured.markup,
      noMarkup: total ? 'Complete original OG image markup not retained' : 'No matching og:image meta element found',
    }
    if (!m) return presentResult(ogImageRule, page, { ...common, type: 'warn', priority: 500,
      values: [textField('og:image', 'Absent')], checked: [...common.checked, textField('Criterion', 'Element exists with an absolute HTTP(S) URL')] })
    return presentResult(ogImageRule, page, { ...common, type: abs ? 'info' : 'warn', priority: abs ? 760 : 350,
      values: [textField('og:image', abs ? 'Absolute URL' : 'Not absolute'),
        abs ? urlField('Declared URL (trimmed)', c) : textField('Declared URL (trimmed)', c || 'Empty')],
      checked: [...common.checked, textField('Criterion', 'Declared URL uses an absolute HTTP(S) URL')],
    })
  },
}
