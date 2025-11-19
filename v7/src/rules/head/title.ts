import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'SEO Title Present'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

export const titleRule: Rule = {
  id: 'head-title',
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    // 1. Query
    const nodes = Array.from(page.doc.querySelectorAll('head > title'))
    const count = nodes.length
    const firstNode = nodes[0]

    // 2. Content Analysis (Trimmed)
    const rawContent = firstNode?.textContent ?? ''
    const titleContent = rawContent.trim()
    const hasContent = titleContent.length > 0

    // 3. Logic States
    const isMultiple = count > 1
    const isMissing = count === 0
    const isEmpty = count === 1 && !hasContent
    const isOk = count === 1 && hasContent

    // 4. Determine Result Properties
    // We define the state, then map to the message. DRY.
    const type = isOk ? 'ok' : 'error'
    
    let message = ''
    if (isOk) message = `1 <title> tag found ("${extractSnippet(titleContent, 20)}").`
    else if (isMultiple) message = `${count} <title> tags found (Must be exactly 1).`
    else if (isMissing) message = 'Missing <title> tag.'
    else if (isEmpty) message = '<title> tag exists but is empty.'

    // 5. Evidence Construction
    // If multiple, show the list. If one (even empty), show that one.
    const sourceHtml = isMultiple ? extractHtmlFromList(nodes) : extractHtml(firstNode ?? null)
    
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: isOk ? 100 : 0, // Error = 0 (High priority fix)
      details: {
        title: titleContent,
        length: titleContent.length,
        sourceHtml,
        domPath: getDomPath(firstNode ?? null),
        reference: SPEC,
      },
    }
  },
}