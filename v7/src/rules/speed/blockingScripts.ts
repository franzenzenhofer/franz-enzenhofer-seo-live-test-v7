import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources'

export const blockingScriptsRule: Rule = {
  id: 'speed:blocking-scripts',
  name: 'Blocking scripts in head',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('head script[src]:not([async]):not([defer])')
    const s = scripts.length
    const sourceHtml = s ? extractHtmlFromList(scripts) : ''
    return {
      label: 'SPEED',
      message: s ? `Blocking scripts in head: ${s}` : 'No blocking head scripts',
      type: s ? 'warn' : 'ok',
      name: 'Blocking scripts in head',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        count: s,
        tested: 'Scanned <head> for sync external scripts',
        reference: SPEC,
      },
    }
  },
}
