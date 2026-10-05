import { OG_SELECTORS } from './og-constants'
import { contentField, contentRow, ogElements } from './ogPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
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
    const elements = ogElements(page.doc, OG_SELECTORS.DESCRIPTION, contentField)
    const m = elements.first
    const c = m?.getAttribute('content')?.trim() || ''
    // Measured length first, then the text (only when its markup is not shown), then the original markup (F1, F4).
    const values = !m ? [textField('og:description', 'Not found')]
      : !c ? [textField('og:description', 'Empty'), ...elements.overviewMarkup]
        : [textField('Characters', c.length), ...contentRow('Description', c, elements.overviewMarkup), ...elements.overviewMarkup]
    return presentResult(ogDescriptionRule, page, {
      input: 'Static DOM', label: 'HEAD',
      type: !m ? 'info' : c ? 'info' : 'warn', priority: !m ? 900 : c ? 760 : 400,
      values, detailValues: elements.detailValues,
      checked: [textField('Selector', OG_SELECTORS.DESCRIPTION), textField('Selection', 'First matching meta element'),
        textField('Attribute', 'property="og:description" or name="og:description"'), textField('Criterion', 'Absent: observation; present but empty after trimming: warning'),
        textField('Measurement', 'Trimmed content length in UTF-16 code units')],
      evidence: elements.evidence, markup: elements.markup,
      noMarkup: elements.total ? 'Complete original OG description markup not retained' : 'No matching og:description meta element found',
    })
  },
}
