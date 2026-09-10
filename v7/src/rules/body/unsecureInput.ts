import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

export const unsecureInputRule: Rule = {
  id: 'body:unsecure-input', name: 'Password fields on HTTP pages', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://www.chromium.org/Home/chromium-security/marking-http-as-non-secure/', 'https://developer.mozilla.org/en-US/docs/Web/Security/Insecure_passwords'],
    description: 'On HTTP pages, counts password inputs. Other observed protocols are not applicable; an invalid URL cannot establish applicability.',
  },
  async run(page) {
    let protocol = ''
    try { protocol = new URL(page.url).protocol } catch { /* no protocol observed */ }
    if (protocol !== 'http:') return presentResult(unsecureInputRule, page, {
      input: 'Page URL', type: protocol ? 'not_applicable' : 'runtime_error', priority: 900,
      values: [textField('Applicable', protocol ? `No — page uses ${protocol.slice(0, -1).toUpperCase()}` : 'Not determined — invalid page URL')],
      detailValues: [urlField('Page URL', page.url)],
      checked: [textField('Page protocol', protocol || 'Not determined'), textField('Run condition', 'Page URL uses HTTP'), textField('Password fields', 'Not checked')],
      noMarkup: 'None — page URL checked; password fields not checked',
    })
    const { sample, total } = sampleElements(page.doc.querySelectorAll('input[type="password" i]'))
    const captured = markupEvidence(sample, 'Password input')
    return presentResult(unsecureInputRule, page, {
      input: 'Page URL + Idle DOM', type: total ? 'warn' : 'ok', priority: total ? 100 : 850,
      values: [textField('Password fields', total)], detailValues: [urlField('Page URL', page.url)],
      checked: [textField('Page protocol', 'HTTP'), textField('Selector', 'input[type="password" i]'), textField('Criterion', 'No password inputs on an HTTP page')],
      evidence: [{ name: 'Capture', fields: [textField('Elements retained', sample.length), textField('Elements omitted', total - sample.length), ...captured.fields] }],
      markup: captured.markup, noMarkup: total ? 'Complete original password-input markup not retained' : 'No password input found',
    })
  },
}
