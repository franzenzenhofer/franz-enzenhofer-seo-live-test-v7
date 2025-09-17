import type { Rule } from '@/core/types'

export const linkedImagesAltNoTextRule: Rule = {
  id: 'a11y:linked-images-alt-no-text',
  name: 'Linked images without alt and text',
  enabled: true,
  async run(page) {
    let n = 0
    const links = Array.from(page.doc.querySelectorAll('a'))
    for (const a of links) {
      const img = a.querySelector('img')
      if (!img) continue
      const alt = (img.getAttribute('alt') || '').trim()
      const txt = (a.textContent || '').trim()
      if (!alt && !txt) n++
    }
    return n ? { label: 'A11Y', message: `${n} linked images without alt and text`, type: 'warn' } : { label: 'A11Y', message: 'Linked images have alt or text', type: 'ok' }
  },
}

