import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const RESPONSIVE_SPEC = 'https://web.dev/articles/responsive-web-design-basics'

export const commonMobileSetupRule: Rule = {
  id: 'http:common-mobile-setup', name: 'Common Mobile Setup', presentation: 1, enabled: true, what: 'http',
  meta: {
    userGuide: {
      check: "Looks for a viewport declaration that lets a page adapt to device width. This is a markup check, not a complete mobile usability test. The Apple touch icon is optional and unrelated to Google indexing.",
      action: "Add an appropriate viewport declaration to the page head in the shared template, then check the actual layout at narrow widths. See the viewport rule for content and zoom restrictions.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      RESPONSIVE_SPEC,
    ],
    description:
      'Checks for a head meta viewport tag (warn if missing, per responsive-design guidance); a rel=apple-touch-icon link is reported as extra detail (an Apple convention, not a Google signal).',
  },
  async run(page) {
    const viewportEl = page.doc.querySelector('head > meta[name="viewport"]')
    const touchEl = page.doc.querySelector('head > link[rel~="apple-touch-icon"]')
    const hasTouchIcon = Boolean(touchEl)
    const checked = [textField('Selector', 'head > meta[name="viewport"]'),
      textField('Secondary selector', 'head > link[rel~="apple-touch-icon"]'),
      textField('Criterion', 'warn when meta viewport missing; apple-touch-icon is reported for information only')]
    const touchEvidence = touchEl ? [{ name: 'Apple touch icon', fields: [textField('href', touchEl.getAttribute('href') || 'Empty')] }] : []
    if (!viewportEl) return presentResult(commonMobileSetupRule, page, {
      label: 'HEAD', input: 'Static DOM', type: 'warn', priority: 200,
      values: [textField('Meta viewport', 'Missing'), textField('Apple touch icon', hasTouchIcon ? 'Present' : 'Missing')],
      checked, evidence: touchEvidence, noMarkup: 'No meta viewport element found',
    })
    const viewportContent = (viewportEl.getAttribute('content') || '').trim()
    const captured = markupEvidence([viewportEl], 'Viewport meta')
    return presentResult(commonMobileSetupRule, page, {
      label: 'HEAD', input: 'Static DOM', type: 'info', priority: 750,
      values: [textField('Meta viewport', 'Present'), textField('Apple touch icon', hasTouchIcon ? 'Present' : 'Missing')],
      detailValues: [textField('Viewport content', viewportContent || 'Empty')],
      checked, evidence: [...(captured.fields.length ? [{ name: 'Capture', fields: captured.fields }] : []), ...touchEvidence],
      markup: captured.markup, noMarkup: 'Complete original viewport meta markup not retained',
    })
  },
}
