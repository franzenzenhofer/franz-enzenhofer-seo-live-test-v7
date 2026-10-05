import { OG_SELECTORS } from './og-constants'
import { ogElements } from './ogPresentation'

import type { Rule } from '@/core/types'
import { attrUrlField } from '@/rules/body/elementInventory'
import { textField } from '@/shared/presentation/create'
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
    const elements = ogElements(page.doc, OG_SELECTORS.IMAGE, (element) => [attrUrlField('content', element.getAttribute('content'), page.url)])
    const m = elements.first
    const c = (m?.getAttribute('content') || '').trim()
    const declared = attrUrlField('og:image', c, page.url)
    const abs = isAbsoluteUrl(c)
    const common = {
      input: 'Static DOM', label: 'HEAD', detailValues: elements.detailValues,
      checked: [textField('Selector', OG_SELECTORS.IMAGE), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:image" or name="og:image"')],
      evidence: elements.evidence, markup: elements.markup,
      noMarkup: elements.total ? 'Complete original OG image markup not retained' : 'No matching og:image meta element found',
    }
    if (!m) return presentResult(ogImageRule, page, { ...common, type: 'warn', priority: 500,
      values: [textField('og:image', 'Not found')], checked: [...common.checked, textField('Criterion', 'Element exists with an absolute HTTP(S) URL')] })
    // The declared URL is the observed value: a url field when absolute, its raw form plus the form verdict otherwise (F2, F11).
    return presentResult(ogImageRule, page, { ...common, type: abs ? 'info' : 'warn', priority: abs ? 760 : 350,
      values: [abs ? (declared.kind === 'url' ? declared : textField('og:image', 'Invalid URL')) : textField('og:image', c || 'Empty'),
        ...(abs || !c ? [] : [textField('URL form', 'Relative')]), ...elements.overviewMarkup],
      checked: [...common.checked, textField('Criterion', 'Declared URL uses an absolute HTTP(S) URL')],
    })
  },
}
