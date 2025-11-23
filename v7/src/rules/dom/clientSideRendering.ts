import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'

const textLen = (d: Document) => (d.body?.innerText || '').replace(/\s+/g, ' ').trim().length

export const clientSideRenderingRule: Rule = {
  id: 'dom:client-side-rendering',
  name: 'Client-side rendering heuristic',
  enabled: true,
  what: 'static',
  async run(page) {
    const len = textLen(page.doc)
    const scriptEls = Array.from(page.doc.querySelectorAll('script[src]'))
    const scripts = scriptEls.length
    const heavyScripts = page.doc.querySelectorAll('script:not([async]):not([defer])[src]').length
    const possible = len < 40 && (scripts > 5 || heavyScripts > 0)
    const sourceHtml = extractHtmlFromList(scriptEls)

    return possible
      ? {
          label: 'DOM',
          message: 'Possible client-side rendering (very low text, many scripts)',
          type: 'info',
          name: 'Client-side rendering heuristic',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            textLength: len,
            scriptCount: scripts,
            heavyScriptCount: heavyScripts,
            reference: SPEC,
          },
        }
      : {
          label: 'DOM',
          message: 'Server-rendered content likely present',
          type: 'info',
          name: 'Client-side rendering heuristic',
          details: {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            textLength: len,
            scriptCount: scripts,
            heavyScriptCount: heavyScripts,
            reference: SPEC,
          },
        }
  },
}
