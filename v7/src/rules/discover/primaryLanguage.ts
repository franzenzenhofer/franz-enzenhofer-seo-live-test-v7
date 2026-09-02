import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { boundedOpeningTag } from '@/shared/boundedHtml'

const NOTE = 'The lang attribute aids accessibility (screen-reader pronunciation); Google determines page language from visible content, not from lang attributes.'

export const discoverPrimaryLanguageRule: Rule = {
  id: 'discover:primary-language',
  name: 'Primary language set',
  enabled: true,
  what: 'static',
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
    const sourceHtml = boundedOpeningTag(el)

    return lang
      ? {
          label: 'DISCOVER',
          message: `html[lang] set to '${lang}'`,
          type: 'info',
          priority: 800,
          name: 'Primary language set',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), language: lang, note: NOTE },
        }
      : {
          label: 'DISCOVER',
          message: 'Missing lang attribute on <html> tag (HTML standard / accessibility)',
          type: 'warn',
          priority: 250,
          name: 'Primary language set',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), language: null, note: NOTE },
        }
  },
}
