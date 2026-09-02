import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Common Mobile Setup'
const RULE_ID = 'http:common-mobile-setup'
const RESPONSIVE_SPEC = 'https://web.dev/articles/responsive-web-design-basics'

export const commonMobileSetupRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      'https://web.dev/articles/responsive-web-design-basics',
    ],
    description:
      'Checks for a head meta viewport tag (warn if missing, per responsive-design guidance); a rel=apple-touch-icon link is reported as extra detail (an Apple convention, not a Google signal).',
  },
  async run(page) {
    const viewportEl = page.doc.querySelector('head > meta[name="viewport"]')
    const touchEl = page.doc.querySelector('head > link[rel~="apple-touch-icon"]')
    const hasViewport = Boolean(viewportEl)
    const hasTouchIcon = Boolean(touchEl)
    const viewportContent = viewportEl?.getAttribute('content')?.trim() || ''
    if (!hasViewport) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Missing meta viewport tag. Pages optimized for a variety of devices must include one.',
        type: 'warn',
        priority: 200,
        details: { hasTouchIcon, reference: RESPONSIVE_SPEC },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: hasTouchIcon
        ? 'Meta viewport present (apple-touch-icon also present).'
        : 'Meta viewport present (apple-touch-icon missing - an Apple home-screen convention, not a Google signal).',
      type: 'ok',
      priority: 750,
      details: {
        sourceHtml: extractHtml(viewportEl),
        snippet: extractSnippet(viewportContent || '(empty)'),
        domPath: getDomPath(viewportEl),
        viewportContent,
        hasTouchIcon,
      },
    }
  },
}
