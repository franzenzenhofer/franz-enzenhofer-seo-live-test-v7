import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Shortlink'
const RULE_ID = 'head:shortlink'
const SELECTOR = 'head > link[rel~="shortlink" i]'

export const shortlinkRule: Rule = {
  id: RULE_ID,
  name: NAME,
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
    const href = linkEl?.getAttribute('href')?.trim() || ''
    const hasShortlink = Boolean(linkEl)
    const hasHref = Boolean(href)
    if (!hasShortlink) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No shortlink detected.',
        type: 'info',
        priority: 950,
        details: { hasShortlink: false },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    if (!hasHref) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Shortlink present but href missing.',
        type: 'warn',
        priority: 400,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(linkEl),
          href,
          hasShortlink,
        },
      }
    }

    const resolved = resolvePageWebUrl(href, page)
    const type: 'info' | 'warn' = resolved ? 'info' : 'warn'
    const message = resolved ? 'Optional shortlink declared for this page.' : 'Shortlink href is not a valid HTTP or HTTPS URL.'

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'info' ? 850 : 500,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(linkEl),
        href: resolved || href,
        pageUrl: page.url,
        hasShortlink,
      },
    }
  },
}
