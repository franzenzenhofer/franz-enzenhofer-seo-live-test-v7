import { hrefField, markupReason } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'

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
    const resolved = resolvePageWebUrl(href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseRead = Boolean(declaredBase?.getAttribute('href')?.trim())
    // The <base> element is retained whenever it was read to resolve the href, so its contribution is visible.
    const elements = baseRead ? [element, declaredBase!] : [element]
    const records = elementRecords(elements, elements.length, (link) => [hrefField(link, page.url)])
    const validatorUrl = resolved ? `https://validator.ampproject.org/#url=${encodeURIComponent(resolved)}` : null

    return presentResult(amphtmlRule, page, {
      input: 'Static DOM', type: resolved ? 'info' : 'warn', priority: 500,
      values: [
        ...(href === resolved ? [] : [textField('AMP href', href || 'Empty')]),
        resolved ? urlField('AMP URL', resolved) : textField('AMP URL', 'Invalid HTTP(S) URL'),
        ...records.markup,
      ],
      detailValues: [...records.counts, ...(validatorUrl ? [urlField('Validator URL', validatorUrl)] : [])],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href'),
        textField('URL resolution', 'Resolved against the document base and page URL; HTTP(S) only'), textField('AMP destination validation', 'Not performed')],
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: markupReason(records, 'Complete original amphtml source markup not retained', 'No matching amphtml link found'),
    })
  },
}
