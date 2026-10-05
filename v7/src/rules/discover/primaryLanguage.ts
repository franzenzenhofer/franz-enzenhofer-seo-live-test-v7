import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { recordCounts } from '@/shared/presentation/counts'
import { domPathField, textField } from '@/shared/presentation/create'
import { isReconstructed } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const checked = [textField('Element', 'html'), textField('Attribute', 'lang'), textField('Criterion', 'Non-empty value after trimming'),
  textField('Language code validity', 'Not checked'), textField('Match with visible content', 'Not checked')]

// The html element is the whole document, so its markup is never shipped (FORMATTING.md F5, capture boundary);
// the observed value is the lang attribute and, when one is declared, the evidence record locates the element.
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
    const element = page.doc.documentElement
    const raw = element.getAttribute('lang')
    const lang = (raw || '').trim()
    const path = isReconstructed(page.doc) ? null : getDomPath(element)
    const declared = raw !== null
    return presentResult(discoverPrimaryLanguageRule, page, {
      input: 'Idle DOM', type: lang ? 'info' : 'warn', priority: lang ? 800 : 250,
      values: [textField('Language', lang || (declared ? 'Empty' : 'Not declared'))],
      detailValues: declared ? recordCounts({ found: 1, markup: 0, evidence: 1 }) : [],
      checked,
      evidence: declared ? [{ name: '<html>', fields: [domPathField('DOM path', path, 'Not captured')] }] : [],
      noMarkup: 'Not retained: the html element is the whole document',
    })
  },
}
