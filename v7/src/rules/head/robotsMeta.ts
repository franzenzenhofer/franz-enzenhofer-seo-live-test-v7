import type { Rule } from '@/core/types'

const parse = (v: string) => v.toLowerCase().split(',').map(s=>s.trim())

export const robotsMetaRule: Rule = {
  id: 'head-robots-meta',
  name: 'Robots Meta',
  enabled: true,
  run: async (page) => {
    const el = page.doc.querySelector('meta[name="robots"]') as HTMLMetaElement|null
    if (!el || !el.content) return { label: 'HEAD', message: 'No robots meta tag.', type: 'info', what: 'static', priority: 610 }
    const tokens = parse(el.content)
    const ni = tokens.includes('noindex'); const nf = tokens.includes('nofollow')
    let msg = 'robots: ' + el.content
    let t: 'info'|'warn' = 'info'
    if (ni || nf) { t = 'warn' }
    return { label: 'HEAD', message: msg, type: t, what: 'static', priority: 610 }
  },
}

