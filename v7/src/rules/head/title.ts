import type { Rule } from '@/core/types'

const LABEL = 'HEAD'
const NAME = 'Title Present'
const RULE_ID = 'head-title'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'
const MIN_CHARS = 30
const MAX_CHARS = 65

const titleStatus = (len: number) => {
  if (!len) return { message: 'No title tag found.', type: 'error' as const, priority: 0 }
  if (len < MIN_CHARS) return { message: `Title too short (${len}/${MIN_CHARS}-${MAX_CHARS} chars).`, type: 'warn' as const, priority: 200 }
  if (len > MAX_CHARS) return { message: `Title too long (${len}/${MIN_CHARS}-${MAX_CHARS} chars).`, type: 'warn' as const, priority: 200 }
  return { message: `Title length OK (${len}/${MIN_CHARS}-${MAX_CHARS} chars).`, type: 'ok' as const, priority: 900 }
}

export const titleRule: Rule = {
  id: RULE_ID,
  name: 'SEO Title Present',
  enabled: true,
  what: 'static',
  bestPractice: true,
  run: async (page) => {
    const el = page.doc.querySelector('head > title')
    const title = (el?.textContent || '').trim()
    const { message, type, priority } = titleStatus(title.length)
    return {
      label: LABEL,
      message,
      type,
      priority,
      name: NAME,
      details: { title, snippet: title, sourceHtml: el?.outerHTML || '', domPath: 'head > title', reference: SPEC },
    }
  },
}
