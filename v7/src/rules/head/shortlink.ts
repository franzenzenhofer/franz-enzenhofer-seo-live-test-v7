import { hrefField, markupReason } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'

const NAME = 'Shortlink'
const RULE_ID = 'head:shortlink'
const SELECTOR = 'head > link[rel~="shortlink" i]'
const checkedLink = [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href')]

export const shortlinkRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A shortlink is an optional shorter address for this page. A different URL is expected and is not by itself a canonical conflict. This check resolves the declared address; it does not follow it.",
      action: "If the declared shortlink is empty or invalid, correct its href in the template or remove the unused declaration. For a valid shortlink, verify it leads to the intended page.",
    },
    provenance: 'franz',
    references: ['https://developer.wordpress.org/reference/functions/wp_get_shortlink/'],
    description: 'Detects link[rel=shortlink] in <head>, resolves its href, and reports a valid alternate address as information.',
  },
  async run(page) {
    const linkEl = page.doc.querySelector(SELECTOR)
    if (!linkEl) return presentResult(shortlinkRule, page, {
      input: 'Static DOM', type: 'info', priority: 950,
      values: [textField('Shortlink', 'Not found')],
      checked: checkedLink,
      noMarkup: 'No matching shortlink element found',
    })
    const href = linkEl.getAttribute('href')?.trim() || ''
    if (!href) {
      const records = elementRecords([linkEl], 1, (link) => [hrefField(link, page.url)])
      return presentResult(shortlinkRule, page, {
        input: 'Static DOM', type: 'warn', priority: 400,
        values: [textField('Shortlink href', 'Empty'), ...records.markup],
        detailValues: records.counts,
        checked: [...checkedLink, textField('URL resolution', 'Not performed for an empty value')],
        evidence: records.evidence, markup: records.markup, noMarkup: markupReason(records, 'Complete original shortlink markup not retained', 'No matching shortlink element found'),
      })
    }

    const resolved = resolvePageWebUrl(href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseRead = Boolean(declaredBase?.getAttribute('href')?.trim())
    // The <base> element is retained whenever it was read to resolve the href, so its contribution is visible.
    const elements = baseRead ? [linkEl, declaredBase!] : [linkEl]
    const records = elementRecords(elements, elements.length, (link) => [hrefField(link, page.url)])
    const type: 'info' | 'warn' = resolved ? 'info' : 'warn'
    return presentResult(shortlinkRule, page, {
      input: 'Static DOM', type, priority: type === 'info' ? 850 : 500,
      values: [
        ...(href === resolved ? [] : [textField('Shortlink href', href)]),
        resolved ? urlField('Shortlink URL', resolved) : textField('Shortlink URL', 'Invalid HTTP(S) URL'),
        ...records.markup,
      ],
      detailValues: records.counts,
      checked: [...checkedLink, textField('URL resolution', 'Resolved against the document base and page URL; HTTP(S) only')],
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: markupReason(records, 'Complete original shortlink source markup not retained', 'No matching shortlink element found'),
    })
  },
}
