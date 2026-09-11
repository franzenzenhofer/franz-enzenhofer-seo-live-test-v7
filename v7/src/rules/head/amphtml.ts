import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'AMP HTML Link'
const RULE_ID = 'head:amphtml'
const SELECTOR = 'head > link[rel~="amphtml" i]'

export const amphtmlRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "An amphtml link points to an optional AMP version of this page. This check validates and resolves the declared web address; it does not validate the destination as AMP.",
      action: "Correct the amphtml href if this site provides an AMP version, then validate that destination. If the site has no AMP version, remove the unused declaration; adding AMP is not required.",
    },
    provenance: 'standard',
    references: ['https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/'],
    description: 'Detects link[rel=amphtml] in <head> and reports the linked AMP URL (info) or a missing href (warn).',
  },
  async run(page) {
    const element = page.doc.querySelector(SELECTOR)
    if (!element) return presentResult(amphtmlRule, page, {
      input: 'Static DOM', type: 'info', priority: 950,
      values: [textField('AMP HTML link', 'Not found')],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href'),
        textField('AMP destination validation', 'Not performed')],
      noMarkup: 'No matching amphtml link found',
    })

    const href = element.getAttribute('href')?.trim() || ''
    const captured = markupEvidence([element], '<link rel="amphtml">')
    const resolved = resolvePageWebUrl(href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseHref = declaredBase?.getAttribute('href')?.trim() || ''
    const baseWasRead = Boolean(baseHref)
    const baseCapture = baseWasRead ? markupEvidence([declaredBase!], '<base>') : null
    const hasHref = Boolean(resolved)
    const validatorUrl = resolved ? `https://validator.ampproject.org/#url=${encodeURIComponent(resolved)}` : null

    return presentResult(amphtmlRule, page, {
      input: 'Static DOM', type: hasHref ? 'info' : 'warn', priority: 500,
      values: [textField('AMP HTML link', 'Found'), resolved ? urlField('Declared href', href) : textField('Declared href', href || 'Empty'),
        resolved ? urlField('Resolved AMP URL', resolved) : textField('Resolved AMP URL', 'Invalid HTTP(S) URL')],
      detailValues: [urlField('Page URL', page.url), baseWasRead ? urlField('Base href', baseHref) : textField('Base href', 'Not declared'),
        validatorUrl ? urlField('Validator URL', validatorUrl) : textField('Validator URL', 'Not generated')],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href'),
        textField('URL resolution', 'Resolved against the document base and page URL; HTTP(S) only'), textField('AMP destination validation', 'Not performed')],
      evidence: [{ name: 'Match', fields: captured.fields }, ...(baseCapture ? [{ name: 'Base URL', fields: baseCapture.fields }] : [])],
      markup: [...captured.markup, ...(baseCapture ? baseCapture.markup : [])],
      noMarkup: 'Complete original amphtml source markup not retained',
    })
  },
}
