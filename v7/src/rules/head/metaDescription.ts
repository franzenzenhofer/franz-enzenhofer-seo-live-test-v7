import type { Rule } from '@/core/types'

export const metaDescriptionRule: Rule = {
  id: 'head-meta-description',
  name: 'Meta Description',
  enabled: true,
  run: async (page) => {
    const nodes = page.doc.querySelectorAll('meta[name="description"]')
    if (nodes.length === 0) return { label: 'BODY', message: 'No meta description found.', type: 'error', what: 'static', priority: 0 }
    if (nodes.length > 1) return { label: 'HEAD', message: 'Multiple meta description found.', type: 'error', what: 'static', priority: 0 }
    const content = (nodes[0] as HTMLMetaElement).content || ''
    return { label: 'HEAD', message: `Meta description: ${content}`, type: 'info', what: 'static', priority: 760 }
  },
}
