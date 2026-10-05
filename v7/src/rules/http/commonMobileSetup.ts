
import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const RESPONSIVE_SPEC = 'https://web.dev/articles/responsive-web-design-basics'
const VIEWPORT_SELECTOR = 'head > meta[name="viewport"]'
const TOUCH_ICON_SELECTOR = 'head > link[rel~="apple-touch-icon"]'

// A resource URL only when the href resolves to http(s) against the page; the raw string otherwise.
const hrefField = (href: string, base: string): DisplayField => {
  if (!href) return textField('href', 'Not declared')
  try { return /^https?:$/.test(new URL(href, base).protocol) ? urlField('href', href) : textField('href', href) } catch { return textField('href', href) }
}

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
    const viewportEl = page.doc.querySelector(VIEWPORT_SELECTOR)
    const touchEl = page.doc.querySelector(TOUCH_ICON_SELECTOR)
    const elements = [viewportEl, touchEl].filter((element): element is Element => element !== null)
    const viewportContent = (viewportEl?.getAttribute('content') || '').trim()
    const records = elementRecords(elements, elements.length, (element) => element === viewportEl
      ? [textField('content', viewportContent || 'Not declared')]
      : [hrefField((element.getAttribute('href') || '').trim(), page.url)])
    const checked = [textField('Selector', VIEWPORT_SELECTOR),
      textField('Secondary selector', TOUCH_ICON_SELECTOR),
      textField('Criterion', 'warn when meta viewport missing; apple-touch-icon is reported for information only')]
    // The observed value first (the content attribute, list-shortened for the overview), then the markup.
    const viewportRow = textField('Viewport', !viewportEl ? 'Not found' : viewportContent ? listRow(viewportContent.split(',').map((part) => part.trim()).filter(Boolean)) : 'Not declared')
    const fullContent = viewportContent && viewportRow.value !== viewportContent ? [textField('Viewport content', viewportContent)] : []
    const noMarkup = elements.length && !records.markup.length ? 'Not retained: elements are rebuilt from captured facts, not captured as original markup'
      : viewportEl ? 'Complete original viewport meta markup not retained' : 'No meta viewport element found'
    return presentResult(commonMobileSetupRule, page, {
      label: 'HEAD', input: 'Static DOM', type: viewportEl ? 'info' : 'warn', priority: viewportEl ? 750 : 200,
      values: [viewportRow, textField('Apple touch icon', touchEl ? 'Found' : 'Not found'), ...records.markup],
      detailValues: [...fullContent, ...(elements.length ? records.counts : [])],
      checked, evidence: records.evidence, markup: records.markup, noMarkup,
    })
  },
}
