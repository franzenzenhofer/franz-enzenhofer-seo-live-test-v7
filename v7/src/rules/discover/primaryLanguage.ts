import type { Rule } from '@/core/types'

export const discoverPrimaryLanguageRule: Rule = {
  id: 'discover:primary-language',
  name: 'Discover: Primary language set',
  enabled: true,
  async run(page) {
    const lang = (page.doc.documentElement.getAttribute('lang') || '').trim()
    return lang ? { label: 'DISCOVER', message: `Primary language: ${lang}`, type: 'info' } : { label: 'DISCOVER', message: 'Set html[lang]', type: 'warn' }
  },
}

