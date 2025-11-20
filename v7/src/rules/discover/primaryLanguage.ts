import type { Rule } from '@/core/types'
import { extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://developer.mozilla.org/docs/Web/HTML/Global_attributes/lang'
const TESTED = 'Read the <html> lang attribute to confirm a primary language declaration.'

export const discoverPrimaryLanguageRule: Rule = {
  id: 'discover:primary-language',
  name: 'Primary language set',
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.documentElement
    const lang = (el.getAttribute('lang') || '').trim()
    const sourceHtml = `<html${el.attributes.length ? ' ' : ''}${Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ')}>`

    return lang
      ? {
          label: 'DISCOVER',
          message: `html[lang] set to '${lang}'`,
          type: 'info',
          name: 'Primary language set',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), language: lang, tested: TESTED, reference: SPEC },
        }
      : {
          label: 'DISCOVER',
          message: 'Missing lang attribute on <html> tag',
          type: 'warn',
          name: 'Primary language set',
          details: { tested: TESTED, reference: SPEC },
        }
  },
}
