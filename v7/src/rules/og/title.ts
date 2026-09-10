import { OG_SELECTORS } from './og-constants'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
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
    const el = page.doc.querySelector(OG_SELECTORS.TITLE) as HTMLMetaElement|null
    const elements = Array.from(page.doc.querySelectorAll(OG_SELECTORS.TITLE))
    const { sample, total } = sampleElements(elements)
    const captured = markupEvidence(sample, 'OG title markup')
    const content = el?.content || ''
    const state = !el ? 'Absent' : content ? 'Present' : 'Empty'
    return presentResult(ogTitleRule, page, {
      input: 'Static DOM', label: 'HEAD',
      type: !el || !content ? 'warn' : 'info', priority: !el || !content ? 500 : 760,
      values: [textField('og:title', state), ...(el ? [textField('Title', content || 'Empty'), textField('Content characters', content.length)] : [])],
      detailValues: [textField('Matching elements', total), textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length)],
      checked: [textField('Selector', OG_SELECTORS.TITLE), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:title" or name="og:title"'), textField('Criterion', 'Element exists with non-empty content')],
      evidence: captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [],
      markup: captured.markup,
      noMarkup: total ? 'Complete original OG title markup not retained' : 'No matching og:title meta element found',
    })
  },
}
