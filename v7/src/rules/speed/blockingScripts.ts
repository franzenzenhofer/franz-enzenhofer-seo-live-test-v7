import type { Rule } from '@/core/types'

export const blockingScriptsRule: Rule = {
  id: 'speed:blocking-scripts',
  name: 'Blocking scripts in head',
  enabled: true,
  async run(page) {
    const s = page.doc.querySelectorAll('head script[src]:not([async]):not([defer])').length
    return s ? { label: 'SPEED', message: `Blocking scripts in head: ${s}`, type: 'warn' } : { label: 'SPEED', message: 'No blocking head scripts', type: 'ok' }
  },
}

