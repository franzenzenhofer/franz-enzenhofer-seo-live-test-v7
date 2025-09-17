import type { Rule } from '@/core/types'

const textLen = (d: Document) => (d.body?.innerText || '').replace(/\s+/g,' ').trim().length

export const clientSideRenderingRule: Rule = {
  id: 'dom:client-side-rendering',
  name: 'Client-side rendering heuristic',
  enabled: true,
  async run(page) {
    const len = textLen(page.doc)
    const scripts = page.doc.querySelectorAll('script[src]').length
    const heavyScripts = page.doc.querySelectorAll('script:not([async]):not([defer])[src]').length
    const possible = len < 40 && (scripts > 5 || heavyScripts > 0)
    return possible ? { label: 'DOM', message: 'Possible client-side rendering (very low text, many scripts)', type: 'info' } : { label: 'DOM', message: 'Server-rendered content likely present', type: 'info' }
  },
}

