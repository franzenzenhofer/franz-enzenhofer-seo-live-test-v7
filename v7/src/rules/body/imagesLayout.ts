import type { Rule } from '@/core/types'

export const imagesLayoutRule: Rule = {
  id: 'body:images-layout',
  name: 'Images missing dimensions',
  enabled: true,
  async run(page) {
    const imgs = Array.from(page.doc.querySelectorAll('img')) as HTMLImageElement[]
    let n = 0
    for (const i of imgs) if (!i.getAttribute('width') || !i.getAttribute('height')) n++
    return n ? { label: 'BODY', message: `${n} images missing width/height`, type: 'warn' } : { label: 'BODY', message: 'All images have dimensions', type: 'ok' }
  },
}

