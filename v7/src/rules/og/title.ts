import type { Rule } from '@/core/types'

export const ogTitleRule: Rule = {
  id: 'og-title',
  name: 'Open Graph Title',
  enabled: true,
  run: async (page) => {
    const el = page.doc.querySelector('meta[property="og:title"]') as HTMLMetaElement|null
    if (!el || !el.content) return { label: 'HEAD', message: 'No og:title meta.', type: 'info', what: 'static' }
    return { label: 'HEAD', message: `OG title: ${el.content}`, type: 'info', what: 'static' }
  },
}

