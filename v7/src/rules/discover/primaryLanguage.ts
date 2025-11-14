import type { Rule } from '@/core/types'
import { extractSnippet, getDomPath } from '@/shared/html-utils'

export const discoverPrimaryLanguageRule: Rule = {
  id: 'discover:primary-language',
  name: 'Primary language set',
  enabled: true,
  async run(page) {
    const el = page.doc.documentElement
    const lang = (el.getAttribute('lang') || '').trim()
    const sourceHtml = `<html${el.attributes.length ? ' ' : ''}${Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ')}>`

    return lang
      ? {
          label: 'DISCOVER',
          message: `Primary language: ${lang}`,
          type: 'info',
          name: 'primaryLanguage',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el) },
        }
      : {
          label: 'DISCOVER',
          message: 'Set html[lang]',
          type: 'warn',
          name: 'primaryLanguage',
        }
  },
}

