import type { Rule } from '@/core/types'
import { sampleMatchingElements } from '@/shared/domEvidence'
import {domPathField, textField, urlField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

// JavaScript MIME types per https://mimesniff.spec.whatwg.org/#javascript-mime-type
const JS_MIME_TYPES = new Set([
  'application/ecmascript', 'application/javascript', 'application/x-ecmascript', 'application/x-javascript',
  'text/ecmascript', 'text/javascript', 'text/javascript1.0', 'text/javascript1.1', 'text/javascript1.2',
  'text/javascript1.3', 'text/javascript1.4', 'text/javascript1.5', 'text/jscript', 'text/livescript',
  'text/x-ecmascript', 'text/x-javascript',
])
const SELECTOR = 'head script[src]:not([async]):not([defer]):not([type="module"])'

const isBlockingScript = (el: Element): boolean => {
  const type = (el.getAttribute('type') || '').trim().toLowerCase()
  if (!type) return true
  return JS_MIME_TYPES.has(type)
}
const isHttpUrl = (value: string, base: string) => { try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false } }
const srcField = (raw: string | null, base: string) => !raw ? textField('Script URL', raw === null ? 'Absent' : 'Empty')
  : isHttpUrl(raw, base) ? urlField('Script URL', raw) : textField('Script URL', raw)

export const blockingScriptsRule: Rule = {
  id: 'speed:blocking-scripts',
  name: 'Blocking scripts in head',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Lists external classic JavaScript in the document head without async or defer. These scripts can pause HTML parsing. This does not measure the actual delay, inspect inline scripts or prove that every resource blocking rendering was found.",
      action: "Review the listed script URLs in the page template. Use defer for scripts that can wait until parsing finishes; use async only when execution order is independent. Remove unused scripts and test behavior after changing load order.",
    },
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources',
      'https://html.spec.whatwg.org/multipage/scripting.html#attr-script-defer',
    ],
    description: 'Warns on external scripts in <head> without async/defer (render-blocking), ok when none.',
  },
  async run(page) {
    const candidates = page.doc.querySelectorAll(SELECTOR)
    const { sample, total, shown } = sampleMatchingElements(candidates, isBlockingScript)
    const captured = markupEvidence(sample, 'Blocking script markup')
    const captureFields = captured.fields.filter((field) => !field.key.startsWith('DOM path'))
    return presentResult(blockingScriptsRule, page, {
      input: 'Static DOM', type: total ? 'warn' : 'ok', priority: total ? 250 : 850,
      values: [textField('Blocking scripts', total)],
      detailValues: [textField('Elements retained', shown), textField('Elements omitted', total - shown)],
      checked: [textField('Selector', SELECTOR),
        textField('Filtering', 'Excludes async, defer, module, and non-JavaScript MIME types'),
        textField('Criterion', 'Script has src in head and no async/defer; absent or empty type is treated as classic JavaScript')],
      evidence: [...sample.map((element, index) => ({ name: `Blocking script ${index + 1}`, fields: [
        srcField(element.getAttribute('src'), page.url), textField('Type attribute', element.hasAttribute('type') ? element.getAttribute('type') || 'Empty' : 'Absent'),
        domPathField('DOM path', captured.selectors[index], 'Not captured'),
      ] })), ...(captureFields.length ? [{ name: 'Capture status', fields: captureFields }] : [])],
      markup: captured.markup, noMarkup: total ? 'Complete original blocking script markup not retained' : 'No blocking head script found',
    })
  },
}
