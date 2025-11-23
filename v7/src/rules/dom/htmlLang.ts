import type { Rule } from '@/core/types'
import { extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://web.dev/html-has-lang/'

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
          label: 'DOM',
          message: `lang=${lang}`,
          type: 'info',
          name: 'HTML lang attribute',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), reference: SPEC },
        }
      : {
          label: 'DOM',
          message: 'Missing html[lang]',
          type: 'warn',
          name: 'htmlLang',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), reference: SPEC },
        }
  },
}
