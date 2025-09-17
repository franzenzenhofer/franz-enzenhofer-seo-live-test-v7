import type { Rule } from '@/core/types'

export const linkedImagesAltRule: Rule = {
  id: 'a11y:linked-images-alt',
  name: 'Linked Images need alt',
  enabled: true,
  async run(page) {
    const imgs = page.doc.querySelectorAll('a img')
    let n = 0
    imgs.forEach(img => { const alt = (img.getAttribute('alt') || '').trim(); if (!alt) n++ })
    return n ? { label: 'A11Y', message: `${n} linked images missing alt`, type: 'warn' } : { label: 'A11Y', message: 'Linked images have alt', type: 'ok' }
  },
}
