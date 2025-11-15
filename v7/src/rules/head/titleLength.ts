import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const len = (s: string) => s.trim().length

export const titleLengthRule: Rule = {
  id: 'head:title-length',
  name: 'Title Length',
  enabled: true,
  what: 'static',
  async run(page) {
    const titleEl = page.doc.querySelector('head > title')
    const t = titleEl?.textContent || ''
    const n = len(t)
    const sourceHtml = extractHtml(titleEl)

    if (!n) {
      return { label: 'HEAD', message: 'Missing <title>', type: 'error', name: 'titleLength' }
    }

    return {
      label: 'HEAD',
      message: n < 10 ? 'Title too short' : n > 70 ? 'Title too long' : `Title length OK (${n})`,
      type: n < 10 || n > 70 ? 'warn' : 'ok',
      name: 'titleLength',
      details: titleEl
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(titleEl),
          }
        : undefined,
    }
  },
}

