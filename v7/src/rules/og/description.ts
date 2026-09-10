import { OG_SELECTORS } from './og-constants'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'


export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://ogp.me/#metadata'],
    description: 'Checks <meta property="og:description"> presence: info when missing, warn when present but empty.',
  },
  async run(page) {
    const elements = Array.from(page.doc.querySelectorAll(OG_SELECTORS.DESCRIPTION))
    const m = page.doc.querySelector(OG_SELECTORS.DESCRIPTION)
    const c = m?.getAttribute('content')?.trim() || ''
    const { sample, total } = sampleElements(elements)
    const captured = markupEvidence(sample, 'OG description markup')
    const state = !m ? 'Absent' : c ? 'Present' : 'Empty'
    return presentResult(ogDescriptionRule, page, {
      input: 'Static DOM', label: 'HEAD',
      type: !m ? 'info' : c ? 'info' : 'warn', priority: !m ? 900 : c ? 760 : 400,
      values: [textField('og:description', state), ...(m ? [textField('Description (trimmed)', c || 'Empty'), textField('Content characters', c.length)] : [])],
      detailValues: [textField('Matching elements', total), textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length)],
      checked: [textField('Selector', OG_SELECTORS.DESCRIPTION), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:description" or name="og:description"'), textField('Criterion', 'Absent: observation; present but empty after trimming: warning'),
        textField('Measurement', 'Trimmed content length in UTF-16 code units')],
      evidence: captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [],
      markup: captured.markup,
      noMarkup: total ? 'Complete original OG description markup not retained' : 'No matching og:description meta element found',
    })
  },
}
