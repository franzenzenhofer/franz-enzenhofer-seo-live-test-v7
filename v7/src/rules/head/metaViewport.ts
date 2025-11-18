import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SELECTOR = 'meta[name="viewport"]'
const REQUIRED_WIDTH = 'width=device-width'
const INITIAL_SCALE = /initial-scale=1(\.0)?/
const LABEL = 'HEAD'
const NAME = 'Meta Viewport'

const isValidContent = (raw: string | null) => {
  if (!raw) return false
  const normalized = raw.trim().toLowerCase()
  return normalized.includes(REQUIRED_WIDTH) && INITIAL_SCALE.test(normalized)
}

const buildDetails = (el: Element) => {
  const sourceHtml = extractHtml(el)
  return {
    sourceHtml,
    snippet: extractSnippet(sourceHtml),
    domPath: getDomPath(el),
  }
}

export const metaViewportRule: Rule = {
  id: 'head:meta-viewport',
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const el = page.doc.querySelector(SELECTOR)
    if (!el) return { name: NAME, label: LABEL, message: 'Missing meta viewport', type: 'warn' }
    const details = buildDetails(el)
    return isValidContent(el.getAttribute('content'))
      ? { name: NAME, label: LABEL, message: 'Viewport OK', type: 'ok', details }
      : { name: NAME, label: LABEL, message: 'Viewport content may be suboptimal', type: 'warn', details }
  },
}
