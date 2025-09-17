import type { Rule } from '@/core/types'

export const httpsSchemeRule: Rule = {
  id: 'http:https-scheme',
  name: 'HTTPS Scheme',
  enabled: true,
  async run(page) {
    try {
      if (new URL(page.url).protocol === 'https:') return { label: 'HTTP', message: 'HTTPS in use', type: 'ok' }
    } catch { /* ignore */ }
    return { label: 'HTTP', message: 'Not using HTTPS', type: 'warn' }
  },
}
