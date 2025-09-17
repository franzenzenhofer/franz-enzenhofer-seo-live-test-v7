import type { Rule } from '@/core/types'

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  enabled: true,
  async run(page) {
    const imgs = Array.from(page.doc.querySelectorAll('img')) as HTMLImageElement[]
    let n = 0
    for (const i of imgs) if (!i.getAttribute('loading')) n++
    return n ? { label: 'BODY', message: `${n} images without loading attribute`, type: 'info' } : { label: 'BODY', message: 'Images have loading attribute', type: 'ok' }
  },
}

