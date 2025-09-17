import type { Rule } from '@/core/types'

export const htmlLangRule: Rule = {
  id: 'dom:html-lang',
  name: 'HTML lang attribute',
  enabled: true,
  async run(page) {
    const lang = (page.doc.documentElement.getAttribute('lang') || '').trim()
    return lang ? { label: 'DOM', message: `lang=${lang}`, type: 'info' } : { label: 'DOM', message: 'Missing html[lang]', type: 'warn' }
  },
}

