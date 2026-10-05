import { OG_SELECTORS } from './og-constants'
import { contentField, contentRow, ogElements } from './ogPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks <meta property="og:title"> presence and reports its content length as info.',
  },
  run: async (page) => {
    const elements = ogElements(page.doc, OG_SELECTORS.TITLE, contentField)
    const el = elements.first as HTMLMetaElement | null
    const content = el?.content || ''
    // Measured length first, then the text (only when its markup is not shown), then the original markup (F1, F4).
    const values = !el ? [textField('og:title', 'Not found')]
      : !content ? [textField('og:title', 'Empty'), ...elements.overviewMarkup]
        : [textField('Characters', content.length), ...contentRow('Title', content, elements.overviewMarkup), ...elements.overviewMarkup]
    return presentResult(ogTitleRule, page, {
      input: 'Static DOM', label: 'HEAD',
      type: !el || !content ? 'warn' : 'info', priority: !el || !content ? 500 : 760,
      values, detailValues: elements.detailValues,
      checked: [textField('Selector', OG_SELECTORS.TITLE), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:title" or name="og:title"'), textField('Criterion', 'Element exists with non-empty content')],
      evidence: elements.evidence, markup: elements.markup,
      noMarkup: elements.total ? 'Complete original OG title markup not retained' : 'No matching og:title meta element found',
    })
  },
}
