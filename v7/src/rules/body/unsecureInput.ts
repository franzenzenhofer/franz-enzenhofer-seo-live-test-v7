import type { Rule } from '@/core/types'

export const unsecureInputRule: Rule = {
  id: 'body:unsecure-input',
  name: 'Unsecure input over HTTP',
  enabled: true,
  async run(page) {
    let proto = ''
    try { proto = new URL(page.url).protocol } catch {/* ignore */}
    if (proto !== 'http:') return { label: 'BODY', message: 'Page not HTTP', type: 'info' }
    const hasPwd = !!page.doc.querySelector('input[type="password"]')
    return hasPwd ? { label: 'BODY', message: 'Password input over HTTP', type: 'warn' } : { label: 'BODY', message: 'No password inputs over HTTP', type: 'ok' }
  },
}

