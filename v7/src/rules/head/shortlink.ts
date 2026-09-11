import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Shortlink'
const RULE_ID = 'head:shortlink'
const SELECTOR = 'head > link[rel~="shortlink" i]'

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
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href')],
      noMarkup: 'No matching shortlink element found',
    })
    const href = linkEl.getAttribute('href')?.trim() || ''
    const captured = markupEvidence([linkEl], '<link rel="shortlink">')
    if (!href) return presentResult(shortlinkRule, page, {
      input: 'Static DOM', type: 'warn', priority: 400,
      values: [textField('Shortlink', 'Found'), textField('Declared href', 'Empty')],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href'),
        textField('URL resolution', 'Not performed for an empty value')],
      evidence: [{ name: 'Match', fields: captured.fields }],
      markup: captured.markup, noMarkup: 'Complete original shortlink markup not retained',
    })

    const resolved = resolvePageWebUrl(href, page)
    const declaredBase = page.doc.querySelector('base[href]')
    const baseHref = declaredBase?.getAttribute('href')?.trim() || ''
    const baseWasRead = Boolean(baseHref)
    const baseCapture = baseWasRead ? markupEvidence([declaredBase!], '<base>') : null
    const type: 'info' | 'warn' = resolved ? 'info' : 'warn'
    return presentResult(shortlinkRule, page, {
      input: 'Static DOM', type, priority: type === 'info' ? 850 : 500,
      values: [textField('Shortlink', 'Found'), resolved ? urlField('Declared href', href) : textField('Declared href', href),
        resolved ? urlField('Resolved URL', resolved) : textField('Resolved URL', 'Invalid HTTP(S) URL')],
      detailValues: [urlField('Page URL', page.url), baseWasRead ? urlField('Base href', baseHref) : textField('Base href', 'Not declared')],
      checked: [textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'href'),
        textField('URL resolution', 'Resolved against the document base and page URL; HTTP(S) only')],
      evidence: [{ name: 'Match', fields: captured.fields }, ...(baseCapture ? [{ name: 'Base URL', fields: baseCapture.fields }] : [])],
      markup: [...captured.markup, ...(baseCapture ? baseCapture.markup : [])],
      noMarkup: 'Complete original shortlink source markup not retained',
    })
  },
}
