import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import {domPathField, textField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Data-nosnippet usage'
const RULE_ID = 'dom:data-nosnippet'
const SUPPORTED_TAGS = new Set(['SPAN', 'DIV', 'SECTION'])

export const dataNosnippetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#data-nosnippet-attr'],
    description: 'Finds elements carrying the data-nosnippet attribute: info on supported span/div/section usage, warn on unsupported tags Google ignores.',
  },
  async run(page) {
    const all = Array.from(page.doc.querySelectorAll('[data-nosnippet]'))
    const unsupported = all.filter((el) => !SUPPORTED_TAGS.has(el.tagName))
    const { sample, total, shown } = sampleElements(unsupported.length ? unsupported : all)
    const captured = markupEvidence(sample, 'data-nosnippet markup')
    const captureFields = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    const evidence = sample.map((element, index) => ({
      name: `${element.tagName.toLowerCase()} data-nosnippet ${index + 1}`,
      fields: [textField('Element text (first 100 characters)', ((element.textContent || '').replace(/\s+/g, ' ').trim() || 'Empty').slice(0, 100)),
        textField('Tag', element.tagName.toLowerCase()), textField('Attribute value', element.getAttribute('data-nosnippet') || 'Empty'),
        domPathField('DOM path', captured.selectors[index], 'Not captured')],
    }))
    const unsupportedTags = [...new Set(unsupported.map((el) => el.tagName.toLowerCase()))]
    return presentResult(dataNosnippetRule, page, {
      input: 'Idle DOM',
      type: unsupported.length ? 'warn' : 'info', priority: unsupported.length ? 300 : all.length ? 700 : 910,
      values: unsupported.length ? [textField('data-nosnippet elements', all.length), textField('Unsupported elements', unsupported.length),
        textField('Unsupported tags', unsupportedTags.join(', '))] : [textField('data-nosnippet elements', all.length)],
      detailValues: [textField('Examples retained', shown), textField('Examples omitted', total - shown)],
      checked: [textField('Selector', '[data-nosnippet]'), textField('Supported tags', 'span, div, and section'),
        textField('Match', 'Attribute presence'), textField('Criterion', 'Reports supported usage; unsupported tags are warned')],
      evidence: [...evidence, ...(captureFields.length ? [{ name: 'Capture status', fields: captureFields }] : [])],
      markup: captured.markup,
      noMarkup: total ? 'Complete original data-nosnippet markup not retained' : 'No data-nosnippet attributes found',
    })
  },
}
