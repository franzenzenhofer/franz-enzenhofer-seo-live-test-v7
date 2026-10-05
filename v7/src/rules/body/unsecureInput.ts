import { countRow, inventory } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'input[type="password" i]'
const pageUrlRow = (url: string) => { try { return [urlField('Current page URL', new URL(url).href)] } catch { return [] } }

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
    // The protocol is the observed value; password fields are declared not checked when it is not HTTP (F13).
    if (protocol !== 'http:') return presentResult(unsecureInputRule, page, {
      input: 'Page URL', type: protocol ? 'not_applicable' : 'runtime_error', priority: 900,
      values: [textField('Page protocol', protocol || 'Invalid URL'), textField('Password fields', 'Not checked')],
      detailValues: pageUrlRow(page.url),
      checked: [textField('Run condition', 'Page URL uses HTTP'), textField('Selector', SELECTOR)],
      noMarkup: 'None - page URL checked; password fields not checked',
    })
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const records = inventory(sample, total, (input) => [textField('name', input.getAttribute('name') || 'Not declared')])
    return presentResult(unsecureInputRule, page, {
      input: 'Page URL + Idle DOM', type: total ? 'warn' : 'ok', priority: total ? 100 : 850,
      values: [textField('Page protocol', protocol), ...countRow('Password fields', total, records.overviewMarkup), ...records.overviewMarkup],
      detailValues: [...pageUrlRow(page.url), ...(total ? records.counts : [])],
      checked: [textField('Selector', SELECTOR), textField('Criterion', 'No password inputs on an HTTP page')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original password-input markup not retained' : 'No password input found',
    })
  },
}
