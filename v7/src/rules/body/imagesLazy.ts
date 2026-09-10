import type { Rule } from '@/core/types'
import { getDomPaths } from '@/shared/dom-path'
import { elementEvidence } from '@/shared/elementEvidence'
import { sampleElements } from '@/shared/domEvidence'

const NOTE = 'Absent loading attribute means eager, the browser default. Use loading=lazy only for images outside the initial viewport; never lazy-load likely LCP images.'

const loadingKind = (image: HTMLImageElement): 'lazy' | 'eager' | 'unset' => {
  const value = image.getAttribute('loading')
  if (value === null) return 'unset'
  return value.trim().toLowerCase() === 'lazy' ? 'lazy' : 'eager'
}

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Counts image loading instructions. Lazy means loading may wait until the image is near the viewport; eager and an omitted loading attribute use immediate loading. This does not measure image position or identify the main visible image.',
      action: 'Review image placement before changing loading behavior. Load the main visible image promptly and consider lazy loading for images farther down the page.',
    },
    provenance: 'google',
    references: [
      'https://web.dev/articles/browser-level-image-lazy-loading',
    ],
    description: 'Reports lazy/eager/unset loading-attribute counts for images as a neutral info fact; absent attributes are the eager browser default.',
  },
  async run(page) {
    const imgs = page.doc.querySelectorAll<HTMLImageElement>('img')
    let lazyCount = 0, eagerCount = 0, unsetCount = 0
    for (let index = 0; index < imgs.length; index++) {
      const image = imgs.item(index)
      if (!image) continue
      const kind = loadingKind(image)
      if (kind === 'lazy') lazyCount++
      else if (kind === 'eager') eagerCount++
      else unsetCount++
    }

    const all = sampleElements(imgs)
    return {
      label: 'BODY',
      message: `Image loading: ${lazyCount} lazy, ${eagerCount} eager, ${unsetCount} without loading attribute.`,
      type: 'info',
      priority: 750,
      name: 'Images lazy-loading',
      details: {
        imageLoading: all.sample.map((image) => ({ ...elementEvidence(image), loadingInstruction: image.getAttribute('loading') || '(omitted: eager by default)' })),
        domPaths: getDomPaths(all.sample),
        lazyCount, eagerCount, unsetCount,
        count: all.total, shown: all.shown, truncated: all.truncated,
        note: NOTE,
        tested: 'Counted <img> loading attribute values (lazy / eager / unset)',
      },
    }
  },
}
