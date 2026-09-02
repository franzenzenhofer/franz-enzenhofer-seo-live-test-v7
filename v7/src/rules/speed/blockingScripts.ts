import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleMatchingElements } from '@/shared/domEvidence'

// JavaScript MIME types per https://mimesniff.spec.whatwg.org/#javascript-mime-type
const JS_MIME_TYPES = new Set([
  'application/ecmascript', 'application/javascript', 'application/x-ecmascript', 'application/x-javascript',
  'text/ecmascript', 'text/javascript', 'text/javascript1.0', 'text/javascript1.1', 'text/javascript1.2',
  'text/javascript1.3', 'text/javascript1.4', 'text/javascript1.5', 'text/jscript', 'text/livescript',
  'text/x-ecmascript', 'text/x-javascript',
])

const isBlockingScript = (el: Element): boolean => {
  const type = (el.getAttribute('type') || '').trim().toLowerCase()
  if (!type) return true
  return JS_MIME_TYPES.has(type)
}

export const blockingScriptsRule: Rule = {
  id: 'speed:blocking-scripts',
  name: 'Blocking scripts in head',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources',
      'https://html.spec.whatwg.org/multipage/scripting.html#attr-script-defer',
    ],
    description: 'Warns on external scripts in <head> without async/defer (render-blocking), ok when none.',
  },
  async run(page) {
    const candidates = page.doc.querySelectorAll('head script[src]:not([async]):not([defer]):not([type="module"])')
    const { sample, total: s, shown, truncated } = sampleMatchingElements(candidates, isBlockingScript)
    const sourceHtml = s ? extractHtmlFromList(sample) : ''
    const domPaths = s ? getDomPaths(sample) : []
    return {
      label: 'SPEED',
      message: s ? `Blocking scripts in head: ${s}` : 'No blocking head scripts',
      type: s ? 'warn' : 'ok',
      priority: s ? 250 : 850,
      name: 'Blocking scripts in head',
      details: {
        ...(s ? { sourceHtml, snippet: extractSnippet(sourceHtml) } : {}),
        urls: Array.from(candidates).filter(isBlockingScript).map((el) => el.getAttribute('src') || '').filter(Boolean),
        count: s,
        shown,
        truncated,
        domPaths,
        tested: 'Scanned <head> for sync external classic scripts (module and non-JS types excluded)',
      },
    }
  },
}
