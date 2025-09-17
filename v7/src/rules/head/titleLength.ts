import type { Rule } from '@/core/types'

const len = (s: string) => s.trim().length

export const titleLengthRule: Rule = {
  id: 'head:title-length',
  name: 'Title Length',
  enabled: true,
  async run(page) {
    const t = page.doc.querySelector('head > title')?.textContent || ''
    const n = len(t)
    if (!n) return { label: 'HEAD', message: 'Missing <title>', type: 'error' }
    if (n < 10) return { label: 'HEAD', message: 'Title too short', type: 'warn' }
    if (n > 70) return { label: 'HEAD', message: 'Title too long', type: 'warn' }
    return { label: 'HEAD', message: `Title length OK (${n})`, type: 'ok' }
  },
}

