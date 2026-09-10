import type { Rule } from '@/core/types'
import { boundedOpeningTag } from '@/shared/boundedHtml'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

export const discoverPrimaryLanguageRule: Rule = {
  id: 'discover:primary-language', name: 'Declared page language', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/dom.html#attr-lang',
      'https://dequeuniversity.com/rules/axe/4.4/html-has-lang',
    ],
    description: 'Checks that the html element has a non-empty lang attribute (info if set, warn if missing).',
  },
  async run(page) {
    const el = page.doc.documentElement
    const lang = (el.getAttribute('lang') || '').trim()
    const captured = markupEvidence([el], 'HTML element')
    return presentResult(discoverPrimaryLanguageRule, page, {
      input: 'Idle DOM', type: lang ? 'info' : 'warn', priority: lang ? 800 : 250,
      values: [textField('Language (trimmed)', lang || 'Not declared or empty')],
      detailValues: [textField('lang attribute', el.hasAttribute('lang') ? 'Present' : 'Absent'),
        ...(!captured.markup.length ? [textField('Opening tag excerpt (reconstructed)', boundedOpeningTag(el))] : [])],
      checked: [textField('Selector', 'html'), textField('Attribute', 'lang'), textField('Criterion', 'Non-empty value after trimming'),
        textField('Language code validity', 'Not checked'), textField('Match with visible content', 'Not checked')],
      evidence: captured.fields.length ? [{ name: 'Source location', fields: captured.fields }] : [],
      markup: captured.markup, noMarkup: 'Complete original HTML element not retained; reconstructed opening tag excerpt shown separately',
    })
  },
}
