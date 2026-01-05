import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HEAD'
const NAME = 'Common Mobile Setup'
const RULE_ID = 'http:common-mobile-setup'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing'

export const commonMobileSetupRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const viewportEl = page.doc.querySelector('head > meta[name="viewport"]')
    const touchEl = page.doc.querySelector('head > link[rel~="apple-touch-icon"]')
    const hasViewport = Boolean(viewportEl)
    const hasTouchIcon = Boolean(touchEl)
    const viewportContent = viewportEl?.getAttribute('content')?.trim() || ''
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'info'
    let priority = 500
    if (!hasViewport) {
      message = 'Missing meta viewport tag. (Required for mobile-first indexing)'
      type = 'warn'
      priority = 200
    } else if (hasTouchIcon) {
      message = 'Mobile-friendly: viewport + apple-touch-icon present'
      type = 'ok'
      priority = 750
    } else {
      message = 'Viewport present (apple-touch-icon missing)'
      type = 'info'
      priority = 700
    }
    const details = hasViewport
      ? {
          sourceHtml: extractHtml(viewportEl),
          snippet: extractSnippet(viewportContent || '(empty)'),
          domPath: getDomPath(viewportEl),
          viewportContent,
          hasTouchIcon,
          reference: SPEC,
        }
      : { reference: SPEC }
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details,
    }
  },
}

