import type { Rule } from '@/core/types'
import { extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'DOM'
const NAME = 'HTML lang attribute'
const SPEC = 'https://developer.mozilla.org/docs/Web/HTML/Global_attributes/lang'
const TESTED = 'Read the <html> lang attribute and reported the configured locale value.'

export const htmlLangRule: Rule = {
  id: 'dom:html-lang',
  name: 'HTML lang attribute',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.documentElement
    const lang = (el.getAttribute('lang') || '').trim()
    const sourceHtml = `<html${el.attributes.length ? ' ' : ''}${Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ')}>`

    return lang
      ? {
          label: LABEL,
          message: `lang=${lang}`,
          type: 'info',
          name: NAME,
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(el),
            tested: TESTED,
            reference: SPEC,
            lang,
          },
        }
      : {
          label: LABEL,
          message: 'Missing html[lang]',
          type: 'warn',
          name: NAME,
          details: { tested: TESTED, reference: SPEC },
        }
  },
}
